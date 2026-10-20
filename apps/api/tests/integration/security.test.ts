import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../src/db/index.js';
import { invitations } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import {
  acceptInvitation,
  addLinkVersion,
  call,
  cleanupRegisteredSessions,
  closeDatabase,
  createClient,
  createDeliverable,
  createInvitation,
  createProject,
  createSession,
  submitDeliverable,
  type Session,
} from './helpers.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface Fixture {
  admin: Session;
  otherAdmin: Session;
  client: Session;
  outsider: Session;
  clientId: string;
  projectId: string;
  draftDeliverableId: string;
  draftVersionId: string;
  submittedDeliverableId: string;
  submittedVersionId: string;
}

let fixture: Fixture;

beforeAll(async () => {
  const admin = await createSession('admin');
  const otherAdmin = await createSession('otheradmin');
  const client = await createSession('client');
  const outsider = await createSession('outsider');

  const clientId = await createClient(admin, client.email);
  const projectId = await createProject(admin, clientId, 'Security checklist project');

  const draftDeliverableId = await createDeliverable(admin, projectId, 'Draft deliverable');
  const draftVersionId = await addLinkVersion(
    admin,
    draftDeliverableId,
    'https://example.com/draft-spec',
  );

  const submittedDeliverableId = await createDeliverable(admin, projectId, 'Submitted deliverable');
  const submittedVersionId = await addLinkVersion(
    admin,
    submittedDeliverableId,
    'https://example.com/final-spec',
  );
  await submitDeliverable(admin, submittedDeliverableId);

  const { token } = await createInvitation(admin, projectId, client.email);
  const accepted = await acceptInvitation(client, token);
  expect(accepted.httpStatus).toBe(200);

  fixture = {
    admin,
    otherAdmin,
    client,
    outsider,
    clientId,
    projectId,
    draftDeliverableId,
    draftVersionId,
    submittedDeliverableId,
    submittedVersionId,
  };
});

afterAll(async () => {
  await cleanupRegisteredSessions();
  await closeDatabase();
});

describe('session and route protection', () => {
  it('rejects unauthenticated access to every protected surface', async () => {
    const surfaces = [
      '/api/projects',
      '/api/clients',
      '/api/portal/projects',
      `/api/projects/${fixture.projectId}`,
      `/api/projects/${fixture.projectId}/deliverables`,
      `/api/deliverables/${fixture.submittedDeliverableId}`,
      `/api/deliverables/${fixture.submittedDeliverableId}/feedback`,
      `/api/portal/deliverables/${fixture.submittedDeliverableId}`,
    ];

    for (const surface of surfaces) {
      const res = await call(surface);
      expect(res.httpStatus, `expected 401 for ${surface}`).toBe(401);
    }
  });

  it('issues a session cookie carrying httpOnly and sameSite protections', async () => {
    const res = await call('/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: fixture.client.email, password: fixture.client.password }),
    });

    expect(res.httpStatus).toBe(200);
    const sessionCookie = res.cookies.find((value) => value.includes('session_token'));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.toLowerCase()).toContain('httponly');
    expect(sessionCookie?.toLowerCase()).toContain('samesite');
  });

  it('rejects a request whose session cookie is not recognised', async () => {
    const res = await call('/api/projects', {}, 'better-auth.session_token=forged-value');
    expect(res.httpStatus).toBe(401);
  });
});

