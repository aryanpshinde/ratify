import { drizzle, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../lib/env.js';
import * as schema from './schema.js';
import type { PgDatabase } from 'drizzle-orm/pg-core';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

pool.on('error', (error) => {
  console.error(`[db] idle connection error: ${error.message}`);
});

export const db = drizzle(pool, { schema });
export { pool };
export type DbOrTx = PgDatabase<NodePgQueryResultHKT, typeof schema>;
