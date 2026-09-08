import { Hono } from 'hono';
import { db } from '../db/index.js';
import { projects, clients } from '../db/schema.js';
import { getSession } from '../lib/session.js';
import { logActivity } from '../lib/activity.js';
import { createProjectSchema } from '@ratify/shared';
import { eq, and } from 'drizzle-orm';

const projectRoutes = new Hono();

projectRoutes.post('/', async (c) => {
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

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { status: 'error', message: 'Validation Failed', error: parsed.error.issues },
      400,
    );
  }

  const data = parsed.data;

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, data.clientId), eq(clients.ownerId, session.user.id)))
    .limit(1);

  if (!client) {
    return c.json({ status: 'error', message: 'Client not found' }, 404);
  }

  const [created] = await db
    .insert(projects)
    .values({
      ownerId: session.user.id,
      clientId: data.clientId,
      title: data.title,
      description: data.description ?? null,
      deadline: data.deadline ?? null,
      budgetDisplay: data.budgetDisplay ?? null,
    })
    .returning();

  if (!created) {
    return c.json({ status: 'error', message: 'Failed to create project' }, 500);
  }

  await logActivity({
    projectId: created.id,
    actorId: session.user.id,
    action: 'project_created',
    targetType: 'project',
    targetId: created.id,
  });

  return c.json({ status: 'ok', data: created }, 201);
});

export default projectRoutes;
