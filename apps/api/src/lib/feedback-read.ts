import { and, asc, desc, eq, inArray, isNull, lt, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  deliverableVersions,
  deliverables,
  feedback,
  projectMembers,
  projects,
  users,
} from '../db/schema.js';
import {
  type ActivityCursor,
  type CreatedFeedbackResponse,
  type FeedbackAuthorResponse,
  type FeedbackReplyResponse,
  type FeedbackThreadResponse,
  type MemberRole,
} from '@ratify/shared';
import { logActivity } from './activity.js';
import { buildActivityCursor } from './pagination-guards.js';

interface ThreadRow {
  id: string;
  versionId: string;
  versionNumber: number;
  body: string;
  createdAt: Date;
  authorId: string | null;
  authorName: string | null;
  membershipRole: MemberRole | null;
  ownerId: string | null;
}

interface ReplyRow {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: Date;
  authorId: string | null;
  authorName: string | null;
  membershipRole: MemberRole | null;
  ownerId: string | null;
}

interface AuthorShapeRow {
  authorId: string | null;
  authorName: string | null;
  membershipRole: MemberRole | null;
  ownerId: string | null;
}

function toAuthorResponse(row: AuthorShapeRow): FeedbackAuthorResponse {
  return {
    id: row.authorId,
    name: row.authorName,
    role:
      row.membershipRole ??
      (row.authorId !== null && row.authorId === row.ownerId ? 'admin' : 'client'),
  };
}

function toReplyResponse(row: ReplyRow): FeedbackReplyResponse {
  return {
    id: row.id,
    parentId: row.parentId!,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: toAuthorResponse(row),
  };
}

export async function listFeedbackThreads(
  deliverableId: string,
  projectId: string,
  params: { limit: number; cursor: ActivityCursor | null },
): Promise<{ items: FeedbackThreadResponse[]; nextCursor: string | null }> {
  let whereClause = and(
    eq(deliverableVersions.deliverableId, deliverableId),
    isNull(feedback.parentId),
  )!;

  if (params.cursor) {
    whereClause = and(
      whereClause,
      or(
        lt(feedback.createdAt, new Date(params.cursor.t)),
        and(eq(feedback.createdAt, new Date(params.cursor.t)), lt(feedback.id, params.cursor.i)),
      ),
    )!;
  }

  const authorShape = {
    authorId: feedback.authorId,
    authorName: users.name,
    membershipRole: projectMembers.role,
    ownerId: projects.ownerId,
  };
  const memberJoin = and(
    eq(projectMembers.userId, feedback.authorId),
    eq(projectMembers.projectId, projectId),
  );
  const deliverableJoin = eq(deliverables.id, deliverableVersions.deliverableId);
  const projectJoin = eq(projects.id, deliverables.projectId);

  const threadRows: ThreadRow[] = await db
    .select({
      id: feedback.id,
      versionId: feedback.versionId,
      versionNumber: deliverableVersions.versionNumber,
      body: feedback.body,
      createdAt: feedback.createdAt,
      ...authorShape,
    })
    .from(feedback)
    .innerJoin(deliverableVersions, eq(feedback.versionId, deliverableVersions.id))
    .innerJoin(deliverables, deliverableJoin)
    .innerJoin(projects, projectJoin)
    .leftJoin(users, eq(feedback.authorId, users.id))
    .leftJoin(projectMembers, memberJoin)
    .where(whereClause)
    .orderBy(desc(feedback.createdAt), desc(feedback.id))
    .limit(params.limit);

  const threadIds = threadRows.map((row) => row.id);

  const replyRows: ReplyRow[] = threadIds.length
    ? await db
        .select({
          id: feedback.id,
          parentId: feedback.parentId,
          body: feedback.body,
          createdAt: feedback.createdAt,
          ...authorShape,
        })
        .from(feedback)
        .innerJoin(deliverableVersions, eq(feedback.versionId, deliverableVersions.id))
        .innerJoin(deliverables, deliverableJoin)
        .innerJoin(projects, projectJoin)
        .leftJoin(users, eq(feedback.authorId, users.id))
        .leftJoin(projectMembers, memberJoin)
        .where(inArray(feedback.parentId, threadIds))
        .orderBy(asc(feedback.createdAt), asc(feedback.id))
    : [];

  const repliesByParent = new Map<string, FeedbackReplyResponse[]>();
  for (const reply of replyRows) {
    const list = repliesByParent.get(reply.parentId!) ?? [];
    list.push(toReplyResponse(reply));
    repliesByParent.set(reply.parentId!, list);
  }

  const items: FeedbackThreadResponse[] = threadRows.map((row) => ({
    id: row.id,
    versionId: row.versionId,
    versionNumber: row.versionNumber,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: toAuthorResponse(row),
    replies: repliesByParent.get(row.id) ?? [],
  }));

  const last = threadRows[threadRows.length - 1] ?? null;
  const nextCursor =
    threadRows.length === params.limit && last
      ? buildActivityCursor(last.createdAt, last.id)
      : null;

  return { items, nextCursor };
}

