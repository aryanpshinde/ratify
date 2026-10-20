import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../src/db/index.js';
import { objectExists } from '../../src/lib/storage.js';
import {
  activityLogs,
  clients,
  deliverables,
  deliverableVersions,
  feedback,
  invitations,
  projectMembers,
  projects,
} from '../../src/db/schema.js';
import { and, count, eq, inArray } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
import {
  addLinkVersion,
  call,
  cleanupRegisteredSessions,
  closeDatabase,
  createClient,
  createDeliverable,
  createInvitation,
  createProject,
  createSession,
  deleteSessions,
  submitDeliverable,
  type Session,
} from './helpers.js';

interface Fixture {
  admin: Session;
  client: Session;
  clientId: string;
  projectId: string;
  deliverableId: string;
  versionId: string;
}

let fixture: Fixture;

async function countWhere(table: PgTable, column: AnyPgColumn, value: string): Promise<number> {
  const rows = await db.select({ value: count() }).from(table).where(eq(column, value));
  return rows[0]?.value ?? 0;
}

beforeAll(async () => {
  const admin = await createSession('dbadmin');
  const client = await createSession('dbclient');

  const clientId = await createClient(admin, client.email);
  const projectId = await createProject(admin, clientId, 'Cascade project');
  const deliverableId = await createDeliverable(admin, projectId, 'Cascade deliverable');
  const versionId = await addLinkVersion(admin, deliverableId, 'https://example.com/cascade-spec');
  await submitDeliverable(admin, deliverableId);

  const { token } = await createInvitation(admin, projectId, client.email);
  await call(`/api/invitations/${token}/accept`, { method: 'POST' }, client.cookie);

  fixture = { admin, client, clientId, projectId, deliverableId, versionId };
});

afterAll(async () => {
  await cleanupRegisteredSessions();
  await closeDatabase();
});

