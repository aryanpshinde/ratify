import { drizzle, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../lib/env.js';
import * as schema from './schema.js';
import type { PgDatabase } from 'drizzle-orm/pg-core';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export type DbOrTx = PgDatabase<NodePgQueryResultHKT, typeof schema>;
