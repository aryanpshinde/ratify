import type { Hono } from 'hono';
import {
  canReceiveFeedback,
  createFeedbackSchema,
  type DeliverableStatus,
  type MemberRole,
} from '@ratify/shared';
import { getSession } from './session.js';
import { getUuidParam } from './params.js';
import {
  createFeedbackRow,
  listFeedbackThreads,
  validateFeedbackTargets,
} from './feedback-read.js';
import { parseFeedbackFeedParams } from './pagination-guards.js';

export interface FeedbackAccessResolution {
  deliverableId: string;
  projectId: string;
  status: DeliverableStatus;
}

export type FeedbackAccessResolver = (
  deliverableId: string,
  userId: string,
) => Promise<FeedbackAccessResolution | { forbidden: true } | null>;

export function registerFeedbackRoutes(
  app: Hono,
  prefix: string,
  resolver: FeedbackAccessResolver,
  authorRole: MemberRole,
): void {
  app.get(`${prefix}/:id/feedback`, async (c) => {
    const session = await getSession(c);
    if (!session) {
      return c.json({ status: 'error', message: 'Unauthorized' }, 401);
    }

    const id = getUuidParam(c, 'id');
    if (!id) {
      return c.json({ status: 'error', message: 'Invalid id' }, 400);
    }

    const access = await resolver(id, session.user.id);
    if (!access) {
      return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
    }

    if ('forbidden' in access) {
      return c.json({ status: 'error', message: 'Forbidden' }, 403);
    }

    const params = parseFeedbackFeedParams(c.req.query('limit'), c.req.query('cursor'));
    if (!params) {
      return c.json({ status: 'error', message: 'Invalid pagination params' }, 400);
    }

    const threads = await listFeedbackThreads(access.deliverableId, access.projectId, params);

    return c.json({ status: 'ok', data: threads });
  });

  app.post(`${prefix}/:id/feedback`, async (c) => {
    const session = await getSession(c);
    if (!session) {
      return c.json({ status: 'error', message: 'Unauthorized' }, 401);
    }

    const id = getUuidParam(c, 'id');
    if (!id) {
      return c.json({ status: 'error', message: 'Invalid id' }, 400);
    }

    const access = await resolver(id, session.user.id);
    if (!access) {
      return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
    }

    if ('forbidden' in access) {
      return c.json({ status: 'error', message: 'Forbidden' }, 403);
    }

    if (!canReceiveFeedback(access.status)) {
      return c.json(
        { status: 'error', message: 'Feedback can only be left on submitted deliverables' },
        403,
      );
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ status: 'error', message: 'Invalid JSON body' }, 400);
    }

    const parsed = createFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { status: 'error', message: 'Validation Failed', error: parsed.error.issues },
        400,
      );
    }

    const targets = await validateFeedbackTargets(id, parsed.data.versionId, parsed.data.parentId);
    if (targets.kind === 'unknown_version') {
      return c.json({ status: 'error', message: 'Version not found' }, 404);
    }
    if (targets.kind !== 'ok') {
      return c.json(
        { status: 'error', message: 'Reply must reference top-level feedback on the same version' },
        400,
      );
    }

    const created = await createFeedbackRow(
      access.projectId,
      access.deliverableId,
      session.user.id,
      authorRole,
      parsed.data,
      targets.versionNumber,
      session.user.name,
    );

    return c.json({ status: 'ok', data: created }, 201);
  });
}