describe('cascade deletes', () => {
  it('removes a client together with its projects and nested rows', async () => {
    const admin = await createSession('cascadeadmin');
    const client = await createSession('cascadeclient');

    const clientId = await createClient(admin, client.email);
    const projectId = await createProject(admin, clientId, 'Doomed project');
    const deliverableId = await createDeliverable(admin, projectId, 'Doomed deliverable');
    const versionId = await addLinkVersion(admin, deliverableId, 'https://example.com/doomed-spec');
    await submitDeliverable(admin, deliverableId);

    await call(
      `/api/deliverables/${deliverableId}/feedback`,
      {
        method: 'POST',
        body: JSON.stringify({ versionId, body: 'nested feedback' }),
      },
      admin.cookie,
    );

    const { token } = await createInvitation(admin, projectId, client.email);
    await call(`/api/invitations/${token}/accept`, { method: 'POST' }, client.cookie);

    expect(await countWhere(projects, projects.id, projectId)).toBe(1);
    expect(await countWhere(deliverables, deliverables.id, deliverableId)).toBe(1);
    expect(await countWhere(deliverableVersions, deliverableVersions.id, versionId)).toBe(1);
    expect(await countWhere(projectMembers, projectMembers.projectId, projectId)).toBe(1);
    expect(await countWhere(invitations, invitations.projectId, projectId)).toBe(1);

    const res = await call(`/api/clients/${clientId}`, { method: 'DELETE' }, admin.cookie);
    expect(res.httpStatus).toBe(200);

    expect(await countWhere(projects, projects.id, projectId)).toBe(0);
    expect(await countWhere(deliverables, deliverables.id, deliverableId)).toBe(0);
    expect(await countWhere(deliverableVersions, deliverableVersions.id, versionId)).toBe(0);
    expect(await countWhere(projectMembers, projectMembers.projectId, projectId)).toBe(0);
    expect(await countWhere(invitations, invitations.projectId, projectId)).toBe(0);

    await deleteSessions([admin, client]);
  });

  it('removes a project together with members, invitations, deliverables and logs', async () => {
    const admin = await createSession('projectadmin');
    const client = await createSession('projectclient');

    const clientId = await createClient(admin, client.email);
    const projectId = await createProject(admin, clientId, 'Temp project');
    const deliverableId = await createDeliverable(admin, projectId, 'Temp deliverable');
    const versionId = await addLinkVersion(admin, deliverableId, 'https://example.com/temp-spec');
    await submitDeliverable(admin, deliverableId);

    await call(
      `/api/deliverables/${deliverableId}/feedback`,
      { method: 'POST', body: JSON.stringify({ versionId, body: 'cascade body' }) },
      admin.cookie,
    );

    const { token } = await createInvitation(admin, projectId, client.email);
    await call(`/api/invitations/${token}/accept`, { method: 'POST' }, client.cookie);

    const logsBefore = await countWhere(activityLogs, activityLogs.projectId, projectId);
    expect(logsBefore).toBeGreaterThan(0);

    const res = await call(`/api/projects/${projectId}`, { method: 'DELETE' }, admin.cookie);
    expect(res.httpStatus).toBe(200);

    expect(await countWhere(projectMembers, projectMembers.projectId, projectId)).toBe(0);
    expect(await countWhere(invitations, invitations.projectId, projectId)).toBe(0);
    expect(await countWhere(deliverables, deliverables.id, deliverableId)).toBe(0);
    expect(await countWhere(deliverableVersions, deliverableVersions.id, versionId)).toBe(0);
    expect(await countWhere(activityLogs, activityLogs.projectId, projectId)).toBe(0);

    await deleteSessions([admin, client]);
  });

  it('removes a deliverable together with its versions and feedback', async () => {
    const admin = await createSession('deladmin');
    const client = await createSession('delclient');

    const clientId = await createClient(admin, client.email);
    const projectId = await createProject(admin, clientId, 'Deliverable project');
    const deliverableId = await createDeliverable(admin, projectId, 'Disposable deliverable');
    const versionId = await addLinkVersion(
      admin,
      deliverableId,
      'https://example.com/disposable-spec',
    );
    await submitDeliverable(admin, deliverableId);

    const feedbackRes = await call(
      `/api/deliverables/${deliverableId}/feedback`,
      { method: 'POST', body: JSON.stringify({ versionId, body: 'to be removed' }) },
      admin.cookie,
    );
    expect(feedbackRes.httpStatus).toBe(201);
    const feedbackId = (feedbackRes.body.data as { id: string }).id;

    const res = await call(
      `/api/deliverables/${deliverableId}`,
      { method: 'DELETE' },
      admin.cookie,
    );
    expect(res.httpStatus).toBe(200);

    expect(await countWhere(deliverableVersions, deliverableVersions.id, versionId)).toBe(0);
    expect(await countWhere(feedback, feedback.id, feedbackId)).toBe(0);

    await deleteSessions([admin, client]);
  });

  it('removes replies when their top level feedback is deleted', async () => {
    const admin = await createSession('replyadmin');
    const client = await createSession('replyclient');

    const clientId = await createClient(admin, client.email);
    const projectId = await createProject(admin, clientId, 'Reply project');
    const deliverableId = await createDeliverable(admin, projectId, 'Reply deliverable');
    const versionId = await addLinkVersion(admin, deliverableId, 'https://example.com/reply-spec');
    await submitDeliverable(admin, deliverableId);

    const top = await call(
      `/api/deliverables/${deliverableId}/feedback`,
      { method: 'POST', body: JSON.stringify({ versionId, body: 'top level thread' }) },
      admin.cookie,
    );
    const topId = (top.body.data as { id: string }).id;

    const reply = await call(
      `/api/deliverables/${deliverableId}/feedback`,
      {
        method: 'POST',
        body: JSON.stringify({ versionId, body: 'a reply', parentId: topId }),
      },
      admin.cookie,
    );
    const replyId = (reply.body.data as { id: string }).id;

    expect(await countWhere(feedback, feedback.id, replyId)).toBe(1);

    await db.delete(feedback).where(eq(feedback.id, topId));

    expect(await countWhere(feedback, feedback.id, topId)).toBe(0);
    expect(await countWhere(feedback, feedback.id, replyId)).toBe(0);

    await deleteSessions([admin, client]);
  });

  it('absorbs a concurrent duplicate membership insert', async () => {
    const admin = await createSession('raceadmin');
    const client = await createSession('raceclient');

    const clientId = await createClient(admin, client.email);
    const projectId = await createProject(admin, clientId, 'Race project');

    const insert = () =>
      db
        .insert(projectMembers)
        .values({ projectId, userId: client.userId, role: 'client' })
        .onConflictDoNothing()
        .returning({ id: projectMembers.id });

    const results = await Promise.allSettled([insert(), insert()]);

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
    expect(await countWhere(projectMembers, projectMembers.projectId, projectId)).toBe(1);

    await deleteSessions([admin, client]);
  });
});

