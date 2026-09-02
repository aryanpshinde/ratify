import * as z from 'zod';

const normalizedEmail = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.email().max(255));

export const createClientSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: normalizedEmail,
  company: z
    .string()
    .trim()
    .max(255)
    .transform((value) => (value === '' ? undefined : value))
    .optional(),
});

export const updateClientSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    email: normalizedEmail.optional(),
    company: z.string().trim().max(255).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const clientResponseSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  userId: z.uuid().nullable(),
  name: z.string(),
  email: z.email(),
  company: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientResponse = z.infer<typeof clientResponseSchema>;
