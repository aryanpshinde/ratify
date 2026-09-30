import { Hono } from 'hono';
import { db } from '../db/index.js';
import { projects, projectMembers, clients } from '../db/schema.js';
import { getSession } from '../lib/session.js';
import { and, eq, ne, desc } from 'drizzle-orm';

const portalRoutes = new Hono();

portalRoutes.get('/projects', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      status: projects.status,
      deadline: projects.deadline,
      budgetDisplay: projects.budgetDisplay,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      clientName: clients.name,
      clientCompany: clients.company,
    })
    .from(projects)
    .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(
      and(
        eq(projectMembers.userId, session.user.id),
        eq(projectMembers.role, 'client'),
        ne(projects.status, 'archived'),
      ),
    )
    .orderBy(desc(projects.updatedAt));

  return c.json({ status: 'ok', data: rows });
});

export default portalRoutes;
