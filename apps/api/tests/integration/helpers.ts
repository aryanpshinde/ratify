import { app } from '../../src/app.js';
import { env } from '../../src/lib/env.js';
import { db, pool } from '../../src/db/index.js';
import { withDbRetry } from '../../src/lib/db-retry.js';
import { users } from '../../src/db/schema.js';
import { inArray } from 'drizzle-orm';

export const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
export const PASSWORD = 'integration-password-1';
export const BASE_URL = env.BETTER_AUTH_URL ?? 'http://localhost:3000';

const registry: Session[] = [];

export interface Envelope {
  status: string;
  data?: unknown;
  message?: string;
  error?: unknown;
}

export interface Call {
  httpStatus: number;
  body: Envelope;
  cookies: string[];
  raw: unknown;
}

export interface Session {
  userId: string;
  email: string;
  password: string;
  cookie: string;
  cookies: string[];
}

export async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  return withDbRetry(operation, attempts);
}

export async function call(path: string, init: RequestInit = {}, cookie?: string): Promise<Call> {
  const headers = new Headers(init.headers);

  if (!headers.has('origin')) {
    headers.set('origin', env.FRONTEND_URL);
  }
  if (cookie) {
    headers.set('cookie', cookie);
  }
  if (typeof init.body === 'string' && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const request = new Request(`${BASE_URL}${path}`, {
    ...init,
    method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
    headers,
  });

  const res = await app.request(request);
  const text = await res.text();

  let raw: unknown;
  try {
    raw = text ? JSON.parse(text) : null;
  } catch {
    raw = text;
  }

  const body = (raw ?? { status: 'empty' }) as Envelope;

  return { httpStatus: res.status, body, cookies: res.headers.getSetCookie(), raw };
}

async function callWithRetry(path: string, init: RequestInit = {}, cookie?: string): Promise<Call> {
  let last: Call | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    last = await call(path, init, cookie);
    if (last.httpStatus < 500) {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
  }

  return last as Call;
}

export async function createSession(role: string): Promise<Session> {
  const email = `${role}.${RUN}@ratify.test`;

  const signUp = await callWithRetry('/api/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({ email, password: PASSWORD, name: `Integration ${role}` }),
  });
  if (signUp.httpStatus !== 200) {
    throw new Error(
      `sign-up failed for ${role}: ${signUp.httpStatus} ${JSON.stringify(signUp.body)}`,
    );
  }

  const signIn = await callWithRetry('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (signIn.httpStatus !== 200) {
    throw new Error(
      `sign-in failed for ${role}: ${signIn.httpStatus} ${JSON.stringify(signIn.body)}`,
    );
  }

  const sessionCookie =
    signIn.cookies.find((value) => value.includes('session_token')) ?? signIn.cookies[0] ?? '';
  const cookie = sessionCookie.split(';')[0] ?? '';
  const userId = (signIn.raw as { user?: { id?: string } } | null)?.user?.id;

  if (!cookie || !userId) {
    throw new Error(
      `session not established for ${role}: ${JSON.stringify(signIn.raw)} ${JSON.stringify(signIn.cookies)}`,
    );
  }

  const session = { userId, email, password: PASSWORD, cookie, cookies: signIn.cookies };
  registry.push(session);
  return session;
}

export async function createClient(admin: Session, email: string): Promise<string> {
  const res = await call(
    '/api/clients',
    { method: 'POST', body: JSON.stringify({ name: `Client ${email}`, email }) },
    admin.cookie,
  );
  if (res.httpStatus !== 201) {
    throw new Error(`client create failed: ${res.httpStatus} ${JSON.stringify(res.body)}`);
  }
  return (res.body.data as { id: string }).id;
}

export async function createProject(
  admin: Session,
  clientId: string,
  title: string,
): Promise<string> {
  const res = await call(
    '/api/projects',
    { method: 'POST', body: JSON.stringify({ clientId, title }) },
    admin.cookie,
  );
  if (res.httpStatus !== 201) {
    throw new Error(`project create failed: ${res.httpStatus} ${JSON.stringify(res.body)}`);
  }
  return (res.body.data as { id: string }).id;
}

export async function createDeliverable(
  admin: Session,
  projectId: string,
  title: string,
): Promise<string> {
  const res = await call(
    `/api/projects/${projectId}/deliverables`,
    { method: 'POST', body: JSON.stringify({ title }) },
    admin.cookie,
  );
  if (res.httpStatus !== 201) {
    throw new Error(`deliverable create failed: ${res.httpStatus} ${JSON.stringify(res.body)}`);
  }
  return (res.body.data as { id: string }).id;
}

export async function addLinkVersion(
  admin: Session,
  deliverableId: string,
  externalUrl: string,
): Promise<string> {
  const res = await call(
    `/api/deliverables/${deliverableId}/versions/link`,
    { method: 'POST', body: JSON.stringify({ externalUrl }) },
    admin.cookie,
  );
  if (res.httpStatus !== 201) {
    throw new Error(`link version failed: ${res.httpStatus} ${JSON.stringify(res.body)}`);
  }
  return (res.body.data as { id: string }).id;
}

export async function submitDeliverable(admin: Session, deliverableId: string): Promise<void> {
  const res = await call(
    `/api/deliverables/${deliverableId}/submit`,
    { method: 'POST' },
    admin.cookie,
  );
  if (res.httpStatus !== 200) {
    throw new Error(`submit failed: ${res.httpStatus} ${JSON.stringify(res.body)}`);
  }
}

export async function createInvitation(
  admin: Session,
  projectId: string,
  email: string,
): Promise<{ id: string; token: string }> {
  const res = await call(
    `/api/projects/${projectId}/invitations`,
    { method: 'POST', body: JSON.stringify({ email }) },
    admin.cookie,
  );
  if (res.httpStatus !== 201) {
    throw new Error(`invitation create failed: ${res.httpStatus} ${JSON.stringify(res.body)}`);
  }
  return res.body.data as { id: string; token: string };
}

export async function acceptInvitation(client: Session, token: string): Promise<Call> {
  return call(`/api/invitations/${token}/accept`, { method: 'POST' }, client.cookie);
}

export async function deleteSessions(sessions: Session[]): Promise<void> {
  const ids = sessions.map((session) => session.userId);
  if (ids.length === 0) {
    return;
  }
  await withRetry(() => db.delete(users).where(inArray(users.id, ids)));
}

export async function cleanupRegisteredSessions(): Promise<void> {
  if (registry.length === 0) {
    return;
  }
  const ids = registry.map((session) => session.userId);
  registry.length = 0;
  await withRetry(() => db.delete(users).where(inArray(users.id, ids)));
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
