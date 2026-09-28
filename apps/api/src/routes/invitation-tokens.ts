import { Hono } from 'hono';
import { db } from '../db/index.js';
import { getSession } from '../lib/session.js';
import { and, eq } from 'drizzle-orm';
import { projects, clients, projectMembers, invitations } from '../db/schema.js';

const invitationTokenRoutes = new Hono();

invitationTokenRoutes.get('/:token', async (c) => {
  const { token } = c.req.param();

  const raw = token?.trim() ?? '';
  if (!raw || raw.length < 64 || raw.length > 255) {
    return c.json({ status: 'error', message: 'Invalid invitation' }, 400);
  }

  const [invite] = await db.select().from(invitations).where(eq(invitations.token, raw)).limit(1);
  if (!invite) {
    return c.json({ status: 'error', message: 'Invalid invitation' }, 404);
  }

  if (invite.acceptedAt !== null) {
    return c.json({ status: 'error', message: 'Invitation already accepted' }, 410);
  }
  if (invite.revokedAt !== null) {
    return c.json({ status: 'error', message: 'Invitation revoked' }, 410);
  }
  if (invite.expiresAt <= new Date()) {
    return c.json({ status: 'error', message: 'Invitation expired' }, 410);
  }

  const [project] = await db
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(eq(projects.id, invite.projectId))
    .limit(1);

  if (!project) {
    return c.json({ status: 'error', message: 'Invalid invitation' }, 404);
  }

  return c.json({
    status: 'ok',
    data: {
      email: invite.email,
      expiresAt: invite.expiresAt,
      projectId: project.id,
      projectTitle: project.title,
    },
  });
});

invitationTokenRoutes.post('/:token/accept', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const { token } = c.req.param();

  const raw = token?.trim() ?? '';
  if (!raw || raw.length < 64 || raw.length > 255) {
    return c.json({ status: 'error', message: 'Invalid invitation' }, 400);
  }

  const [invite] = await db.select().from(invitations).where(eq(invitations.token, raw)).limit(1);
  if (!invite) {
    return c.json({ status: 'error', message: 'Invalid invitation' }, 404);
  }

  if (invite.acceptedAt !== null) {
    return c.json({ status: 'error', message: 'Invitation already accepted' }, 410);
  }
  if (invite.revokedAt !== null) {
    return c.json({ status: 'error', message: 'Invitation revoked' }, 410);
  }
  if (invite.expiresAt <= new Date()) {
    return c.json({ status: 'error', message: 'Invitation expired' }, 410);
  }

  if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return c.json(
      { status: 'error', message: 'Invitation email does not match your account' },
      403,
    );
  }

  const [project] = await db
    .select({ id: projects.id, clientId: projects.clientId })
    .from(projects)
    .where(eq(projects.id, invite.projectId))
    .limit(1);

  if (!project) {
    return c.json({ status: 'error', message: 'Invalid invitation' }, 404);
  }

  const [client] = await db
    .select({ id: clients.id, userId: clients.userId })
    .from(clients)
    .where(eq(clients.id, project.clientId))
    .limit(1);

  if (!client) {
    return c.json({ status: 'error', message: 'Invalid invitation' }, 404);
  }

  if (client.userId !== null && client.userId !== session.user.id) {
    return c.json({ status: 'error', message: 'Client is already linked to another account' }, 409);
  }

  const result = await db.transaction(async (tx) => {
    if (client.userId === null) {
      await tx.update(clients).set({ userId: session.user.id }).where(eq(clients.id, client.id));
    }

    const [existing] = await tx
      .select({ role: projectMembers.role })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, invite.projectId),
          eq(projectMembers.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existing) {
      await tx.insert(projectMembers).values({
        projectId: invite.projectId,
        userId: session.user.id,
        role: 'client',
      });
    }

    await tx
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invite.id));

    return { projectId: invite.projectId };
  });

  return c.json({ status: 'ok', data: result }, 200);
});

export default invitationTokenRoutes;
