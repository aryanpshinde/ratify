/**
 * Demo seed — realistic freelancer workspace for portfolio/demo.
 *
 * Targets an EXISTING auth user (default: aryan@aryan.com) and inserts
 * clients, projects, one pending invitation, deliverables with external-link
 * version history, and activity history. Client feedback (slices 5-6) is
 * intentionally out of scope.
 *
 * Run: pnpm db:seed [owner@email.com]
 */
import { randomBytes } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from './index.js';
import {
  activityLogs,
  clients,
  deliverables,
  deliverableVersions,
  invitations,
  projects,
  users,
} from './schema.js';

const OWNER_EMAIL = process.argv[2] ?? 'aryan@aryan.com';
const JUNK_TITLES = ['df', 'fg'];

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const now = Date.now();
const ago = (ms: number) => new Date(now - ms);

const SEED_CLIENTS = [
  { name: 'Maya Chen', email: 'maya@northwindstudio.co', company: 'Northwind Studio' },
  { name: 'Jonas Weber', email: 'jonas@weber-co.com', company: 'Weber & Co.' },
  { name: 'Priya Nair', email: 'priya@lumenlabs.io', company: 'Lumen Labs' },
  { name: 'Sofia Marino', email: 'sofia@casamarino.com', company: 'Casa Marino' },
  { name: 'Tom Becker', email: 'tom@beckerfitness.de', company: 'Becker Fitness' },
];

interface SeedProject {
  title: string;
  description: string;
  clientEmail: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'archived';
  deadline: string | null;
  budgetDisplay: string | null;
  createdAgoMs: number;
  updatedAgoMs: number;
}

const SEED_PROJECTS: SeedProject[] = [
  {
    title: 'Acme website redesign',
    description:
      'Full marketing-site overhaul for Northwind Studio: new IA, homepage, pricing and blog templates, CMS handoff docs.',
    clientEmail: 'maya@northwindstudio.co',
    status: 'in_progress',
    deadline: '2026-10-24',
    budgetDisplay: '$4,800 fixed',
    createdAgoMs: 9 * DAY,
    updatedAgoMs: 2 * HOUR,
  },
  {
    title: 'Lumen Labs brand identity',
    description:
      'Logo suite, color system, type pairing and a 20-page mini brand book. Currently with the client for review.',
    clientEmail: 'priya@lumenlabs.io',
    status: 'review',
    deadline: '2026-10-10',
    budgetDisplay: '$3,200 fixed',
    createdAgoMs: 14 * DAY,
    updatedAgoMs: 1 * DAY,
  },
  {
    title: 'Casa Marino storefront',
    description:
      'Boutique e-commerce storefront: product storytelling pages, checkout UX pass, photography art direction.',
    clientEmail: 'sofia@casamarino.com',
    status: 'planning',
    deadline: '2026-11-15',
    budgetDisplay: '$5,500 fixed',
    createdAgoMs: 3 * DAY,
    updatedAgoMs: 5 * HOUR,
  },
  {
    title: 'Weber & Co. annual report',
    description:
      '96-page annual report: data-visualization system, print-ready layout, interactive PDF edition.',
    clientEmail: 'jonas@weber-co.com',
    status: 'completed',
    deadline: '2026-08-30',
    budgetDisplay: '$6,000 fixed',
    createdAgoMs: 60 * DAY,
    updatedAgoMs: 26 * DAY,
  },
  {
    title: 'Becker Fitness booking portal',
    description:
      'Client portal for class bookings and trainer scheduling, matching the new Becker visual identity.',
    clientEmail: 'tom@beckerfitness.de',
    status: 'in_progress',
    deadline: '2026-10-31',
    budgetDisplay: '$80/hr, ~40h',
    createdAgoMs: 6 * DAY,
    updatedAgoMs: 1 * DAY + 3 * HOUR,
  },
  {
    title: 'Old portfolio migration',
    description: 'Legacy portfolio archive — kept for reference.',
    clientEmail: 'maya@northwindstudio.co',
    status: 'archived',
    deadline: null,
    budgetDisplay: null,
    createdAgoMs: 120 * DAY,
    updatedAgoMs: 90 * DAY,
  },
];

interface SeedVersion {
  externalUrl: string;
  createdAgoMs: number;
}

interface SeedDeliverable {
  title: string;
  description: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAgoMs: number;
  updatedAgoMs: number;
  versions: SeedVersion[];
}

interface SeedProjectDeliverables {
  projectTitle: string;
  deliverables: SeedDeliverable[];
}

