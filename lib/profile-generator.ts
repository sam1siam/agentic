import type { Profile } from './types.ts';

export const starterSettings = {
  origin: 'https://support.example',
  actionId: 'create-ticket',
  description: 'Create a support ticket and verify the original result.',
  openapi: '/openapi.json',
  submit: 'createTicket',
  status: 'getRequestStatus',
  verify: 'getTicket',
  statusRequestId: 'requestId',
  verifyResourceId: 'ticketId',
  resourceIdPointer: '/id',
  requestIdPointer: '/request_id',
  statePointer: '/status',
  successValues: 'open, closed',
  inputPointer: '/subject',
  resourcePointer: '/subject',
  retentionSeconds: '86400',
};
export type StarterSettings = typeof starterSettings;

export function normalizeServiceOrigin(value: string) {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    if (
      url.protocol === 'https:' &&
      url.pathname === '/' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    )
      return url.origin;
  } catch {
    /* Keep invalid input visible to the validator. */
  }
  return trimmed;
}

export function buildProfile(settings: StarterSettings): Profile {
  return {
    $schema: 'https://ruagentic.org/schemas/agentic-1.0.schema.json',
    agentic: '1.0.0',
    origin: normalizeServiceOrigin(settings.origin),
    actions: [
      {
        id: settings.actionId.trim(),
        description: settings.description.trim(),
        openapi: settings.openapi.trim(),
        submit: settings.submit.trim(),
        status: settings.status.trim(),
        verify: settings.verify.trim(),
        request: {
          header: 'Idempotency-Key',
          scope: 'principal-action',
          retentionSeconds: Number(settings.retentionSeconds),
        },
        bindings: {
          statusRequestId: settings.statusRequestId.trim(),
          verifyResourceId: settings.verifyResourceId.trim(),
        },
        evidence: {
          resourceIdPointer: settings.resourceIdPointer.trim(),
          requestIdPointer: settings.requestIdPointer.trim(),
          statePointer: settings.statePointer.trim(),
          successValues: settings.successValues
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          inputBindings: [
            {
              inputPointer: settings.inputPointer.trim(),
              resourcePointer: settings.resourcePointer.trim(),
            },
          ],
        },
        recovery: {
          maxChecks: 3,
          checkDelayMs: 100,
          timeoutMs: 3000,
          retry: 'never-automatically',
        },
      },
    ],
  };
}
