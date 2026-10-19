import * as z from 'zod';
import { memberRoleSchema } from './project.js';

export const FEEDBACK_BODY_MAX_LENGTH = 2000;
export const FEEDBACK_PAGE_SIZE_DEFAULT = 10;
export const FEEDBACK_PAGE_SIZE_MAX = 100;

export const feedbackBodySchema = z.string().trim().min(1).max(FEEDBACK_BODY_MAX_LENGTH);

export const createFeedbackSchema = z.object({
  versionId: z.uuid(),
  body: feedbackBodySchema,
  parentId: z.uuid().optional(),
});

export const decisionNoteSchema = z.string().trim().min(1).max(FEEDBACK_BODY_MAX_LENGTH);

export const approveDeliverableSchema = z.object({ note: decisionNoteSchema.optional() });

export const rejectDeliverableSchema = z.object({ note: decisionNoteSchema.optional() });

const feedbackAuthorResponseSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().nullable(),
  role: memberRoleSchema,
});

export const feedbackReplyResponseSchema = z.object({
  id: z.uuid(),
  parentId: z.uuid(),
  body: z.string(),
  createdAt: z.iso.datetime(),
  author: feedbackAuthorResponseSchema,
});

export const feedbackThreadResponseSchema = z.object({
  id: z.uuid(),
  versionId: z.uuid(),
  versionNumber: z.number().int().positive(),
  body: z.string(),
  createdAt: z.iso.datetime(),
  author: feedbackAuthorResponseSchema,
  replies: z.array(feedbackReplyResponseSchema),
});

export const feedbackThreadPageSchema = z.object({
  items: z.array(feedbackThreadResponseSchema),
  nextCursor: z.string().nullable(),
});

export const createdFeedbackResponseSchema = z.object({
  id: z.uuid(),
  versionId: z.uuid(),
  parentId: z.uuid().nullable(),
  body: z.string(),
  createdAt: z.iso.datetime(),
  author: feedbackAuthorResponseSchema,
});

export type FeedbackAuthorResponse = z.infer<typeof feedbackAuthorResponseSchema>;
export type FeedbackReplyResponse = z.infer<typeof feedbackReplyResponseSchema>;
export type FeedbackThreadResponse = z.infer<typeof feedbackThreadResponseSchema>;
export type FeedbackThreadPage = z.infer<typeof feedbackThreadPageSchema>;
export type CreatedFeedbackResponse = z.infer<typeof createdFeedbackResponseSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type ApproveDeliverableInput = z.infer<typeof approveDeliverableSchema>;
export type RejectDeliverableInput = z.infer<typeof rejectDeliverableSchema>;
