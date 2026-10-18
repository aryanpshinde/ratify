import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { db } from '../db/index.js';
import { deliverables, deliverableVersions } from '../db/schema.js';
import { getSession } from '../lib/session.js';
import { requireProjectAccess } from '../lib/access.js';
import { getUuidParam } from '../lib/params.js';
import { logActivity } from '../lib/activity.js';
import {
  canSubmitDeliverable,
  canUploadVersion,
  createLinkVersionSchema,
  isDeliverableLocked,
  updateDeliverableSchema,
  MAX_FILE_SIZE_BYTES,
} from '@ratify/shared';
import { deliverableColumns, versionColumns } from '../lib/deliverable-columns.js';
import {
  sanitizeFileName,
  isFileNameTooLong,
  isFileTooLarge,
  resolveFileMimeType,
} from '../lib/file-validation.js';
import { buildFileKey, deleteObject, uploadObject } from '../lib/storage.js';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';

const deliverableRoutes = new Hono();

const fileRequiredIssue = { path: ['file'], code: 'invalid_type', message: 'File is required' };

async function getDeliverableAccess(deliverableId: string, userId: string) {
  const [deliverable] = await db
    .select({ ...deliverableColumns })
    .from(deliverables)
    .where(eq(deliverables.id, deliverableId))
    .limit(1);

  if (!deliverable) {
    return null;
  }

  const access = await requireProjectAccess(db, deliverable.projectId, userId);
  if (!access) {
    return null;
  }

  if (!access.isOwner && access.role !== 'admin') {
    return { deliverable, forbidden: true as const };
  }

  return { deliverable, forbidden: false as const };
}

deliverableRoutes.get('/:id', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  const result = await getDeliverableAccess(id, session.user.id);
  if (!result) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  if (result.forbidden) {
    return c.json({ status: 'error', message: 'Forbidden' }, 403);
  }

  const versions = await db
    .select({ ...versionColumns })
    .from(deliverableVersions)
    .where(eq(deliverableVersions.deliverableId, id))
    .orderBy(desc(deliverableVersions.versionNumber));

  return c.json({ status: 'ok', data: { ...result.deliverable, versions } });
});

deliverableRoutes.get('/:id/versions', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  const result = await getDeliverableAccess(id, session.user.id);
  if (!result) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  if (result.forbidden) {
    return c.json({ status: 'error', message: 'Forbidden' }, 403);
  }

  const rows = await db
    .select({ ...versionColumns })
    .from(deliverableVersions)
    .where(eq(deliverableVersions.deliverableId, id))
    .orderBy(desc(deliverableVersions.versionNumber));

  return c.json({ status: 'ok', data: rows });
});

deliverableRoutes.patch('/:id', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ status: 'error', message: 'Invalid JSON body' }, 400);
  }

  const parsed = updateDeliverableSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { status: 'error', message: 'Validation Failed', error: parsed.error.issues },
      400,
    );
  }

  const result = await getDeliverableAccess(id, session.user.id);
  if (!result) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  if (result.forbidden) {
    return c.json({ status: 'error', message: 'Forbidden' }, 403);
  }

  if (isDeliverableLocked(result.deliverable.status)) {
    return c.json({ status: 'error', message: 'Approved deliverables cannot be edited' }, 403);
  }

  const data = parsed.data;

  const payload: Record<string, unknown> = {};

  if (data.title !== undefined) payload['title'] = data.title;
  if (data.description !== undefined)
    payload['description'] = data.description === '' ? null : data.description;

  const updated = await db
    .update(deliverables)
    .set(payload)
    .where(eq(deliverables.id, id))
    .returning();

  const [row] = updated;

  if (!row) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  return c.json({ status: 'ok', data: row });
});

deliverableRoutes.delete('/:id', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  const result = await getDeliverableAccess(id, session.user.id);
  if (!result) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  if (result.forbidden) {
    return c.json({ status: 'error', message: 'Forbidden' }, 403);
  }

  if (isDeliverableLocked(result.deliverable.status)) {
    return c.json({ status: 'error', message: 'Approved deliverables cannot be deleted' }, 403);
  }

  const keyRows = await db
    .select({ fileKey: deliverableVersions.fileKey })
    .from(deliverableVersions)
    .where(and(eq(deliverableVersions.deliverableId, id), isNotNull(deliverableVersions.fileKey)));

  const fileKeys = keyRows.flatMap((row) => (row.fileKey ? [row.fileKey] : []));

  await db.delete(deliverables).where(eq(deliverables.id, id));

  await Promise.allSettled(fileKeys.map((key) => deleteObject(key)));

  return c.json({ status: 'ok', data: id });
});