const SEED_DELIVERABLES: SeedProjectDeliverables[] = [
  {
    projectTitle: 'Acme website redesign',
    deliverables: [
      {
        title: 'Homepage hero design',
        description: 'Hero concepts across breakpoints with the agreed art direction notes.',
        status: 'draft',
        createdAgoMs: 8 * DAY,
        updatedAgoMs: 3 * HOUR,
        versions: [
          {
            externalUrl: 'https://www.figma.com/design/acme-homepage/hero-v1',
            createdAgoMs: 8 * DAY,
          },
          {
            externalUrl: 'https://www.figma.com/design/acme-homepage/hero-v2',
            createdAgoMs: 5 * DAY,
          },
          {
            externalUrl: 'https://www.loom.com/share/acme-hero-walkthrough',
            createdAgoMs: 3 * HOUR,
          },
        ],
      },
      {
        title: 'Visual identity handoff',
        description: 'Final color, type and logo usage specs for the dev team.',
        status: 'approved',
        createdAgoMs: 7 * DAY,
        updatedAgoMs: 2 * DAY,
        versions: [
          {
            externalUrl: 'https://www.figma.com/design/acme-brand/spec-v1',
            createdAgoMs: 6 * DAY + 12 * HOUR,
          },
          {
            externalUrl: 'https://www.figma.com/design/acme-brand/spec-v2',
            createdAgoMs: 4 * DAY,
          },
        ],
      },
      {
        title: 'Pricing page templates',
        description: 'Pricing section variants waiting on a first layout pass.',
        status: 'draft',
        createdAgoMs: 2 * DAY,
        updatedAgoMs: 2 * DAY,
        versions: [],
      },
    ],
  },
  {
    projectTitle: 'Lumen Labs brand identity',
    deliverables: [
      {
        title: 'Logo suite exploration',
        description: 'Primary mark, wordmark variants and monochrome lockups.',
        status: 'submitted',
        createdAgoMs: 12 * DAY,
        updatedAgoMs: 1 * DAY + 12 * HOUR,
        versions: [
          {
            externalUrl: 'https://www.figma.com/design/lumen-logos/suite-v1',
            createdAgoMs: 12 * DAY,
          },
          {
            externalUrl: 'https://www.figma.com/design/lumen-logos/suite-v2',
            createdAgoMs: 1 * DAY + 12 * HOUR,
          },
        ],
      },
      {
        title: 'Type pairing study',
        description: 'Display and body pairings — client asked for a warmer serif direction.',
        status: 'rejected',
        createdAgoMs: 10 * DAY,
        updatedAgoMs: 2 * DAY,
        versions: [
          {
            externalUrl: 'https://www.figma.com/design/lumen-type/pairing-v1',
            createdAgoMs: 10 * DAY,
          },
        ],
      },
    ],
  },
  {
    projectTitle: 'Weber & Co. annual report',
    deliverables: [
      {
        title: 'Report layout draft',
        description: 'Print-ready master spreads plus the data-visualization system.',
        status: 'approved',
        createdAgoMs: 55 * DAY,
        updatedAgoMs: 27 * DAY,
        versions: [
          {
            externalUrl: 'https://www.figma.com/design/weber-report/layout-v1',
            createdAgoMs: 55 * DAY,
          },
          {
            externalUrl: 'https://www.figma.com/design/weber-report/layout-v2',
            createdAgoMs: 40 * DAY,
          },
          {
            externalUrl: 'https://www.figma.com/design/weber-report/layout-v3',
            createdAgoMs: 28 * DAY,
          },
        ],
      },
    ],
  },
];

