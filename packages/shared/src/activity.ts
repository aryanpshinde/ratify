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