deliverableRoutes.post('/:id/versions/link', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ status: 'error', message: 'Invalid JSON body' }, 400);
  }

  const parsed = createLinkVersionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { status: 'error', message: 'Validation Failed', error: parsed.error.issues },
      400,
    );
  }

  const result = await getDeliverableAccess(id, session.user.id);
  if (!result) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  if (result.forbidden) {
    return c.json({ status: 'error', message: 'Forbidden' }, 403);
  }

  const created = await db.transaction(async (tx) => {
    const [locked] = await tx
      .select({ id: deliverables.id, status: deliverables.status })
      .from(deliverables)
      .where(eq(deliverables.id, id))
      .limit(1)
      .for('update');

    if (!locked) {
      return null;
    }

    if (isDeliverableLocked(locked.status)) {
      return { locked: true as const };
    }

    const [maxRow] = await tx
      .select({ maxVersion: sql<number | null>`max(${deliverableVersions.versionNumber})` })
      .from(deliverableVersions)
      .where(eq(deliverableVersions.deliverableId, id));

    const [row] = await tx
      .insert(deliverableVersions)
      .values({
        deliverableId: id,
        versionNumber: (maxRow?.maxVersion ?? 0) + 1,
        externalUrl: parsed.data.externalUrl,
        uploadedBy: session.user.id,
      })
      .returning();

    if (row) {
      await logActivity(
        {
          projectId: result.deliverable.projectId,
          actorId: session.user.id,
          action: 'version_uploaded',
          targetType: 'deliverable_version',
          targetId: row.id,
          metadata: { version_number: row.versionNumber },
        },
        tx,
      );
      await tx.update(deliverables).set({ updatedAt: new Date() }).where(eq(deliverables.id, id));
    }

    return row;
  });

  if (!created) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  if ('locked' in created && created.locked) {
    return c.json(
      { status: 'error', message: 'Approved deliverables cannot receive new versions' },
      403,
    );
  }

  return c.json({ status: 'ok', data: created }, 201);
});

const fileOversizeIssue = [
  { path: ['file'], code: 'custom', message: 'File exceeds the 10 MB limit' },
];

