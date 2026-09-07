import { readFile } from 'node:fs/promises';
import { executeAction } from '../../lib/client.ts';
import { httpTransport } from '../../lib/http-transport.ts';
import { SqliteLedger } from './ledger.ts';
import type { Profile } from '../../lib/types.ts';
const [
  origin = 'http://127.0.0.1:4318',
  requestId = 'example-request-001',
  subject = 'Please help with my account',
  state = '.agentic-state/node.sqlite3',
] = process.argv.slice(2);
const profile = JSON.parse(
  await readFile('examples/tickets/agentic.json', 'utf8'),
) as Profile;
profile.origin = origin;
const openapi = JSON.parse(
  await readFile('examples/tickets/openapi.json', 'utf8'),
);
const ledger = new SqliteLedger(state);
try {
  const receipt = await executeAction({
    profile,
    openapi,
    actionId: 'create-ticket',
    requestId,
    input: { subject },
    ledger,
    transport: httpTransport(origin),
    allowLocal: true,
    onTrace: (e) => console.error(e.kind + ': ' + e.message),
    afterSubmit:
      process.env.AGENTIC_TEST_CRASH === '1'
        ? () => process.exit(86)
        : undefined,
  });
  console.log(JSON.stringify(receipt, null, 2));
  if (receipt.outcome !== 'succeeded') process.exitCode = 2;
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
} finally {
  ledger.close();
}
