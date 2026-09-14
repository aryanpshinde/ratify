import { Hono } from 'hono';
import { db } from '../db/index.js';
import { projects, clients } from '../db/schema.js';
import { getSession } from '../lib/session.js';
import { logActivity } from '../lib/activity.js';
import { createProjectSchema, updateProjectSchema } from '@ratify/shared';
import { desc, eq, and } from 'drizzle-orm';

const projectRoutes = new Hono();

projectRoutes.get('/', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const rows = await db
    .select({
      id: projects.id,
      ownerId: projects.ownerId,
      clientId: projects.clientId,
      title: projects.title,
      description: projects.description,
      status: projects.status,
      deadline: projects.deadline,
      budgetDisplay: projects.budgetDisplay,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      clientName: clients.name,
      clientCompany: clients.company,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.ownerId, session.user.id))
    .orderBy(desc(projects.updatedAt));

  return c.json({ status: 'ok', data: rows });
});

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

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
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

    if (!row) {
      return null;
    }

    await logActivity(
      {
        projectId: row.id,
        actorId: session.user.id,
        action: 'project_created',
        targetType: 'project',
        targetId: row.id,
      },
      tx,
    );

    return row;
  });

  if (!created) {
    return c.json({ status: 'error', message: 'Failed to create project' }, 500);
  }

  return c.json({ status: 'ok', data: created }, 201);
});

projectRoutes.get('/:id', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const { id } = c.req.param();

  const [project] = await db
    .select({
      id: projects.id,
      ownerId: projects.ownerId,
      clientId: projects.clientId,
      title: projects.title,
      description: projects.description,
      status: projects.status,
      deadline: projects.deadline,
      budgetDisplay: projects.budgetDisplay,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      clientName: clients.name,
      clientCompany: clients.company,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(and(eq(projects.id, id), eq(projects.ownerId, session.user.id)))
    .limit(1);

  if (!project) {
    return c.json({ status: 'error', message: 'Project not found' }, 404);
  }

  return c.json({ status: 'ok', data: project });
});

projectRoutes.patch('/:id', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const { id } = c.req.param();

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ status: 'error', message: 'Invalid JSON body' }, 400);
  }

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { status: 'error', message: 'Validation Failed', error: parsed.error.issues },
      400,
    );
  }

  const [existing] = await db
    .select({ id: projects.id, status: projects.status })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, session.user.id)))
    .limit(1);

  if (!existing) {
    return c.json({ status: 'error', message: 'Project not found' }, 404);
  }

  const data = parsed.data;

  const payload: Record<string, unknown> = {};

  if (data.title !== undefined) payload['title'] = data.title;
  if (data.description !== undefined)
    payload['description'] = data.description === '' ? null : data.description;
  if (data.status !== undefined) payload['status'] = data.status;
  if (data.deadline !== undefined) payload['deadline'] = data.deadline;
  if (data.budgetDisplay !== undefined)
    payload['budgetDisplay'] = data.budgetDisplay === '' ? null : data.budgetDisplay;

  const updated = await db.transaction(async (tx) => {
    if (data.status !== undefined && data.status !== existing.status) {
      await logActivity(
        {
          projectId: existing.id,
          actorId: session.user.id,
          action: 'project_status_changed',
          targetType: 'project',
          targetId: existing.id,
          metadata: {
            old_status: existing.status,
            new_status: data.status,
          },
        },
        tx,
      );
    }

    const [row] = await tx.update(projects).set(payload).where(eq(projects.id, id)).returning();

    return row;
  });

  if (!updated) {
    return c.json({ status: 'error', message: 'Project not found' }, 404);
  }

  return c.json({ status: 'ok', data: updated });
});

export default projectRoutes;
