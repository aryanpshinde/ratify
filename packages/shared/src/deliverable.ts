import * as z from 'zod';

export const deliverableStatusSchema = z.enum(['draft', 'submitted', 'approved', 'rejected']);

export const createDeliverableSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z
    .string()
    .trim()
    .transform((value) => (value === '' ? undefined : value))
    .optional(),
});

export const updateDeliverableSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const createLinkVersionSchema = z.object({
  externalUrl: z.url('Enter a valid URL').max(2048),
});

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_NAME_LENGTH = 200;

export const allowedFileMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
] as const;

export type AllowedFileMimeType = (typeof allowedFileMimeTypes)[number];

export function isAllowedFileMimeType(mimeType: string): mimeType is AllowedFileMimeType {
  return (allowedFileMimeTypes as readonly string[]).includes(mimeType);
}

export const fileVersionAcceptAttribute = allowedFileMimeTypes.join(',');

export const deliverableResponseSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  createdBy: z.uuid().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: deliverableStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const deliverableVersionResponseSchema = z.object({
  id: z.uuid(),
  deliverableId: z.uuid(),
  versionNumber: z.number().int().positive(),
  externalUrl: z.string().nullable(),
  fileName: z.string().nullable(),
  fileSize: z.number().int().nullable(),
  mimeType: z.string().nullable(),
  uploadedBy: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
});

export const deliverableListItemSchema = deliverableResponseSchema.extend({
  versionCount: z.number().int().nonnegative(),
  latestVersion: deliverableVersionResponseSchema.nullable(),
});

export const deliverableDetailSchema = deliverableResponseSchema.extend({
  versions: z.array(deliverableVersionResponseSchema),
});

export type DeliverableStatus = z.infer<typeof deliverableStatusSchema>;
export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>;
export type UpdateDeliverableInput = z.infer<typeof updateDeliverableSchema>;
export type CreateLinkVersionInput = z.infer<typeof createLinkVersionSchema>;
export type DeliverableResponse = z.infer<typeof deliverableResponseSchema>;
export type DeliverableVersionResponse = z.infer<typeof deliverableVersionResponseSchema>;
export type DeliverableListItem = z.infer<typeof deliverableListItemSchema>;
export type DeliverableDetail = z.infer<typeof deliverableDetailSchema>;
