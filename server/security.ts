import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { database } from './db.ts';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');
export const secret = () => Buffer.from(randomBytes(32)).toString('base64url');
export const publicOrigin = () =>
  process.env.AGENTIC_ORIGIN ?? 'https://ruagentic.org';
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== publicOrigin())
    throw new HttpError(403, 'Origin is not allowed.');
}
export async function jsonBody(
  request: Pick<Request, 'headers' | 'body'>,
  max = 350000,
): Promise<any> {
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new HttpError(415, 'Send application/json.');
  if (Number(request.headers.get('content-length')) > max)
    throw new HttpError(413, 'Request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'JSON body required.');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, 'Request is too large.');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}
export async function rateLimit(key: string, max: number, seconds = 60) {
  const result = await database().query(
    `INSERT INTO platform_rate_limits(key,count,expires_at) VALUES($1,1,now()+$2 * interval '1 second')
     ON CONFLICT(key) DO UPDATE SET count=CASE WHEN platform_rate_limits.expires_at<now() THEN 1 ELSE platform_rate_limits.count+1 END,
     expires_at=CASE WHEN platform_rate_limits.expires_at<now() THEN EXCLUDED.expires_at ELSE platform_rate_limits.expires_at END RETURNING count`,
    [digest(key), seconds],
  );
  if (result.rows[0].count > max)
    throw new HttpError(429, 'Rate limit reached. Try again shortly.');
}
export function clientAddress(request: Request) {
  // This header is overwritten by Vercel, unlike caller-supplied forwarding headers.
  return process.env.VERCEL
    ? (request.headers.get('x-vercel-forwarded-for') ?? 'unknown')
    : 'local';
}
export async function createSession() {
  const id = randomUUID(),
    token = secret();
  const expires = new Date(Date.now() + 30 * 86400000);
  await database().query(
    'INSERT INTO platform_sessions(id,token_hash,expires_at) VALUES($1,$2,$3)',
    [id, digest(token), expires],
  );
  return { id, token, expires: expires.toISOString() };
}
export async function owner(request: Request) {
  const bearer = request.headers
    .get('authorization')
    ?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('agentic_session='))
    ?.slice(16);
  const token = bearer ?? cookie;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new HttpError(401, 'Create a sandbox session first.');
  const result = await database().query(
    'SELECT id FROM platform_sessions WHERE token_hash=$1 AND expires_at>now() AND revoked_at IS NULL',
    [digest(token)],
  );
  if (!result.rowCount) throw new HttpError(401, 'Session expired or revoked.');
  return result.rows[0].id as string;
}
export function sessionCookie(token: string) {
  return `agentic_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${publicOrigin().startsWith('https:') ? '; Secure' : ''}`;
}