async function main() {
  const [owner] = await db.select().from(users).where(eq(users.email, OWNER_EMAIL)).limit(1);
  if (!owner) {
    console.error(`Owner ${OWNER_EMAIL} not found. Sign up first, then re-run.`);
    process.exit(1);
  }

  // 1. Remove obvious test junk (exact 'df'/'fg' titles), owned by this user only.
  const junkClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.ownerId, owner.id), inArray(clients.name, JUNK_TITLES)));
  for (const jc of junkClients) {
    await db.delete(clients).where(eq(clients.id, jc.id));
  }
  const junkProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.ownerId, owner.id), inArray(projects.title, JUNK_TITLES)));
  for (const jp of junkProjects) {
    await db.delete(projects).where(eq(projects.id, jp.id));
  }
  console.log(
    `Cleaned ${junkClients.length} junk client(s), ${junkProjects.length} junk project(s).`,
  );

  // 2. Clients (skip emails already present for this owner).
  const existingClients = await db.select().from(clients).where(eq(clients.ownerId, owner.id));
  const existingEmails = new Set(existingClients.map((c) => c.email.toLowerCase()));
  const clientIdByEmail = new Map(existingClients.map((c) => [c.email.toLowerCase(), c.id]));
  let clientsAdded = 0;
  for (const c of SEED_CLIENTS) {
    if (existingEmails.has(c.email.toLowerCase())) continue;
    const rows = await db
      .insert(clients)
      .values({ ownerId: owner.id, ...c })
      .returning({ id: clients.id });
    const row = rows[0];
    if (!row) continue;
    clientIdByEmail.set(c.email.toLowerCase(), row.id);
    clientsAdded += 1;
  }
  console.log(
    `Clients: +${clientsAdded} (skipped ${SEED_CLIENTS.length - clientsAdded} existing).`,
  );

  // 3. Projects (skip titles already present for this owner).
  const existingProjects = await db.select().from(projects).where(eq(projects.ownerId, owner.id));
  const existingTitles = new Set(existingProjects.map((p) => p.title));
  let projectsAdded = 0;
  for (const p of SEED_PROJECTS) {
    if (existingTitles.has(p.title)) continue;
    const clientId = clientIdByEmail.get(p.clientEmail.toLowerCase());
    if (!clientId) {
      console.warn(`  ! client ${p.clientEmail} missing, skipping project "${p.title}"`);
      continue;
    }
    const inserted = await db
      .insert(projects)
      .values({
        ownerId: owner.id,
        clientId,
        title: p.title,
        description: p.description,
        status: p.status,
        deadline: p.deadline,
        budgetDisplay: p.budgetDisplay,
        createdAt: ago(p.createdAgoMs),
        updatedAt: ago(p.updatedAgoMs),
      })
      .returning({ id: projects.id });
    const row = inserted[0];
    if (!row) continue;
    await db.insert(activityLogs).values({
      projectId: row.id,
      actorId: owner.id,
      action: 'project_created',
      createdAt: ago(p.createdAgoMs),
    });
    if (p.status !== 'planning') {
      await db.insert(activityLogs).values({
        projectId: row.id,
        actorId: owner.id,
        action: 'project_status_changed',
        metadata: { old_status: 'planning', new_status: p.status },
        createdAt: ago(Math.max(p.updatedAgoMs, HOUR)),
      });
    }
    projectsAdded += 1;
  }
  console.log(`Projects: +${projectsAdded} (+ activity history).`);

  // 4. One pending invitation on the review project (topical for the demo).
  const reviewProject = (
    await db.select().from(projects).where(eq(projects.ownerId, owner.id))
  ).find((p) => p.status === 'review');
  if (reviewProject) {
    const pending = await db
      .select()
      .from(invitations)
      .where(eq(invitations.projectId, reviewProject.id));
    const hasActive = pending.some((i) => !i.acceptedAt && !i.revokedAt);
    if (!hasActive) {
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, reviewProject.clientId))
        .limit(1);
      if (!client) {
        console.warn('  ! review project client missing, skipping invitation');
      } else {
        await db.insert(invitations).values({
          projectId: reviewProject.id,
          invitedBy: owner.id,
          email: client.email,
          token: randomBytes(32).toString('hex'),
          expiresAt: new Date(now + 5 * DAY),
          createdAt: ago(2 * DAY),
        });
        await db.insert(activityLogs).values({
          projectId: reviewProject.id,
          actorId: owner.id,
          action: 'client_invited',
          metadata: { email: client.email },
          createdAt: ago(2 * DAY),
        });
        console.log(`Invitation: pending invite for ${client.email} on "${reviewProject.title}".`);
      }
    } else {
      console.log('Invitation: active invite already exists, skipped.');
    }
  }

  // 5. Deliverables and link versions (by title; skip projects that already have deliverables).
  for (const group of SEED_DELIVERABLES) {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.ownerId, owner.id), eq(projects.title, group.projectTitle)))
      .limit(1);
    if (!project) {
      console.warn(`  ! project "${group.projectTitle}" missing, skipping deliverables`);
      continue;
    }

    const existingRows = await db
      .select({ id: deliverables.id })
      .from(deliverables)
      .where(eq(deliverables.projectId, project.id));
    if (existingRows.length > 0) {
      console.log(`Deliverables: "${group.projectTitle}" already has deliverables, skipped.`);
      continue;
    }

    for (const d of group.deliverables) {
      const [deliverable] = await db
        .insert(deliverables)
        .values({
          projectId: project.id,
          createdBy: owner.id,
          title: d.title,
          description: d.description,
          status: d.status,
          createdAt: ago(d.createdAgoMs),
          updatedAt: ago(d.updatedAgoMs),
        })
        .returning();
      if (!deliverable) continue;

      await db.insert(activityLogs).values({
        projectId: project.id,
        actorId: owner.id,
        action: 'deliverable_created',
        targetType: 'deliverable',
        targetId: deliverable.id,
        createdAt: ago(d.createdAgoMs),
      });

      for (const [index, v] of d.versions.entries()) {
        const [version] = await db
          .insert(deliverableVersions)
          .values({
            deliverableId: deliverable.id,
            versionNumber: index + 1,
            externalUrl: v.externalUrl,
            uploadedBy: owner.id,
            createdAt: ago(v.createdAgoMs),
          })
          .returning();
        if (!version) continue;

        await db.insert(activityLogs).values({
          projectId: project.id,
          actorId: owner.id,
          action: 'version_uploaded',
          targetType: 'deliverable_version',
          targetId: version.id,
          metadata: { version_number: index + 1 },
          createdAt: ago(v.createdAgoMs),
        });
      }
    }
    console.log(`Deliverables: +${group.deliverables.length} on "${group.projectTitle}".`);
  }

  console.log('Seed complete.');
  process.exit(0);
}

await main();