deliverableRoutes.post(
  '/:id/versions/file',
  bodyLimit({
    maxSize: MAX_FILE_SIZE_BYTES + 1048576,
    onError: (c) =>
      c.json({ status: 'error', message: 'Validation Failed', error: fileOversizeIssue }, 400),
  }),
  async (c) => {
    const session = await getSession(c);
    if (!session) {
      return c.json({ status: 'error', message: 'Unauthorized' }, 401);
    }

    const id = getUuidParam(c, 'id');
    if (!id) {
      return c.json({ status: 'error', message: 'Invalid id' }, 400);
    }

    if (Number(c.req.header('content-length')) > MAX_FILE_SIZE_BYTES + 1048576) {
      return c.json(
        { status: 'error', message: 'Validation Failed', error: fileOversizeIssue },
        400,
      );
    }

    let form: Record<string, string | File | File[]>;
    try {
      form = await c.req.parseBody();
    } catch {
      return c.json(
        { status: 'error', message: 'Validation Failed', error: [fileRequiredIssue] },
        400,
      );
    }

    const upload = form['file'];
    if (!(upload instanceof File)) {
      return c.json(
        { status: 'error', message: 'Validation Failed', error: [fileRequiredIssue] },
        400,
      );
    }

    const fileName = sanitizeFileName(upload.name);
    if (!fileName) {
      return c.json(
        {
          status: 'error',
          message: 'Validation Failed',
          error: [{ path: ['file'], code: 'custom', message: 'Invalid file name' }],
        },
        400,
      );
    }

    if (isFileNameTooLong(fileName)) {
      return c.json(
        {
          status: 'error',
          message: 'Validation Failed',
          error: [{ path: ['file'], code: 'custom', message: 'File name is too long' }],
        },
        400,
      );
    }

    if (upload.size < 1) {
      return c.json(
        {
          status: 'error',
          message: 'Validation Failed',
          error: [{ path: ['file'], code: 'custom', message: 'File is empty' }],
        },
        400,
      );
    }

    if (isFileTooLarge(upload.size)) {
      return c.json(
        { status: 'error', message: 'Validation Failed', error: fileOversizeIssue },
        400,
      );
    }

    const mimeType = resolveFileMimeType(fileName, upload.type);
    if (!mimeType) {
      return c.json(
        {
          status: 'error',
          message: 'Validation Failed',
          error: [{ path: ['file'], code: 'custom', message: 'File type is not allowed' }],
        },
        400,
      );
    }

    const result = await getDeliverableAccess(id, session.user.id);
    if (!result) {
      return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
    }

    if (result.forbidden) {
      return c.json({ status: 'error', message: 'Forbidden' }, 403);
    }

    if (!canUploadVersion(result.deliverable.status)) {
      return c.json(
        { status: 'error', message: 'Approved deliverables cannot receive new versions' },
        403,
      );
    }

    const key = buildFileKey(id, fileName);

    try {
      await uploadObject({
        key,
        body: new Uint8Array(await upload.arrayBuffer()),
        contentType: mimeType,
      });
    } catch {
      return c.json({ status: 'error', message: 'Failed to store file' }, 500);
    }

    const created = await db.transaction(async (tx) => {
      const [locked] = await tx
        .select({ id: deliverables.id, status: deliverables.status })
        .from(deliverables)
        .where(eq(deliverables.id, id))
        .limit(1)
        .for('update');

      if (!locked) {
        return null;
      }

      if (isDeliverableLocked(locked.status)) {
        return { locked: true as const };
      }

      const [maxRow] = await tx
        .select({ maxVersion: sql<number | null>`max(${deliverableVersions.versionNumber})` })
        .from(deliverableVersions)
        .where(eq(deliverableVersions.deliverableId, id));

      const [row] = await tx
        .insert(deliverableVersions)
        .values({
          deliverableId: id,
          versionNumber: (maxRow?.maxVersion ?? 0) + 1,
          fileKey: key,
          fileName,
          fileSize: upload.size,
          mimeType,
          uploadedBy: session.user.id,
        })
        .returning();

      if (row) {
        await logActivity(
          {
            projectId: result.deliverable.projectId,
            actorId: session.user.id,
            action: 'version_uploaded',
            targetType: 'deliverable_version',
            targetId: row.id,
            metadata: { version_number: row.versionNumber },
          },
          tx,
        );
        await tx.update(deliverables).set({ updatedAt: new Date() }).where(eq(deliverables.id, id));
      }

      return row;
    });

    if (!created) {
      await deleteObject(key).catch(() => undefined);
      return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
    }

    if ('locked' in created && created.locked) {
      await deleteObject(key).catch(() => undefined);
      return c.json(
        { status: 'error', message: 'Approved deliverables cannot receive new versions' },
        403,
      );
    }

    return c.json({ status: 'ok', data: created }, 201);
  },
);

deliverableRoutes.post('/:id/submit', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const id = getUuidParam(c, 'id');
  if (!id) {
    return c.json({ status: 'error', message: 'Invalid id' }, 400);
  }

  const result = await getDeliverableAccess(id, session.user.id);
  if (!result) {
    return c.json({ status: 'error', message: 'Deliverable not found' }, 404);
  }

  if (result.forbidden) {
    return c.json({ status: 'error', message: 'Forbidden' }, 403);
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

    if (!canSubmitDeliverable(current.status)) {
      return { invalid: true as const };
    }

    const [row] = await tx
      .update(deliverables)
      .set({ status: 'submitted' })
      .where(eq(deliverables.id, id))
      .returning({ ...deliverableColumns });

    if (row) {
      await logActivity(
        {
          projectId: result.deliverable.projectId,
          actorId: session.user.id,
          action: 'deliverable_submitted',
          targetType: 'deliverable',
          targetId: row.id,
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
      { status: 'error', message: 'Only draft or rejected deliverables can be submitted' },
      403,
    );
  }

  return c.json({ status: 'ok', data: updated });
});

export default deliverableRoutes;
