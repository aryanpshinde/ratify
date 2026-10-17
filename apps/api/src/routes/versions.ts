import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { deliverables, deliverableVersions } from '../db/schema.js';
import { getSession } from '../lib/session.js';
import { requireProjectAccess } from '../lib/access.js';
import { getUuidParam } from '../lib/params.js';
import { getFileDownloadUrl } from '../lib/storage.js';

const versionRoutes = new Hono();

versionRoutes.get('/:id/download', async (c) => {
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
    })
    .from(deliverableVersions)
    .innerJoin(deliverables, eq(deliverableVersions.deliverableId, deliverables.id))
    .where(eq(deliverableVersions.id, id))
    .limit(1);

  if (!version) {
    return c.json({ status: 'error', message: 'Version not found' }, 404);
  }

  if (!version.fileKey) {
    return c.json({ status: 'error', message: 'This version is an external link' }, 400);
  }

  const access = await requireProjectAccess(db, version.projectId, session.user.id);
  if (!access) {
    return c.json({ status: 'error', message: 'Version not found' }, 404);
  }

  if (!access.isOwner && access.role !== 'admin') {
    return c.json({ status: 'error', message: 'Forbidden' }, 403);
  }

  try {
    const url = await getFileDownloadUrl(version.fileKey, version.fileName ?? 'download');
    return c.json({ status: 'ok', data: { url } });
  } catch {
    return c.json({ status: 'error', message: 'Failed to create download URL' }, 500);
  }
});

export default versionRoutes;
