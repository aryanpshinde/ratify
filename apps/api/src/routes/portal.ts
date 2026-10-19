import { Hono } from 'hono';
import type { Context } from 'hono';
import { db } from '../db/index.js';
import { deliverables, deliverableVersions } from '../db/schema.js';
import { getSession } from '../lib/session.js';
import { getUuidParam } from '../lib/params.js';
import { requirePortalProjectAccess } from '../lib/access.js';
import {
  assembleDeliverableList,
  deliverableColumns,
  versionColumns,
} from '../lib/deliverable-columns.js';
import { getFileDownloadUrl } from '../lib/storage.js';
import {
  approveDeliverableSchema,
  canDecideDeliverable,
  isPortalDeliverableVisible,
  rejectDeliverableSchema,
} from '@ratify/shared';
import { registerFeedbackRoutes } from '../lib/feedback-routes.js';
import { logActivity } from '../lib/activity.js';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { clients, projectMembers, projects } from '../db/schema.js';

const portalRoutes = new Hono();

portalRoutes.get('/projects', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const rows = await db
    .select({
      id: projects.id,
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
    .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(
      and(
        eq(projectMembers.userId, session.user.id),
        eq(projectMembers.role, 'client'),
        ne(projects.status, 'archived'),
      ),
    )
    .orderBy(desc(projects.updatedAt));

  return c.json({ status: 'ok', data: rows });
});

portalRoutes.get('/projects/:projectId', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const projectId = getUuidParam(c, 'projectId');
  if (!projectId) {
    return c.json({ status: 'error', message: 'Invalid projectId' }, 400);
  }

  const access = await requirePortalProjectAccess(db, projectId, session.user.id);
  if (!access) {
    return c.json({ status: 'error', message: 'Project not found' }, 404);
  }

  return c.json({
    status: 'ok',
    data: {
      ...access.project,
      clientName: access.clientName,
      clientCompany: access.clientCompany,
    },
  });
});

portalRoutes.get('/projects/:projectId/deliverables', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const projectId = getUuidParam(c, 'projectId');
  if (!projectId) {
    return c.json({ status: 'error', message: 'Invalid projectId' }, 400);
  }

  const access = await requirePortalProjectAccess(db, projectId, session.user.id);
  if (!access) {
    return c.json({ status: 'error', message: 'Project not found' }, 404);
  }

  const rows = await db
    .select({ ...deliverableColumns })
    .from(deliverables)
    .where(and(eq(deliverables.projectId, projectId), ne(deliverables.status, 'draft')))
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

async function findPortalDeliverable(deliverableId: string, userId: string) {
  const [deliverable] = await db
    .select({ ...deliverableColumns })
    .from(deliverables)
    .where(eq(deliverables.id, deliverableId))
    .limit(1);

  if (!deliverable) {
    return null;
  }

  const access = await requirePortalProjectAccess(db, deliverable.projectId, userId);
  if (!access) {
    return null;
  }

  if (!isPortalDeliverableVisible(deliverable.status)) {
    return null;
  }

  return deliverable;
}

async function findPortalVersions(deliverableId: string) {
  return db
    .select({ ...versionColumns })
    .from(deliverableVersions)
    .where(eq(deliverableVersions.deliverableId, deliverableId))
    .orderBy(desc(deliverableVersions.versionNumber));
}

portalRoutes.get('/deliverables/:id', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  const deliverable = await findPortalDeliverable(id, session.user.id);
  if (!deliverable) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  const versions = await findPortalVersions(id);

  return c.json({ status: 'ok', data: { ...deliverable, versions } });
});

portalRoutes.get('/deliverables/:id/versions', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  const deliverable = await findPortalDeliverable(id, session.user.id);
  if (!deliverable) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  const versions = await findPortalVersions(id);

  return c.json({ status: 'ok', data: versions });
});

portalRoutes.get('/versions/:id/download', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  const [version] = await db
    .select({
      fileKey: deliverableVersions.fileKey,
      fileName: deliverableVersions.fileName,
      projectId: deliverables.projectId,
      status: deliverables.status,
    })
    .from(deliverableVersions)
    .innerJoin(deliverables, eq(deliverableVersions.deliverableId, deliverables.id))
    .where(eq(deliverableVersions.id, id))
    .limit(1);

  if (!version) {
    return c.json({ status: 'error', message: 'Version not found' }, 404);
  }

  const access = await requirePortalProjectAccess(db, version.projectId, session.user.id);
  if (!access) {
    return c.json({ status: 'error', message: 'Version not found' }, 404);
  }

  if (!isPortalDeliverableVisible(version.status)) {
    return c.json({ status: 'error', message: 'Version not found' }, 404);
  }

  if (!version.fileKey) {
    return c.json({ status: 'error', message: 'This version is an external link' }, 400);
  }

  try {
    const url = await getFileDownloadUrl(version.fileKey, version.fileName ?? 'download');
    return c.json({ status: 'ok', data: { url } });
  } catch {
    return c.json({ status: 'error', message: 'Failed to create download URL' }, 500);
  }
});

async function resolvePortalFeedbackAccess(deliverableId: string, userId: string) {
  const deliverable = await findPortalDeliverable(deliverableId, userId);
  if (!deliverable) {
    return null;
  }
  return { deliverableId, projectId: deliverable.projectId, status: deliverable.status };
}

registerFeedbackRoutes(portalRoutes, '/deliverables', resolvePortalFeedbackAccess, 'client');

async function handlePortalDecision(c: Context, decision: 'approved' | 'rejected') {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  const body: unknown = await c.req.json().catch(() => ({}));
  const schema = decision === 'approved' ? approveDeliverableSchema : rejectDeliverableSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { status: 'error', message: 'Validation Failed', error: parsed.error.issues },
      400,
    );
  }

  const deliverable = await findPortalDeliverable(id, session.user.id);
  if (!deliverable) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  if (!canDecideDeliverable(deliverable.status)) {
    return c.json(
      {
        status: 'error',
        message: `Only submitted deliverables can be ${decision}`,
      },
      403,
    );
  }

  const updated = await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ id: deliverables.id, status: deliverables.status })
      .from(deliverables)
      .where(eq(deliverables.id, id))
      .limit(1)
      .for('update');

    if (!current) {
      return null;
    }

    if (!canDecideDeliverable(current.status)) {
      return { invalid: true as const };
    }

    const [row] = await tx
      .update(deliverables)
      .set({ status: decision })
      .where(eq(deliverables.id, id))
      .returning({ ...deliverableColumns });

    if (row) {
      await logActivity(
        {
          projectId: deliverable.projectId,
          actorId: session.user.id,
          action: decision === 'approved' ? 'deliverable_approved' : 'deliverable_rejected',
          targetType: 'deliverable',
          targetId: row.id,
          metadata: parsed.data.note === undefined ? null : { note: parsed.data.note },
        },
        tx,
      );
    }

    return row;
  });

  if (!updated) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  if ('invalid' in updated && updated.invalid) {
    return c.json(
      { status: 'error', message: `Only submitted deliverables can be ${decision}` },
      403,
    );
  }

  return c.json({ status: 'ok', data: updated });
}

portalRoutes.post('/deliverables/:id/approve', (c) => handlePortalDecision(c, 'approved'));

portalRoutes.post('/deliverables/:id/reject', (c) => handlePortalDecision(c, 'rejected'));

export default portalRoutes;
