import {
  assertInput,
  assertProfile,
  canonical,
  operation,
  pointer,
} from './validation.ts';
import type {
  Ledger,
  LedgerEntry,
  Profile,
  Receipt,
  Trace,
  Transport,
} from './types.ts';

export interface ExecuteOptions {
  profile: Profile;
  openapi: unknown;
  actionId: string;
  requestId: string;
  input: unknown;
  ledger: Ledger;
  transport: Transport;
  allowLocal?: boolean;
  onTrace?: (event: Trace) => void;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  afterSubmit?: () => void;
}
export async function executeAction(o: ExecuteOptions): Promise<Receipt> {
  assertProfile(o.profile, o.openapi, o.allowLocal);
  assertInput(o.input);
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(o.requestId))
    throw new Error(
      'Request ID must be 8–128 letters, digits, underscores, or hyphens.',
    );
  const action = o.profile.actions.find((a) => a.id === o.actionId);
  if (!action) throw new Error('Unknown action.');
  for (const b of action.evidence.inputBindings)
    if (pointer(o.input, b.inputPointer) === undefined)
      throw new Error('Missing input evidence at ' + b.inputPointer);
  const now = o.now ?? Date.now,
    sleep =
      o.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const emit = (kind: Trace['kind'], message: string) =>
    o.onTrace?.({ kind, message });
  const identity = canonical({
    profile: o.profile,
    openapi: o.openapi,
    actionId: o.actionId,
  });
  const key = o.requestId;
  return o.ledger.exclusive(key, async () => {
    let entry = await o.ledger.get(key);
    const fresh = !entry;
    if (
      entry &&
      (entry.identity !== identity || entry.input !== canonical(o.input))
    )
      throw new Error(
        'Request ID is already bound to a different origin, profile, operation, or input.',
      );
    if (entry?.receipt?.outcome === 'succeeded') {
      emit('result', 'Returning the saved, time-stamped receipt.');
      return entry.receipt;
    }
    if (!entry) {
      entry = {
        requestId: key,
        identity,
        input: canonical(o.input),
        createdAt: now(),
        phase: 'prepared',
      };
      await o.ledger.put(key, entry);
      emit('save', 'Request identity and input saved before submission.');
    }
    const record = entry as LedgerEntry;
    const finish = async (
      outcome: Receipt['outcome'],
      reason: string,
      resource_id: string | null = null,
      evidence?: Receipt['evidence'],
    ) => {
      const receipt: Receipt = {
        agentic: '1.0.0',
        request_id: key,
        action_id: action.id,
        origin: o.profile.origin,
        outcome,
        observed_at: new Date(now()).toISOString(),
        resource_id,
        reason,
        ...(evidence ? { evidence } : {}),
      };
      record.receipt = receipt;
      await o.ledger.put(key, record);
      emit('result', reason);
      return receipt;
    };
    const age = now() - record.createdAt;
    if (age < 0 || age >= action.request.retentionSeconds * 1000)
      return finish(
        'unknown',
        'Request tracking window expired or the clock moved backwards. Handoff required.',
      );
    const submit = operation(o.openapi, action.submit),
      status = operation(o.openapi, action.status),
      verify = operation(o.openapi, action.verify);
    const call = (path: string, method: string, body?: string) =>
      o.transport.request(new URL(path, o.profile.origin).href, {
        method,
        headers:
          method === 'POST'
            ? {
                'Content-Type': 'application/json',
                [action.request.header]: key,
              }
            : undefined,
        body,
        timeoutMs: action.recovery.timeoutMs,
      });
    if (fresh) {
      record.phase = 'sent';
      await o.ledger.put(key, record);
      emit('submit', 'Submitting the action once with the saved request ID.');
      try {
        await call(submit.path, 'POST', JSON.stringify(o.input));
      } catch {
        emit(
          'interrupted',
          'Submission response unavailable. The outcome is unknown.',
        );
      }
      // Integration hook used by the crash test; never part of a published profile.
      o.afterSubmit?.();
    } else {
      emit(
        'save',
        'Resuming the saved request. No new write will be submitted.',
      );
    }
    let last: Receipt['outcome'] = 'unknown',
      reason = 'No authoritative result could be verified. Handoff required.';
    for (let i = 0; i < action.recovery.maxChecks; i++) {
      if (i) await sleep(action.recovery.checkDelayMs);
      if (now() - record.createdAt >= action.request.retentionSeconds * 1000)
        return finish(
          'unknown',
          'Request tracking window expired. Handoff required.',
        );
      try {
        emit(
          'status',
          'Checking the original request (' +
            (i + 1) +
            '/' +
            action.recovery.maxChecks +
            ').',
        );
        const res = await call(
          status.path.replace(
            '{' + action.bindings.statusRequestId + '}',
            encodeURIComponent(key),
          ),
          'GET',
        );
        const state = res.body as Record<string, unknown> | null;
        if (
          res.status !== 200 ||
          !state ||
          state.request_id !== key ||
          !['succeeded', 'failed', 'pending', 'unknown'].includes(
            String(state.status),
          )
        ) {
          last = 'unknown';
          reason =
            'Status is unavailable, invalid, or refers to another request. Handoff required.';
          continue;
        }
        if (state.status === 'failed')
          return finish(
            'failed',
            'The service reports that this request failed.',
          );
        if (state.status === 'pending') {
          last = 'pending';
          reason =
            'The service still reports this request as pending. Resume later with the same request ID.';
          continue;
        }
        if (
          state.status !== 'succeeded' ||
          typeof state.resource_id !== 'string' ||
          !state.resource_id
        ) {
          last = 'unknown';
          continue;
        }
        const resourceId = state.resource_id;
        const url = new URL(
          verify.path.replace(
            '{' + action.bindings.verifyResourceId + '}',
            encodeURIComponent(resourceId),
          ),
          o.profile.origin,
        ).href;
        emit(
          'verify',
          'Reading the resulting resource and checking its identity, input, and state.',
        );
        const read = await o.transport.request(url, {
          method: 'GET',
          timeoutMs: action.recovery.timeoutMs,
        });
        const id = pointer(read.body, action.evidence.resourceIdPointer),
          request = pointer(read.body, action.evidence.requestIdPointer),
          observedState = pointer(read.body, action.evidence.statePointer);
        const match =
          read.status === 200 &&
          id === resourceId &&
          request === key &&
          typeof observedState === 'string' &&
          action.evidence.successValues.includes(observedState) &&
          action.evidence.inputBindings.every(
            (b) =>
              pointer(read.body, b.resourcePointer) !== undefined &&
              canonical(pointer(read.body, b.resourcePointer)) ===
                canonical(pointer(o.input, b.inputPointer)),
          );
        if (match)
          return finish(
            'succeeded',
            'The original action was verified against the persisted resource.',
            resourceId,
            {
              url,
              resource_id: resourceId,
              request_id: key,
              state: observedState as string,
              matched: action.evidence.inputBindings,
            },
          );
        last = 'unknown';
        reason =
          'The resource is unavailable or does not match the required evidence. Handoff required.';
      } catch {
        last = 'unknown';
        reason = 'The verification request was interrupted. Handoff required.';
      }
    }
    return finish(last, reason);
  });
}
export class MemoryLedger implements Ledger {
  private records = new Map<string, LedgerEntry>();
  private locks = new Set<string>();
  async exclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.locks.has(key))
      throw new Error('This request is already running.');
    this.locks.add(key);
    try {
      return await fn();
    } finally {
      this.locks.delete(key);
    }
  }
  async get(key: string) {
    return structuredClone(this.records.get(key));
  }
  async put(key: string, entry: LedgerEntry) {
    this.records.set(key, structuredClone(entry));
  }
}
