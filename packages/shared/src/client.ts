import * as z from 'zod';

const normalizedEmail = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.email().max(255));

export const createClientSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: normalizedEmail,
  company: z.string().max(255).optional(),
});

export const updateClientSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    email: normalizedEmail.optional(),
    company: z.string().max(255).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
