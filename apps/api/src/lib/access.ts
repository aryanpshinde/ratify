import { and, eq } from 'drizzle-orm';
import type { MemberRole } from '@ratify/shared';
import { projectMembers, projects } from '../db/schema.js';
import type { DbOrTx } from '../db/index.js';

export interface ProjectAccess {
  project: { id: string; ownerId: string };
  isOwner: boolean;
  role: MemberRole | null;
}

export async function requireProjectAccess(
  conn: DbOrTx,
  projectId: string,
  userId: string,
): Promise<ProjectAccess | null> {
  const [project] = await conn
    .select({ id: projects.id, ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    return null;
  }

  if (project.ownerId === userId) {
    return { project, isOwner: true, role: null };
  }

  const [membership] = await conn
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  if (!membership) {
    return null;
  }

  return { project, isOwner: false, role: membership.role };
}
