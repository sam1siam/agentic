import pg from 'pg';

let pool: pg.Pool | undefined;
export function database() {
  // Session advisory locks require a direct connection, not PgBouncer transaction pooling.
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL;
  if (!connectionString)
    throw new Error('The platform database is not configured.');
  const connectionUrl = new URL(connectionString);
  if (connectionUrl.searchParams.has('sslmode'))
    connectionUrl.searchParams.set('sslmode', 'verify-full');
  return (pool ??= new pg.Pool({
    connectionString: connectionUrl.href,
    max: 5,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 15000,
    statement_timeout: 10000,
    application_name: 'agentic-platform',
  }));
}

export async function transaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
) {
  const client = await database().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDatabase() {
  await pool?.end();
  pool = undefined;
}
