import { Hono } from 'hono';
import { randomBytes } from 'node:crypto';
import { db } from '../db/index.js';
import { projects, clients, invitations } from '../db/schema.js';
import { getSession } from '../lib/session.js';
import { getUuidParam } from '../lib/params.js';
import { logActivity } from '../lib/activity.js';
import { createInvitationSchema } from '@ratify/shared';
import { desc, eq, and, sql } from 'drizzle-orm';

const invitationRoutes = new Hono();

invitationRoutes.get('/:projectId/invitations', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const projectId = getUuidParam(c, 'projectId');
  if (!projectId) {
    return c.json({ status: 'error', message: 'Invalid projectId' }, 400);
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, session.user.id)))
    .limit(1);

  if (!project) {
    return c.json({ status: 'error', message: 'Project not found' }, 404);
  }

  const rows = await db
    .select()
    .from(invitations)
    .where(eq(invitations.projectId, projectId))
    .orderBy(desc(invitations.createdAt));

  return c.json({ status: 'ok', data: rows });
});

invitationRoutes.post('/:projectId/invitations', async (c) => {
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

  const parsed = createInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { status: 'error', message: 'Validation Failed', error: parsed.error.issues },
      400,
    );
  }

  const [project] = await db
    .select({ id: projects.id, clientId: projects.clientId })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, session.user.id)))
    .limit(1);

  if (!project) {
    return c.json({ status: 'error', message: 'Project not found' }, 404);
  }

  const [client] = await db
    .select({ id: clients.id, email: clients.email })
    .from(clients)
    .where(eq(clients.id, project.clientId))
    .limit(1);

  if (!client) {
    return c.json({ status: 'error', message: 'Client not found' }, 404);
  }

  if (client.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
    return c.json(
      { status: 'error', message: 'Invitation email must match the project client email' },
      400,
    );
  }

  const existingInvites = await db
    .select({
      id: invitations.id,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
      revokedAt: invitations.revokedAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.projectId, projectId),
        sql`lower(${invitations.email}) = lower(${parsed.data.email})`,
      ),
    )
    .orderBy(desc(invitations.createdAt));

  const activeInvite = existingInvites.find(
    (inv) => inv.acceptedAt === null && inv.revokedAt === null && inv.expiresAt > new Date(),
  );

  if (activeInvite) {
    return c.json(
      { status: 'error', message: 'An active invitation already exists for this email' },
      409,
    );
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const created = await db.transaction(async (tx) => {
      for (const inv of existingInvites) {
        if (inv.acceptedAt === null && inv.revokedAt === null && inv.expiresAt <= new Date()) {
          await tx
            .update(invitations)
            .set({ revokedAt: new Date() })
            .where(eq(invitations.id, inv.id));
        }
      }

      const [row] = await tx
        .insert(invitations)
        .values({
          projectId,
          invitedBy: session.user.id,
          email: parsed.data.email,
          token,
          expiresAt,
        })
        .returning();

      if (!row) {
        return null;
      }

      await logActivity(
        {
          projectId,
          actorId: session.user.id,
          action: 'client_invited',
          targetType: 'invitation',
          targetId: row.id,
        },
        tx,
      );

      return row;
    });

    if (!created) {
      return c.json({ status: 'error', message: 'Failed to create invitation' }, 500);
    }

    return c.json({ status: 'ok', data: created }, 201);
  } catch (err: unknown) {
    const code =
      (err as { code?: unknown }).code ?? (err as { cause?: { code?: unknown } }).cause?.code;
    if (code === '23505') {
      return c.json(
        { status: 'error', message: 'An active invitation already exists for this email' },
        409,
      );
    }
    throw err;
  }
});

export default invitationRoutes;
