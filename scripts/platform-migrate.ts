import { readFile } from 'node:fs/promises';
import { getMigrations } from 'better-auth/db/migration';
import { database, closeDatabase } from '../server/db.ts';
import { authOptions } from '../server/auth.ts';

await database().query(
  await readFile(new URL('../server/schema.sql', import.meta.url), 'utf8'),
);
const migration = await getMigrations(authOptions());
if (migration.schemaProblems.length || migration.unsafeChanges.length)
  throw new Error('Auth migration needs manual review.');
await migration.runMigrations();
console.log('Platform and Agent Auth database migrations applied.');
await closeDatabase();
