import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { handle } from '../server/app.ts';

const port = Number(process.env.PLATFORM_PORT ?? 3002);
process.env.AGENTIC_ORIGIN ??= 'http://127.0.0.1:' + port;
process.env.AGENTIC_ALLOW_LOCAL = '1';
createServer(async (req, res) => {
  const request = new Request(process.env.AGENTIC_ORIGIN + req.url!, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    ...(req.method !== 'GET' && req.method !== 'HEAD'
      ? { body: Readable.toWeb(req), duplex: 'half' }
      : {}),
  } as RequestInit);
  try {
    const response = await handle(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) Readable.fromWeb(response.body as any).pipe(res);
    else res.end();
  } catch {
    res.writeHead(500);
    res.end('Local platform adapter failed.');
  }
}).listen(port, '127.0.0.1', () =>
  console.log('Agentic platform listening on http://127.0.0.1:' + port),
);
