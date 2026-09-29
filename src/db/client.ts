import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;

let instance: Db | undefined;

function getConnectionString(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error(
      'DATABASE_URL is not set. Add it to apps/studyjam/.env.local for local dev — see apps/studyjam/.env.local.example.',
    );
  }
  return value;
}

export function getDb(): Db {
  if (!instance) {
    instance = drizzle(
      postgres(getConnectionString(), {
        // A single connection serializes concurrent requests onto one
        // socket and can stall badly through a pooler (observed: a `select`
        // right after a `db.transaction()` hanging for 90s+ behind
        // Supabase's pgbouncer). A small pool avoids that.
        max: 5,
        // Required behind Supabase's transaction pooler (pgbouncer) — it
        // doesn't support server-side prepared statements.
        prepare: false,
      }),
      { schema },
    );
  }
  return instance;
}
