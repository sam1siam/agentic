import { database } from './db.ts';
import type { Ledger, LedgerEntry } from '../lib/types.ts';
import type pg from 'pg';

export class PostgresLedger implements Ledger {
  private client?: pg.PoolClient;
  private owner: string;
  constructor(owner: string) {
    this.owner = owner;
  }
  async exclusive<T>(key: string, fn: () => Promise<T>) {
    const client = await database().connect();
    const lockKey = this.owner + ':' + key;
    let locked = false;
    try {
      locked = (
        await client.query(
          'SELECT pg_try_advisory_lock(hashtextextended($1,0)) AS locked',
          [lockKey],
        )
      ).rows[0].locked;
      if (!locked)
        throw new Error('This request is already running. Resume it shortly.');
      this.client = client;
      return await fn();
    } finally {
      this.client = undefined;
      // A broken connection is destroyed; PostgreSQL releases its session lock.
      try {
        if (locked)
          await client.query(
            'SELECT pg_advisory_unlock(hashtextextended($1,0))',
            [lockKey],
          );
        client.release();
      } catch {
        client.release(true);
      }
    }
  }
  async get(key: string): Promise<LedgerEntry | undefined> {
    if (!this.client) throw new Error('Ledger access requires a lock.');
    return (
      await this.client.query(
        'SELECT entry FROM platform_ledger WHERE owner_id=$1 AND request_id=$2',
        [this.owner, key],
      )
    ).rows[0]?.entry;
  }
  async put(key: string, entry: LedgerEntry) {
    if (!this.client) throw new Error('Ledger access requires a lock.');
    await this.client.query(
      `INSERT INTO platform_ledger(owner_id,request_id,entry) VALUES($1,$2,$3)
      ON CONFLICT(owner_id,request_id) DO UPDATE SET entry=EXCLUDED.entry,updated_at=now()`,
      [this.owner, key, JSON.stringify(entry)],
    );
  }
}
