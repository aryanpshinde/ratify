import { and, eq } from 'drizzle-orm';
import type { MemberRole } from '@ratify/shared';
import { projectMembers, projects, clients } from '../db/schema.js';
import type { DbOrTx } from '../db/index.js';
import { isPortalProjectVisible } from './invitation-guards.js';

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

export interface PortalProjectAccess {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    deadline: string | null;
    budgetDisplay: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  clientName: string;
  clientCompany: string | null;
}

export async function requirePortalProjectAccess(
  conn: DbOrTx,
  projectId: string,
  userId: string,
): Promise<PortalProjectAccess | null> {
  const [row] = await conn
    .select({
      project: {
        id: projects.id,
        title: projects.title,
        description: projects.description,
        status: projects.status,
        deadline: projects.deadline,
        budgetDisplay: projects.budgetDisplay,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      },
      clientName: clients.name,
      clientCompany: clients.company,
      membershipRole: projectMembers.role,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .leftJoin(
      projectMembers,
      and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, userId)),
    )
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!row) {
    return null;
  }

  const membership = row.membershipRole === null ? null : { role: row.membershipRole };

  if (!isPortalProjectVisible(membership, row.project.status)) {
    return null;
  }

  return {
    project: {
      id: row.project.id,
      title: row.project.title,
      description: row.project.description,
      status: row.project.status,
      deadline: row.project.deadline,
      budgetDisplay: row.project.budgetDisplay,
      createdAt: row.project.createdAt,
      updatedAt: row.project.updatedAt,
    },
    clientName: row.clientName,
    clientCompany: row.clientCompany,
  };
}
