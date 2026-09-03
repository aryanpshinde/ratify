import type { Context } from 'hono';
import { auth } from './auth.js';

export async function getSession(c: Context) {
  try {
    return await auth.api.getSession({ headers: c.req.raw.headers });
  } catch (error) {
    console.warn(
      '[getSession] Failed to resolve session:',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
