import type { Context } from 'hono';
import { auth } from './auth.js';

export async function getSession(c: Context) {
  try {
    return await auth.api.getSession({ headers: c.req.raw.headers });
  } catch {
    return null;
  }
}
