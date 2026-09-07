import { betterAuth } from 'better-auth';
import { agentAuth } from '@better-auth/agent-auth';
import { database } from './db.ts';
import {
  publicOrigin,
  digest,
  HttpError,
  rateLimit,
  jsonBody,
} from './security.ts';
import { runSandbox } from './sandbox.ts';
import { validateProfile } from '../lib/validation.ts';

export function authOptions() {
  return {
    appName: 'Agentic sandbox',
    baseURL: publicOrigin(),
    basePath: '/api/auth',
    secret: process.env.BETTER_AUTH_SECRET,
    database: database(),
    trustedOrigins: [publicOrigin()],
    advanced: {
      ipAddress: {
        ipAddressHeaders: process.env.VERCEL ? ['x-vercel-forwarded-for'] : [],
      },
    },
    rateLimit: { enabled: true, storage: 'database' as const },
    secondaryStorage: {
      get: async (key: string) =>
        (
          await database().query(
            'SELECT value FROM platform_auth_cache WHERE key=$1 AND expires_at>now()',
            [digest(key)],
          )
        ).rows[0]?.value ?? null,
      set: async (key: string, value: string, ttl?: number) => {
        if (key.startsWith('agent-auth:jti:')) {
          const inserted = await database().query(
            `INSERT INTO platform_auth_cache(key,value,expires_at) VALUES($1,$2,now()+$3*interval '1 second')
            ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,expires_at=EXCLUDED.expires_at WHERE platform_auth_cache.expires_at<=now() RETURNING key`,
            [digest(key), value, ttl ?? 3600],
          );
          if (!inserted.rowCount)
            throw new HttpError(401, 'Signed request was already used.');
          return;
        }
        await database().query(
          `INSERT INTO platform_auth_cache(key,value,expires_at) VALUES($1,$2,now()+$3*interval '1 second')
          ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,expires_at=EXCLUDED.expires_at`,
          [digest(key), value, ttl ?? 3600],
        );
      },
      delete: async (key: string) => {
        await database().query('DELETE FROM platform_auth_cache WHERE key=$1', [
          digest(key),
        ]);
      },
      getAndDelete: async (key: string) =>
        (
          await database().query(
            'DELETE FROM platform_auth_cache WHERE key=$1 AND expires_at>now() RETURNING value',
            [digest(key)],
          )
        ).rows[0]?.value ?? null,
      increment: async (key: string, ttl: number) =>
        Number(
          (
            await database().query(
              `INSERT INTO platform_auth_cache(key,value,expires_at) VALUES($1,'1',now()+$2*interval '1 second')
        ON CONFLICT(key) DO UPDATE SET value=CASE WHEN platform_auth_cache.expires_at<now() THEN '1' ELSE (platform_auth_cache.value::integer+1)::text END,
        expires_at=CASE WHEN platform_auth_cache.expires_at<now() THEN EXCLUDED.expires_at ELSE platform_auth_cache.expires_at END RETURNING value`,
              [digest(key), ttl],
            )
          ).rows[0].value,
        ),
    },
    plugins: [
      agentAuth({
        providerName: 'Agentic',
        providerDescription:
          'Isolated synthetic recovery tests and profile validation.',
        modes: ['autonomous'],
        approvalMethods: [],
        agentSessionTTL: 3600,
        agentMaxLifetime: 86400,
        absoluteLifetime: 86400,
        allowDynamicHostRegistration: true,
        jtiCacheStorage: 'secondary-storage',
        jwksCacheStorage: 'secondary-storage',
        defaultHostCapabilities: ['agentic.validate', 'agentic.sandbox.run'],
        resolveAutonomousUser: ({ agentId }) => ({
          id: 'agent:' + agentId,
          name: 'Sandbox agent',
          email: agentId + '@sandbox.invalid',
        }),
        resolveGrantTTL: () => 3600,
        capabilities: [
          {
            name: 'agentic.validate',
            description:
              'Validate an Agentic profile and optional OpenAPI document.',
            approvalStrength: 'none',
            input: {
              type: 'object',
              properties: {
                profile: { type: 'object' },
                openapi: { type: 'object' },
              },
              required: ['profile'],
              additionalProperties: false,
            },
          },
          {
            name: 'agentic.sandbox.run',
            description:
              'Create one synthetic ticket and return recovery evidence in this agent’s isolated sandbox.',
            approvalStrength: 'none',
            input: {
              type: 'object',
              properties: {
                scenario: {
                  type: 'string',
                  enum: [
                    'normal',
                    'response-lost',
                    'restart-after-submit',
                    'status-unavailable',
                    'wrong-evidence',
                    'pending',
                  ],
                },
                requestId: { type: 'string', minLength: 8, maxLength: 128 },
                resume: { type: 'boolean' },
              },
              additionalProperties: false,
            },
          },
        ],
        onExecute: async ({ capability, arguments: args, agentSession }) => {
          await rateLimit('agent:' + agentSession.agentId, 12);
          if (capability === 'agentic.validate')
            return validateProfile(args?.profile, args?.openapi);
          if (capability === 'agentic.sandbox.run')
            return runSandbox('agent:' + agentSession.agentId, args ?? {});
          throw new HttpError(403, 'Capability is not available.');
        },
      }),
    ],
  } satisfies Parameters<typeof betterAuth>[0];
}
let instance: ReturnType<typeof createAuth> | undefined;
function createAuth() {
  return betterAuth(authOptions());
}
export function auth() {
  return (instance ??= createAuth());
}

export async function authHandler(request: Request) {
  const body =
    request.method === 'POST' ? await jsonBody(request.clone(), 350000) : null;
  function inlineKeysOnly(value: unknown, depth = 0): void {
    if (depth > 64)
      throw new HttpError(400, 'Authentication payload is too deeply nested.');
    if (
      typeof value === 'string' &&
      /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)
    ) {
      try {
        inlineKeysOnly(
          JSON.parse(
            Buffer.from(value.split('.')[1], 'base64url').toString('utf8'),
          ),
          depth + 1,
        );
      } catch (error) {
        if (error instanceof HttpError) throw error;
      }
    } else if (value && typeof value === 'object')
      for (const [key, child] of Object.entries(value)) {
        if (/jwks.*url/i.test(key) && child)
          throw new HttpError(
            400,
            'This sandbox supports inline public keys, not remote JWKS URLs.',
          );
        inlineKeysOnly(child, depth + 1);
      }
  }
  inlineKeysOnly(body);
  inlineKeysOnly(request.headers.get('authorization')?.replace(/^Bearer /, ''));
  // Serialize duplicate JWTs before the SDK's check-and-store replay guard.
  // The SDK verifies signatures, audience, expiry, host/agent state and grants.
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token) return auth().handler(request);
  const client = await database().connect();
  const key = 'auth-jwt:' + digest(token);
  let locked = false;
  try {
    locked = (
      await client.query(
        'SELECT pg_try_advisory_lock(hashtextextended($1,0)) AS locked',
        [key],
      )
    ).rows[0].locked;
    if (!locked)
      throw new HttpError(
        409,
        'This signed request is already being processed.',
      );
    return await auth().handler(request);
  } finally {
    try {
      if (locked)
        await client.query(
          'SELECT pg_advisory_unlock(hashtextextended($1,0))',
          [key],
        );
      client.release();
    } catch {
      client.release(true);
    }
  }
}
