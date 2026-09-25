import * as z from 'zod';

export const projectStatusSchema = z.enum([
  'planning',
  'in_progress',
  'review',
  'completed',
  'archived',
]);

export const memberRoleSchema = z.enum(['admin', 'client']);

export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z
    .string()
    .trim()
    .transform((value) => (value === '' ? undefined : value))
    .optional(),
  clientId: z.uuid(),
  deadline: z.iso.date().optional(),
  budgetDisplay: z
    .string()
    .trim()
    .max(100)
    .transform((value) => (value === '' ? undefined : value))
    .optional(),
});

export const updateProjectSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().nullable().optional(),
    status: projectStatusSchema.optional(),
    deadline: z.iso.date().nullable().optional(),
    budgetDisplay: z.string().trim().max(100).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const projectResponseSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  clientId: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: projectStatusSchema,
  deadline: z.iso.date().nullable(),
  budgetDisplay: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const projectListItemSchema = projectResponseSchema.extend({
  clientName: z.string(),
  clientCompany: z.string().nullable(),
  clientEmail: z.email(),
});

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type MemberRole = z.infer<typeof memberRoleSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
export type ProjectListItem = z.infer<typeof projectListItemSchema>;
