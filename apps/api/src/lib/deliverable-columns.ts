import { deliverables, deliverableVersions } from '../db/schema.js';

export const deliverableColumns = {
  id: deliverables.id,
  projectId: deliverables.projectId,
  createdBy: deliverables.createdBy,
  title: deliverables.title,
  description: deliverables.description,
  status: deliverables.status,
  createdAt: deliverables.createdAt,
  updatedAt: deliverables.updatedAt,
};

export const versionColumns = {
  id: deliverableVersions.id,
  deliverableId: deliverableVersions.deliverableId,
  versionNumber: deliverableVersions.versionNumber,
  externalUrl: deliverableVersions.externalUrl,
  fileName: deliverableVersions.fileName,
  fileSize: deliverableVersions.fileSize,
  mimeType: deliverableVersions.mimeType,
  uploadedBy: deliverableVersions.uploadedBy,
  createdAt: deliverableVersions.createdAt,
};

interface DeliverableListRow {
  id: string;
}

interface DeliverableListVersion {
  deliverableId: string;
}

export function assembleDeliverableList<
  Row extends DeliverableListRow,
  Version extends DeliverableListVersion,
>(
  rows: Row[],
  versions: Version[],
): (Row & { versionCount: number; latestVersion: Version | null })[] {
  const latestByDeliverable = new Map<string, Version>();
  for (const version of versions) {
    if (!latestByDeliverable.has(version.deliverableId)) {
      latestByDeliverable.set(version.deliverableId, version);
    }
  }

  const countByDeliverable = new Map<string, number>();
  for (const version of versions) {
    countByDeliverable.set(
      version.deliverableId,
      (countByDeliverable.get(version.deliverableId) ?? 0) + 1,
    );
  }

  return rows.map((row) => ({
    ...row,
    versionCount: countByDeliverable.get(row.id) ?? 0,
    latestVersion: latestByDeliverable.get(row.id) ?? null,
  }));
}