describe('database constraints', () => {
  it('keeps activity log target type and target id paired', async () => {
    const paired = await db
      .select({ id: activityLogs.id })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.projectId, fixture.projectId),
          eq(activityLogs.targetType, 'deliverable'),
        ),
      )
      .limit(1);

    expect(paired.length).toBeGreaterThan(0);

    await expect(
      db
        .insert(activityLogs)
        .values({
          projectId: fixture.projectId,
          action: 'constraint_probe',
          targetType: 'deliverable',
          targetId: null,
        })
        .returning({ id: activityLogs.id }),
    ).rejects.toThrow();
  });

  it('keeps file and link versions mutually exclusive', async () => {
    await expect(
      db
        .insert(deliverableVersions)
        .values({
          deliverableId: fixture.deliverableId,
          versionNumber: 9001,
          externalUrl: 'https://example.com/both',
          fileKey: 'deliverables/probe/both.txt',
          fileName: 'both.txt',
          fileSize: 10,
          mimeType: 'text/plain',
        })
        .returning({ id: deliverableVersions.id }),
    ).rejects.toThrow();
  });

  it('enforces the ten megabyte file size limit', async () => {
    await expect(
      db
        .insert(deliverableVersions)
        .values({
          deliverableId: fixture.deliverableId,
          versionNumber: 9002,
          fileKey: 'deliverables/probe/large.txt',
          fileName: 'large.txt',
          fileSize: 10 * 1024 * 1024 + 1,
          mimeType: 'text/plain',
        })
        .returning({ id: deliverableVersions.id }),
    ).rejects.toThrow();
  });

  it('allows only one active invitation per project and email', async () => {
    const email = `unique.${Date.now()}@ratify.test`;
    const clientId = await createClient(fixture.admin, email);
    const projectId = await createProject(fixture.admin, clientId, 'Uniqueness project');

    const first = await db
      .insert(invitations)
      .values({
        projectId,
        invitedBy: fixture.admin.userId,
        email,
        token: `probe-${projectId}-a`,
        expiresAt: new Date(Date.now() + 86_400_000),
      })
      .returning({ id: invitations.id });

    expect(first).toHaveLength(1);

    await expect(
      db
        .insert(invitations)
        .values({
          projectId,
          invitedBy: fixture.admin.userId,
          email: email.toUpperCase(),
          token: `probe-${projectId}-b`,
          expiresAt: new Date(Date.now() + 86_400_000),
        })
        .returning({ id: invitations.id }),
    ).rejects.toThrow();
  });

  it('allows only one version number per deliverable', async () => {
    const email = `version.${Date.now()}@ratify.test`;
    const clientId = await createClient(fixture.admin, email);
    const projectId = await createProject(fixture.admin, clientId, 'Version uniqueness project');
    const deliverableId = await createDeliverable(
      fixture.admin,
      projectId,
      'Versioned deliverable',
    );

    const first = await db
      .insert(deliverableVersions)
      .values({
        deliverableId,
        versionNumber: 1,
        externalUrl: 'https://example.com/one',
      })
      .returning({ id: deliverableVersions.id });

    expect(first).toHaveLength(1);

    await expect(
      db
        .insert(deliverableVersions)
        .values({
          deliverableId,
          versionNumber: 1,
          externalUrl: 'https://example.com/two',
        })
        .returning({ id: deliverableVersions.id }),
    ).rejects.toThrow();
  });
});

describe('orphan sweep', () => {
  it('removes stored files when the owning project is deleted', async () => {
    const admin = await createSession('sweepadmin');

    const clientId = await createClient(admin, `sweep.${Date.now()}@ratify.test`);
    const projectId = await createProject(admin, clientId, 'Sweep project');
    const deliverableId = await createDeliverable(admin, projectId, 'Sweep deliverable');

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(128)], { type: 'text/plain' }), 'sweep.txt');
    const uploaded = await call(
      `/api/deliverables/${deliverableId}/versions/file`,
      { method: 'POST', body: form },
      admin.cookie,
    );
    expect(uploaded.httpStatus).toBe(201);

    const [version] = await db
      .select({ fileKey: deliverableVersions.fileKey })
      .from(deliverableVersions)
      .where(eq(deliverableVersions.deliverableId, deliverableId));

    const fileKey = version?.fileKey ?? '';
    expect(fileKey).toBeTruthy();
    expect(await objectExists(fileKey)).toBe(true);

    const res = await call(`/api/projects/${projectId}`, { method: 'DELETE' }, admin.cookie);
    expect(res.httpStatus).toBe(200);

    expect(await countWhere(deliverableVersions, deliverableVersions.fileKey, fileKey)).toBe(0);
    expect(await objectExists(fileKey)).toBe(false);

    await deleteSessions([admin]);
  });

  it('keeps unrelated client rows intact when another client is deleted', async () => {
    const admin = await createSession('keepadmin');
    const keepEmail = `keep.${Date.now()}@ratify.test`;
    const dropEmail = `drop.${Date.now()}@ratify.test`;

    const keepId = await createClient(admin, keepEmail);
    const dropId = await createClient(admin, dropEmail);

    const res = await call(`/api/clients/${dropId}`, { method: 'DELETE' }, admin.cookie);
    expect(res.httpStatus).toBe(200);

    const survivors = await db
      .select({ id: clients.id })
      .from(clients)
      .where(inArray(clients.id, [keepId, dropId]));

    expect(survivors.map((row) => row.id)).toEqual([keepId]);

    await deleteSessions([admin]);
  });
});