export interface FeedbackWriteValidation {
  kind: 'ok';
  versionNumber: number;
}

export interface FeedbackWriteError {
  kind: 'unknown_version' | 'unknown_parent' | 'parent_wrong_version' | 'parent_not_top_level';
}

export async function validateFeedbackTargets(
  deliverableId: string,
  versionId: string,
  parentId: string | undefined,
): Promise<FeedbackWriteValidation | FeedbackWriteError> {
  const [version] = await db
    .select({ id: deliverableVersions.id, versionNumber: deliverableVersions.versionNumber })
    .from(deliverableVersions)
    .where(
      and(
        eq(deliverableVersions.id, versionId),
        eq(deliverableVersions.deliverableId, deliverableId),
      ),
    )
    .limit(1);

  if (!version) {
    return { kind: 'unknown_version' };
  }

  if (parentId !== undefined) {
    const [parent] = await db
      .select({ id: feedback.id, versionId: feedback.versionId, parentId: feedback.parentId })
      .from(feedback)
      .where(eq(feedback.id, parentId))
      .limit(1);

    if (!parent) {
      return { kind: 'unknown_parent' };
    }
    if (parent.versionId !== versionId) {
      return { kind: 'parent_wrong_version' };
    }
    if (parent.parentId !== null) {
      return { kind: 'parent_not_top_level' };
    }
  }

  return { kind: 'ok', versionNumber: version.versionNumber };
}

export interface CreatedFeedbackRow {
  id: string;
  versionId: string;
  parentId: string | null;
  body: string;
  createdAt: Date;
}

export async function createFeedbackRow(
  projectId: string,
  deliverableId: string,
  actorId: string,
  authorRole: MemberRole,
  input: { versionId: string; body: string; parentId?: string | undefined },
  versionNumber: number,
  actorName: string | null,
): Promise<CreatedFeedbackResponse> {
  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(feedback)
      .values({
        versionId: input.versionId,
        parentId: input.parentId ?? null,
        authorId: actorId,
        body: input.body,
      })
      .returning({
        id: feedback.id,
        versionId: feedback.versionId,
        parentId: feedback.parentId,
        body: feedback.body,
        createdAt: feedback.createdAt,
      });

    if (!row) {
      throw new Error('Feedback insert did not return a row');
    }

    await logActivity(
      {
        projectId,
        actorId,
        action: 'feedback_created',
        targetType: 'deliverable',
        targetId: deliverableId,
        metadata: {
          author_role: authorRole,
          is_reply: input.parentId !== undefined,
          version_number: versionNumber,
        },
      },
      tx,
    );

    return row;
  });

  return {
    id: created.id,
    versionId: created.versionId,
    parentId: created.parentId,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
    author: { id: actorId, name: actorName, role: authorRole },
  };
}
