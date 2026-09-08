import { readFileSync } from 'node:fs';
import { executeAction } from '../../lib/client.ts';
import { httpTransport } from '../../lib/http-transport.ts';
import { SqliteLedger } from './ledger.ts';
import type { Profile } from '../../lib/types.ts';

// The compatibility harness supplies only loopback test origins and a private temporary ledger path.
const input = JSON.parse(readFileSync(0, 'utf8')) as {
  profile: Profile;
  openapi: unknown;
  request_id: string;
  input: { subject: string };
  ledger_path: string;
  test_crash_after_submit?: boolean;
};
const origin = new URL(input.profile.origin);
if (origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1')
  throw new Error('Compatibility adapter accepts only the loopback harness.');
const ledger = new SqliteLedger(input.ledger_path);
try {
  const receipt = await executeAction({
    profile: input.profile,
    openapi: input.openapi,
    actionId: input.profile.actions[0].id,
    requestId: input.request_id,
    input: input.input,
    ledger,
    transport: httpTransport(input.profile.origin),
    allowLocal: true,
    afterSubmit: input.test_crash_after_submit
      ? () => process.exit(86)
      : undefined,
  });
  console.log(JSON.stringify(receipt));
} finally {
  ledger.close();
}
