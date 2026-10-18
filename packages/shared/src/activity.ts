import * as z from 'zod';

export const activityActionSchema = z.enum([
  'project_created',
  'project_status_changed',
  'client_invited',
  'deliverable_created',
  'version_uploaded',
  'deliverable_submitted',
  'feedback_created',
  'deliverable_approved',
  'deliverable_rejected',
]);

export const activityLogResponseSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  actorId: z.uuid().nullable(),
  actorName: z.string().nullable(),
  action: z.string(),
  targetType: z.string().nullable(),
  targetId: z.uuid().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.iso.datetime(),
});

export type ActivityAction = z.infer<typeof activityActionSchema>;
export type ActivityLogResponse = z.infer<typeof activityLogResponseSchema>;

export const ACTIVITY_PAGE_SIZE_DEFAULT = 10;
export const ACTIVITY_PAGE_SIZE_MAX = 100;

export const activityCursorSchema = z.object({
  t: z.iso.datetime(),
  i: z.uuid(),
});

export type ActivityCursor = z.infer<typeof activityCursorSchema>;

export function encodeActivityCursor(cursor: ActivityCursor): string {
  return btoa(`${cursor.t}|${cursor.i}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeActivityCursor(raw: string): ActivityCursor | null {
  if (raw.length === 0 || raw.length > 512 || !/^[A-Za-z0-9_-]+$/.test(raw)) {
    return null;
  }

  try {
    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const separator = decoded.indexOf('|');
    if (separator <= 0) {
      return null;
    }

    const parsed = activityCursorSchema.safeParse({
      t: decoded.slice(0, separator),
      i: decoded.slice(separator + 1),
    });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const activityLogPageSchema = z.object({
  items: z.array(activityLogResponseSchema),
  nextCursor: z.string().nullable(),
});

export type ActivityLogPage = z.infer<typeof activityLogPageSchema>;
