import * as z from 'zod';
import { emailSchema } from './common.js';

export const createInvitationSchema = z.object({
  email: emailSchema,
});

export const invitationResponseSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  email: z.email(),
  token: z.string().min(64).max(255),
  expiresAt: z.iso.datetime(),
  invitedBy: z.uuid().nullable(),
  acceptedAt: z.iso.datetime().nullable(),
  revokedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type InvitationResponse = z.infer<typeof invitationResponseSchema>;