describe('workspace isolation', () => {
  it('hides another admin workspace behind a 404', async () => {
    const project = await call(`/api/projects/${fixture.projectId}`, {}, fixture.otherAdmin.cookie);
    expect(project.httpStatus).toBe(404);

    const deliverables = await call(
      `/api/projects/${fixture.projectId}/deliverables`,
      {},
      fixture.otherAdmin.cookie,
    );
    expect(deliverables.httpStatus).toBe(404);

    const deliverable = await call(
      `/api/deliverables/${fixture.submittedDeliverableId}`,
      {},
      fixture.otherAdmin.cookie,
    );
    expect(deliverable.httpStatus).toBe(404);
  });

  it('hides another client project behind a 404', async () => {
    const project = await call(`/api/projects/${fixture.projectId}`, {}, fixture.outsider.cookie);
    expect(project.httpStatus).toBe(404);

    const portalProject = await call(
      `/api/portal/projects/${fixture.projectId}`,
      {},
      fixture.outsider.cookie,
    );
    expect(portalProject.httpStatus).toBe(404);

    const portalDeliverable = await call(
      `/api/portal/deliverables/${fixture.submittedDeliverableId}`,
      {},
      fixture.outsider.cookie,
    );
    expect(portalDeliverable.httpStatus).toBe(404);
  });

  it('keeps admin listing endpoints scoped to the owner', async () => {
    const res = await call('/api/projects', {}, fixture.otherAdmin.cookie);
    expect(res.httpStatus).toBe(200);
    const projects = res.body.data as { id: string }[];
    expect(projects.every((project) => project.id !== fixture.projectId)).toBe(true);
  });
});

describe('client voice versus admin voice', () => {
  it('refuses admin-only actions to a project client with 403', async () => {
    const listing = await call(
      `/api/projects/${fixture.projectId}/deliverables`,
      {},
      fixture.client.cookie,
    );
    expect(listing.httpStatus).toBe(403);

    const deliverable = await call(
      `/api/deliverables/${fixture.submittedDeliverableId}`,
      {},
      fixture.client.cookie,
    );
    expect(deliverable.httpStatus).toBe(403);

    const feedback = await call(
      `/api/deliverables/${fixture.submittedDeliverableId}/feedback`,
      {},
      fixture.client.cookie,
    );
    expect(feedback.httpStatus).toBe(403);
  });

  it('refuses admin mutation of a project the caller does not own with 404', async () => {
    const patch = await call(
      `/api/projects/${fixture.projectId}`,
      { method: 'PATCH', body: JSON.stringify({ title: 'Hijacked' }) },
      fixture.otherAdmin.cookie,
    );
    expect(patch.httpStatus).toBe(404);

    const remove = await call(
      `/api/projects/${fixture.projectId}`,
      { method: 'DELETE' },
      fixture.otherAdmin.cookie,
    );
    expect(remove.httpStatus).toBe(404);
  });

  it('lets the client read the portal and hides drafts there', async () => {
    const projects = await call('/api/portal/projects', {}, fixture.client.cookie);
    expect(projects.httpStatus).toBe(200);
    const visible = projects.body.data as { id: string }[];
    expect(visible.some((project) => project.id === fixture.projectId)).toBe(true);

    const deliverables = await call(
      `/api/portal/projects/${fixture.projectId}/deliverables`,
      {},
      fixture.client.cookie,
    );
    expect(deliverables.httpStatus).toBe(200);
    const items = deliverables.body.data as { id: string }[];
    expect(items.some((item) => item.id === fixture.draftDeliverableId)).toBe(false);
    expect(items.some((item) => item.id === fixture.submittedDeliverableId)).toBe(true);
  });
});

describe('status gates', () => {
  it('refuses admin feedback on a draft deliverable with 403', async () => {
    const adminFeedback = await call(
      `/api/deliverables/${fixture.draftDeliverableId}/feedback`,
      {
        method: 'POST',
        body: JSON.stringify({
          versionId: fixture.draftVersionId,
          body: 'feedback on a draft',
        }),
      },
      fixture.admin.cookie,
    );
    expect(adminFeedback.httpStatus).toBe(403);
  });

  it('refuses a repeated decision on an already decided deliverable', async () => {
    const deliverableId = await createDeliverable(
      fixture.admin,
      fixture.projectId,
      'Decision gate deliverable',
    );
    const versionId = await addLinkVersion(
      fixture.admin,
      deliverableId,
      'https://example.com/decision-spec',
    );
    await submitDeliverable(fixture.admin, deliverableId);

    const first = await call(
      `/api/portal/deliverables/${deliverableId}/approve`,
      { method: 'POST', body: JSON.stringify({ note: 'approved once' }) },
      fixture.client.cookie,
    );
    expect(first.httpStatus).toBe(200);

    const second = await call(
      `/api/portal/deliverables/${deliverableId}/approve`,
      { method: 'POST', body: JSON.stringify({ note: 'approved twice' }) },
      fixture.client.cookie,
    );
    expect(second.httpStatus).toBe(403);

    const reject = await call(
      `/api/portal/deliverables/${deliverableId}/reject`,
      { method: 'POST', body: JSON.stringify({ note: 'rejected after approval' }) },
      fixture.client.cookie,
    );
    expect(reject.httpStatus).toBe(403);

    expect(versionId).toBeTruthy();
  });
});

