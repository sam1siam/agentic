import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Ledger, LedgerEntry } from '../../lib/types.ts';
/** Single-host SQLite ledger. Dead-process lock takeover is atomic; PID reuse fails closed. */
export class SqliteLedger implements Ledger {
  private db: DatabaseSync;
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db.exec(
      'PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS records (key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS locks (key TEXT PRIMARY KEY, pid INTEGER NOT NULL, token TEXT NOT NULL);',
    );
  }
  async exclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const token = randomUUID();
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const owner = this.db
        .prepare('SELECT pid FROM locks WHERE key=?')
        .get(key) as { pid: number } | undefined;
      if (owner) {
        let alive = true;
        try {
          process.kill(owner.pid, 0);
        } catch (e) {
          alive = (e as NodeJS.ErrnoException).code !== 'ESRCH';
        }
        if (alive)
          throw new Error('This request is locked by an active process.');
      }
      this.db
        .prepare('INSERT OR REPLACE INTO locks(key,pid,token) VALUES(?,?,?)')
        .run(key, process.pid, token);
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
    try {
      return await fn();
    } finally {
      this.db
        .prepare('DELETE FROM locks WHERE key=? AND token=?')
        .run(key, token);
    }
  }
  async get(key: string): Promise<LedgerEntry | undefined> {
    const row = this.db
      .prepare('SELECT value FROM records WHERE key=?')
      .get(key) as { value: string } | undefined;
    return row ? JSON.parse(row.value) : undefined;
  }
  async put(key: string, entry: LedgerEntry) {
    this.db
      .prepare('INSERT OR REPLACE INTO records(key,value) VALUES(?,?)')
      .run(key, JSON.stringify(entry));
  }
  close() {
    this.db.close();
  }
}
