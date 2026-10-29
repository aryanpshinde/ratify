import { Hono } from 'hono';
import { db } from '../db/index.js';
import { clients, projects, deliverables, deliverableVersions } from '../db/schema.js';
import { getSession } from '../lib/session.js';
import { getUuidParam } from '../lib/params.js';
import { sweepFileKeys } from '../lib/storage.js';
import { createClientSchema, updateClientSchema } from '@ratify/shared';
import { desc, eq, and, sql, isNotNull } from 'drizzle-orm';

const clientRoutes = new Hono();

clientRoutes.get('/', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const rows = await db
    .select({
      id: clients.id,
      ownerId: clients.ownerId,
      userId: clients.userId,
      name: clients.name,
      email: clients.email,
      company: clients.company,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
    })
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

  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { status: 'error', message: 'Validation Failed', error: parsed.error.issues },
      400,
    );
  }

  const data = parsed.data;

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(
      and(
        eq(clients.ownerId, session.user.id),
        sql`lower(${clients.email}) = lower(${data.email})`,
      ),
    )
    .limit(1);
  if (existing) {
    return c.json({ status: 'error', message: 'Email already exists' }, 409);
  }

  let created: (typeof clients.$inferSelect)[] | undefined;
  try {
    created = await db
      .insert(clients)
      .values({
        ownerId: session.user.id,
        name: data.name,
        email: data.email,
        company: data.company ?? null,
      })
      .returning();
  } catch (err: unknown) {
    const code =
      (err as { code?: unknown }).code ?? (err as { cause?: { code?: unknown } }).cause?.code;
    if (code === '23505') {
      return c.json({ status: 'error', message: 'Email already exists' }, 409);
    }
    throw err;
  }

  const inserted = created?.[0];

  if (!inserted) {
    return c.json({ status: 'error', message: 'Failed to create client' }, 500);
  }

  return c.json({ status: 'ok', data: inserted }, 201);
});

clientRoutes.get('/:id', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  const [client] = await db
    .select({
      id: clients.id,
      ownerId: clients.ownerId,
      userId: clients.userId,
      name: clients.name,
      email: clients.email,
      company: clients.company,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
    })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.ownerId, session.user.id)))
    .limit(1);

  if (!client) {
    return c.json({ status: 'error', message: 'Client not found' }, 404);
  }

  return c.json({ status: 'ok', data: client });
});

clientRoutes.patch('/:id', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ status: 'error', message: 'Invalid JSON body' }, 400);
  }

  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { status: 'error', message: 'Validation Failed', error: parsed.error.issues },
      400,
    );
  }

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.ownerId, session.user.id)))
    .limit(1);

  if (!existing) {
    return c.json({ status: 'error', message: 'Client not found' }, 404);
  }

  const data = parsed.data;

  if (data.email !== undefined) {
    const [duplicate] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(
        and(
          eq(clients.ownerId, session.user.id),
          sql`lower(${clients.email}) = lower(${data.email})`,
        ),
      )
      .limit(1);
    if (duplicate && duplicate.id !== id) {
      return c.json({ status: 'error', message: 'Client email already exists' }, 409);
    }
  }

  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload['name'] = data.name;
  if (data.email !== undefined) payload['email'] = data.email;
  if (data.company !== undefined) payload['company'] = data.company === '' ? null : data.company;

  const [updated] = await db
    .update(clients)
    .set(payload)
    .where(and(eq(clients.id, id), eq(clients.ownerId, session.user.id)))
    .returning();

  if (!updated) {
    return c.json({ status: 'error', message: 'Client not found' }, 404);
  }

  return c.json({ status: 'ok', data: updated });
});

clientRoutes.delete('/:id', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.ownerId, session.user.id)))
    .limit(1);

  if (!existing) {
    return c.json({ status: 'error', message: 'Client not found' }, 404);
  }

  const keyRows = await db
    .select({ fileKey: deliverableVersions.fileKey })
    .from(deliverableVersions)
    .innerJoin(deliverables, eq(deliverableVersions.deliverableId, deliverables.id))
    .innerJoin(projects, eq(deliverables.projectId, projects.id))
    .where(and(eq(projects.clientId, id), isNotNull(deliverableVersions.fileKey)));

  const fileKeys = keyRows.flatMap((row) => (row.fileKey ? [row.fileKey] : []));

  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.ownerId, session.user.id)));

  await sweepFileKeys(fileKeys);

  return c.json({ status: 'ok', data: id });
});

export default clientRoutes;