describe('invitation lifecycle', () => {
  async function prepareInvitation(role: string) {
    const invitee = await createSession(role);
    const clientId = await createClient(fixture.admin, invitee.email);
    const projectId = await createProject(fixture.admin, clientId, `${role} project`);
    const invitation = await createInvitation(fixture.admin, projectId, invitee.email);
    return { invitee, invitation };
  }

  it('issues an unguessable token', async () => {
    const { invitation } = await prepareInvitation('inviteeToken');
    expect(invitation.token).toMatch(/^[a-f0-9]{64}$/);

    const wrong = await call('/api/invitations/' + 'f'.repeat(64));
    expect(wrong.httpStatus).toBe(404);
  });

  it('rejects an acceptance from a mismatched account', async () => {
    const { invitation } = await prepareInvitation('inviteeMismatch');
    const res = await acceptInvitation(fixture.client, invitation.token);
    expect(res.httpStatus).toBe(403);
  });

  it('treats an invitation as single use', async () => {
    const { invitee, invitation } = await prepareInvitation('inviteeSingle');
    const first = await acceptInvitation(invitee, invitation.token);
    expect(first.httpStatus).toBe(200);

    const second = await acceptInvitation(invitee, invitation.token);
    expect(second.httpStatus).toBe(410);
  });

  it('rejects an expired invitation', async () => {
    const { invitee, invitation } = await prepareInvitation('inviteeExpired');
    await db
      .update(invitations)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(invitations.id, invitation.id));

    const preview = await call(`/api/invitations/${invitation.token}`);
    expect(preview.httpStatus).toBe(410);

    const accept = await acceptInvitation(invitee, invitation.token);
    expect(accept.httpStatus).toBe(410);
  });
});

describe('input validation', () => {
  it('rejects an oversized upload before it reaches storage', async () => {
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(MAX_FILE_SIZE_BYTES + 1024)], { type: 'text/plain' }),
      'oversized.txt',
    );

    const res = await call(
      `/api/deliverables/${fixture.submittedDeliverableId}/versions/file`,
      { method: 'POST', body: form },
      fixture.admin.cookie,
    );
    expect(res.httpStatus).toBe(400);
  });

  it('rejects a disallowed file type', async () => {
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(64)], { type: 'application/x-msdownload' }),
      'payload.exe',
    );

    const res = await call(
      `/api/deliverables/${fixture.submittedDeliverableId}/versions/file`,
      { method: 'POST', body: form },
      fixture.admin.cookie,
    );
    expect(res.httpStatus).toBe(400);
  });

  it('enforces zod validation on pagination and payloads', async () => {
    const badLimit = await call(
      `/api/deliverables/${fixture.submittedDeliverableId}/feedback?limit=abc`,
      {},
      fixture.admin.cookie,
    );
    expect(badLimit.httpStatus).toBe(400);

    const highLimit = await call(
      `/api/deliverables/${fixture.submittedDeliverableId}/feedback?limit=101`,
      {},
      fixture.admin.cookie,
    );
    expect(highLimit.httpStatus).toBe(400);

    const malformed = await call(
      `/api/deliverables/${fixture.submittedDeliverableId}/feedback`,
      { method: 'POST', body: '{not json' },
      fixture.admin.cookie,
    );
    expect(malformed.httpStatus).toBe(400);

    const missingFields = await call(
      `/api/deliverables/${fixture.submittedDeliverableId}/feedback`,
      { method: 'POST', body: JSON.stringify({}) },
      fixture.admin.cookie,
    );
    expect(missingFields.httpStatus).toBe(400);

    const badClient = await call(
      '/api/clients',
      { method: 'POST', body: JSON.stringify({ name: 'No email' }) },
      fixture.admin.cookie,
    );
    expect(badClient.httpStatus).toBe(400);
  });
});
