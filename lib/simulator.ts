import sample from '../examples/tickets/agentic.json' with { type: 'json' };
import api from '../examples/tickets/openapi.json' with { type: 'json' };
import { executeAction, MemoryLedger } from './client.ts';
import type { Profile, Receipt, Trace, Transport } from './types.ts';
export const scenarios = {
  'response-lost': {
    title: 'Response lost after commit',
    description:
      'The service saves the ticket. The first response never reaches the client.',
  },
  normal: {
    title: 'Normal completion',
    description:
      'The service saves the ticket and returns the response normally.',
  },
  'status-unavailable': {
    title: 'Status service unavailable',
    description:
      'The write commits, but its response is lost and status checks are unavailable.',
  },
  'stale-read': {
    title: 'Resource temporarily invisible',
    description:
      'Status confirms the action, but the first resource read returns 404.',
  },
  'wrong-evidence': {
    title: 'Resource evidence mismatch',
    description:
      'The resource returned by the service refers to a different request.',
  },
  pending: {
    title: 'Action still pending',
    description:
      'The service accepts the request but has not created the ticket yet.',
  },
  expired: {
    title: 'Tracking window expired',
    description:
      'A saved request is resumed after its tracking window. The client must hand off.',
  },
} as const;
export type Scenario = keyof typeof scenarios;
export type Strategy = 'blind' | 'idempotent' | 'agentic';
export interface SimulationResult {
  strategy: Strategy;
  receipt: Receipt | null;
  outcome: string;
  tickets: number;
  calls: number;
  duplicates: number;
  falseSuccess: boolean;
  events: Trace[];
}
export class SimulatedService implements Transport {
  tickets: {
    id: string;
    request_id: string;
    subject: string;
    status: string;
  }[] = [];
  requests = new Map<
    string,
    { subject: string; resource_id: string | null; status: string }
  >();
  calls = 0;
  dropped = false;
  stale = false;
  scenario: Scenario;
  constructor(scenario: Scenario) {
    this.scenario = scenario;
  }
  async request(
    url: string,
    init: {
      method: string;
      headers?: Record<string, string>;
      body?: string;
      timeoutMs: number;
    },
  ) {
    this.calls++;
    const path = new URL(url).pathname;
    if (init.method === 'POST') {
      const key =
        init.headers?.['Idempotency-Key'] ?? 'untracked-' + this.calls;
      const input = JSON.parse(init.body ?? '{}') as { subject: string };
      let prior = this.requests.get(key);
      if (prior && prior.subject !== input.subject)
        return { status: 409, body: { error: 'key_conflict' } };
      if (!prior) {
        const pending = this.scenario === 'pending';
        const ticket = {
          id: 'T-' + String(this.tickets.length + 1).padStart(4, '0'),
          request_id: key,
          subject: input.subject,
          status: 'open',
        };
        if (!pending) this.tickets.push(ticket);
        prior = {
          subject: input.subject,
          resource_id: pending ? null : ticket.id,
          status: pending ? 'pending' : 'succeeded',
        };
        this.requests.set(key, prior);
      }
      if (
        ['response-lost', 'status-unavailable'].includes(this.scenario) &&
        !this.dropped
      ) {
        this.dropped = true;
        throw new Error('Response lost after commit');
      }
      return { status: prior.status === 'pending' ? 202 : 201, body: prior };
    }
    if (path.startsWith('/requests/')) {
      if (this.scenario === 'status-unavailable')
        return { status: 503, body: { error: 'unavailable' } };
      const id = decodeURIComponent(path.slice('/requests/'.length)),
        r = this.requests.get(id);
      return {
        status: 200,
        body: {
          request_id: id,
          status: r?.status ?? 'unknown',
          resource_id: r?.resource_id ?? null,
        },
      };
    }
    if (path.startsWith('/tickets/')) {
      if (this.scenario === 'stale-read' && !this.stale) {
        this.stale = true;
        return { status: 404, body: null };
      }
      const ticket = this.tickets.find(
        (t) => t.id === decodeURIComponent(path.slice('/tickets/'.length)),
      );
      return {
        status: ticket ? 200 : 404,
        body: ticket
          ? {
              ...ticket,
              request_id:
                this.scenario === 'wrong-evidence'
                  ? 'another-request'
                  : ticket.request_id,
            }
          : null,
      };
    }
    return { status: 404, body: null };
  }
}
export async function runDemo(
  scenario: Scenario,
  strategy: Strategy,
): Promise<SimulationResult> {
  if (
    !Object.hasOwn(scenarios, scenario) ||
    !['blind', 'idempotent', 'agentic'].includes(strategy)
  )
    throw new Error('Unknown scenario or strategy.');
  const service = new SimulatedService(scenario),
    events: Trace[] = [];
  const profile = structuredClone(sample) as Profile;
  profile.actions[0].recovery.checkDelayMs = 0;
  const requestId = 'example-request-0001',
    input = { subject: 'Please restore my account access' };
  let receipt: Receipt | null = null,
    outcome = 'unknown';
  if (strategy === 'agentic') {
    const ledger = new MemoryLedger();
    if (scenario === 'expired') {
      await executeAction({
        profile,
        openapi: api,
        actionId: 'create-ticket',
        requestId,
        input,
        ledger,
        transport: service,
        now: () => 0,
      });
      const old = await ledger.get(requestId);
      if (old) {
        delete old.receipt;
        await ledger.put(requestId, old);
      }
      service.calls = 0;
    }
    receipt = await executeAction({
      profile,
      openapi: api,
      actionId: 'create-ticket',
      requestId,
      input,
      ledger,
      transport: service,
      onTrace: (e) => events.push(e),
      now: scenario === 'expired' ? () => 86400001 : undefined,
    });
    outcome = receipt.outcome;
  } else {
    if (scenario === 'expired') {
      await service.request(profile.origin + '/tickets', {
        method: 'POST',
        headers: { 'Idempotency-Key': requestId },
        body: JSON.stringify(input),
        timeoutMs: 3000,
      });
      service.calls = 0;
      outcome = 'unknown';
      events.push({
        kind: 'result',
        message: 'This baseline has no durable recovery implementation.',
      });
    } else
      for (let attempt = 0; attempt < 2; attempt++) {
        const key =
          strategy === 'idempotent' ? requestId : requestId + '-' + attempt;
        events.push({
          kind: 'submit',
          message:
            'Submit attempt ' +
            (attempt + 1) +
            (strategy === 'idempotent'
              ? ' with the same request ID.'
              : ' with a new request ID.'),
        });
        try {
          const res = await service.request(profile.origin + '/tickets', {
            method: 'POST',
            headers: { 'Idempotency-Key': key },
            body: JSON.stringify(input),
            timeoutMs: 3000,
          });
          if (res.status >= 200 && res.status < 300) {
            outcome = 'succeeded';
            events.push({
              kind: 'result',
              message:
                'Reported success from the HTTP response; no resource verification.',
            });
            break;
          }
        } catch {
          events.push({
            kind: 'interrupted',
            message: 'The response was lost; preparing another attempt.',
          });
        }
      }
  }
  return {
    strategy,
    receipt,
    outcome,
    tickets: service.tickets.length,
    calls: service.calls,
    duplicates: Math.max(0, service.tickets.length - 1),
    falseSuccess: outcome === 'succeeded' && service.tickets.length === 0,
    events,
  };
}
export async function runComparison(scenario: Scenario) {
  return Promise.all(
    (['blind', 'idempotent', 'agentic'] as Strategy[]).map((strategy) =>
      runDemo(scenario, strategy),
    ),
  );
}
