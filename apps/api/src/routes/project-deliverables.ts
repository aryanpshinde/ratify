import { Hono } from 'hono';
import { db } from '../db/index.js';
import { deliverables, deliverableVersions } from '../db/schema.js';
import { getSession } from '../lib/session.js';
import { requireProjectAccess } from '../lib/access.js';
import { getUuidParam } from '../lib/params.js';
import { logActivity } from '../lib/activity.js';
import {
  assembleDeliverableList,
  deliverableColumns,
  versionColumns,
} from '../lib/deliverable-columns.js';
import { createDeliverableSchema } from '@ratify/shared';
import { desc, eq, inArray } from 'drizzle-orm';

const projectDeliverableRoutes = new Hono();

projectDeliverableRoutes.get('/:projectId/deliverables', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const projectId = getUuidParam(c, 'projectId');
  if (!projectId) {
    return c.json({ status: 'error', message: 'Invalid projectId' }, 400);
  }

  const access = await requireProjectAccess(db, projectId, session.user.id);
  if (!access) {
    return c.json({ status: 'error', message: 'Project not found' }, 404);
  }

  if (!access.isOwner && access.role !== 'admin') {
    return c.json({ status: 'error', message: 'Forbidden' }, 403);
  }

  const rows = await db
    .select({ ...deliverableColumns })
    .from(deliverables)
    .where(eq(deliverables.projectId, projectId))
    .orderBy(desc(deliverables.updatedAt));

  const versions = rows.length
    ? await db
        .select({ ...versionColumns })
        .from(deliverableVersions)
        .where(
          inArray(
            deliverableVersions.deliverableId,
            rows.map((row) => row.id),
          ),
        )
        .orderBy(desc(deliverableVersions.versionNumber))
    : [];

  return c.json({ status: 'ok', data: assembleDeliverableList(rows, versions) });
});

projectDeliverableRoutes.post('/:projectId/deliverables', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const projectId = getUuidParam(c, 'projectId');
  if (!projectId) {
    return c.json({ status: 'error', message: 'Invalid projectId' }, 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ status: 'error', message: 'Invalid JSON body' }, 400);
  }

  const parsed = createDeliverableSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { status: 'error', message: 'Validation Failed', error: parsed.error.issues },
      400,
    );
  }

  const access = await requireProjectAccess(db, projectId, session.user.id);
  if (!access) {
    return c.json({ status: 'error', message: 'Project not found' }, 404);
  }

  if (!access.isOwner && access.role !== 'admin') {
    return c.json({ status: 'error', message: 'Forbidden' }, 403);
  }

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(deliverables)
      .values({
        projectId,
        createdBy: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
      })
      .returning();

    if (!row) {
      return null;
    }

    await logActivity(
      {
        projectId,
        actorId: session.user.id,
        action: 'deliverable_created',
        targetType: 'deliverable',
        targetId: row.id,
      },
      tx,
    );

    return row;
  });

  if (!created) {
    return c.json({ status: 'error', message: 'Failed to create deliverable' }, 500);
  }

  return c.json({ status: 'ok', data: created }, 201);
});

export default projectDeliverableRoutes;
