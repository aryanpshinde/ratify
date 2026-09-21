import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  index,
  uniqueIndex,
  varchar,
  pgEnum,
  date,
  jsonb,
  check,
} from 'drizzle-orm/pg-core';
export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'in_progress',
  'review',
  'completed',
  'archived',
]);
export const projectMemberRoleEnum = pgEnum('member_role', ['admin', 'client']);

export const users = pgTable('users', {
  id: uuid('id')
    .default(sql`pg_catalog.gen_random_uuid()`)
    .primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id')
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [index('sessions_userId_idx').on(table.userId)],
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id')
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    issuer: text('issuer').notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('accounts_issuer_accountId_uidx').on(table.issuer, table.accountId),
    index('accounts_userId_idx').on(table.userId),
  ],
);

export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id')
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
);

export const clients = pgTable(
  'clients',
  {
    id: uuid('id')
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    company: varchar('company', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('clients_ownerId_idx').on(table.ownerId),
    index('clients_userId_idx').on(table.userId),
    uniqueIndex('clients_owner_lower_email_uidx').on(table.ownerId, sql`lower(${table.email})`),
  ],
);

export const projects = pgTable(
  'projects',
  {
    id: uuid('id')
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status: projectStatusEnum('status').notNull().default('planning'),
    deadline: date('deadline'),
    budgetDisplay: varchar('budget_display', { length: 100 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('projects_ownerId_idx').on(table.ownerId),
    index('projects_clientId_idx').on(table.clientId),
    index('projects_status_idx').on(table.status),
  ],
);

export const projectMembers = pgTable(
  'project_members',
  {
    id: uuid('id')
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: projectMemberRoleEnum('role').notNull().default('client'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('project_members_userId_idx').on(table.userId),
    uniqueIndex('project_members_projectId_userId_uidx').on(table.projectId, table.userId),
  ],
);

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id')
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 100 }).notNull(),
    targetType: varchar('target_type', { length: 50 }),
    targetId: uuid('target_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('activity_logs_projectId_idx').on(table.projectId),
    index('activity_logs_createdAt_idx').on(table.createdAt),
    check(
      'activity_logs_target_pair_chk',
      sql`(${table.targetType} IS NULL AND ${table.targetId} IS NULL) OR (${table.targetType} IS NOT NULL AND ${table.targetId} IS NOT NULL)`,
    ),
  ],
);

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id')
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
    email: varchar('email', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at')
      .notNull()
      .default(sql`(now() + interval '7 days')`),
    acceptedAt: timestamp('accepted_at'),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('invitations_projectId_idx').on(table.projectId),
    index('invitations_invitedBy_idx').on(table.invitedBy),
    uniqueIndex('invitations_one_active_per_project_email')
      .on(table.projectId, sql`lower(${table.email})`)
      .where(sql`accepted_at IS NULL AND revoked_at IS NULL`),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  ownedClients: many(clients, { relationName: 'clientOwner' }),
  linkedClients: many(clients, { relationName: 'clientLinkedUsers' }),
  ownedProjects: many(projects),
  projectMemberships: many(projectMembers),
  activityLogs: many(activityLogs),
  sentInvitations: many(invitations),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  owner: one(users, {
    fields: [clients.ownerId],
    references: [users.id],
    relationName: 'clientOwner',
  }),
  linkedUser: one(users, {
    fields: [clients.userId],
    references: [users.id],
    relationName: 'clientLinkedUsers',
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  members: many(projectMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  project: one(projects, {
    fields: [activityLogs.projectId],
    references: [projects.id],
  }),
  actor: one(users, {
    fields: [activityLogs.actorId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  project: one(projects, {
    fields: [invitations.projectId],
    references: [projects.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));
