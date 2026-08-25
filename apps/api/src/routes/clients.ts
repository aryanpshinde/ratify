import { Hono } from 'hono';
import { db } from '../db/index.js';
import { clients } from '../db/schema.js';
import { getSession } from '../lib/session.js';
import { createClientSchema } from '@ratify/shared';
import { desc, eq } from 'drizzle-orm';

const clientRoutes = new Hono();

clientRoutes.get('/', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.ownerId, session.user.id))
    .orderBy(desc(clients.createdAt));

  return c.json({ status: 'ok', data: rows });
});

clientRoutes.post('/', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ status: 'error', message: 'Invalid JSON body' }, 400);
  }

  const result = createClientSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { status: 'error', message: 'Validation Failed', error: result.error.issues },
      400,
    );
  }

  const data = result.data;

  const [created] = await db
    .insert(clients)
    .values({
      ownerId: session.user.id,
      name: data.name,
      email: data.email,
      company: data.company ?? null,
    })
    .returning();

  if (!created) {
    return c.json({ status: 'error', message: 'Failed to create client' }, 500);
  }

  return c.json({ status: 'ok', data: created }, 201);
});

export default clientRoutes;
