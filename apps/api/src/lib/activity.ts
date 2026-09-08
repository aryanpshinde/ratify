import { db } from '../db/index.js';
import { activityLogs } from '../db/schema.js';

interface LogActivityInput {
  projectId: string;
  actorId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logActivity(input: LogActivityInput) {
  await db.insert(activityLogs).values({
    projectId: input.projectId,
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? null,
  });
}
