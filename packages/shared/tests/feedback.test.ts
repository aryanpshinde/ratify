import { describe, expect, it } from 'vitest';
import {
  approveDeliverableSchema,
  createFeedbackSchema,
  feedbackThreadPageSchema,
  FEEDBACK_BODY_MAX_LENGTH,
  rejectDeliverableSchema,
} from '../src/feedback.js';
import { canDecideDeliverable, canReceiveFeedback } from '../src/deliverable.js';

const validVersionId = '00000000-0000-4000-8000-000000000000';
const validThreadId = '00000000-0000-4000-8000-000000000001';

describe('createFeedbackSchema', () => {
  it('accepts a clean feedback payload', () => {
    const parsed = createFeedbackSchema.safeParse({
      versionId: validVersionId,
      body: 'Looks great overall!',
    });
    expect(parsed.success).toBe(true);
  });

  it('trims surrounding whitespace from the body', () => {
    const parsed = createFeedbackSchema.safeParse({
      versionId: validVersionId,
      body: '  padding side  ',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.body).toBe('padding side');
    }
  });

  it('rejects empty and blank bodies', () => {
    expect(createFeedbackSchema.safeParse({ versionId: validVersionId, body: '' }).success).toBe(
      false,
    );
    expect(createFeedbackSchema.safeParse({ versionId: validVersionId, body: '   ' }).success).toBe(
      false,
    );
  });

  it('rejects bodies over the cap', () => {
    expect(
      createFeedbackSchema.safeParse({
        versionId: validVersionId,
        body: 'a'.repeat(FEEDBACK_BODY_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });

  it('rejects malformed uuids', () => {
    expect(createFeedbackSchema.safeParse({ versionId: 'nope', body: 'x' }).success).toBe(false);
  });

  it('accepts an optional parentId for replies', () => {
    const parsed = createFeedbackSchema.safeParse({
      versionId: validVersionId,
      body: 'reply',
      parentId: validThreadId,
    });
    expect(parsed.success).toBe(true);
  });
});

describe('decision schemas', () => {
  it('accepts an empty decision (no note)', () => {
    expect(approveDeliverableSchema.safeParse({}).success).toBe(true);
    expect(rejectDeliverableSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a trimmed optional note', () => {
    const parsed = approveDeliverableSchema.safeParse({ note: '  Looks good  ' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.note).toBe('Looks good');
    }
  });

  it('rejects notes over the cap', () => {
    expect(
      rejectDeliverableSchema.safeParse({ note: 'x'.repeat(FEEDBACK_BODY_MAX_LENGTH + 1) }).success,
    ).toBe(false);
  });
});

describe('feedbackThreadPageSchema', () => {
  it('validates a thread page envelope', () => {
    const parsed = feedbackThreadPageSchema.safeParse({
      items: [
        {
          id: validThreadId,
          versionId: validVersionId,
          versionNumber: 2,
          body: 'top-level',
          createdAt: new Date().toISOString(),
          author: { id: validVersionId, name: 'Ada', role: 'client' },
          replies: [
            {
              id: validThreadId,
              parentId: validThreadId,
              body: 'reply',
              createdAt: new Date().toISOString(),
              author: { id: null, name: null, role: 'admin' },
            },
          ],
        },
      ],
      nextCursor: null,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an invalid role or timestamp', () => {
    const parsed = feedbackThreadPageSchema.safeParse({
      items: [
        {
          id: validThreadId,
          versionId: validVersionId,
          versionNumber: 1,
          body: 'x',
          createdAt: 'not-a-date',
          author: { id: null, name: null, role: 'owner' },
          replies: [],
        },
      ],
      nextCursor: null,
    });
    expect(parsed.success).toBe(false);
  });
});

describe('status guards', () => {
  it('feedback and decisions are writable only on submitted', () => {
    expect(canReceiveFeedback('submitted')).toBe(true);
    expect(canReceiveFeedback('draft')).toBe(false);
    expect(canReceiveFeedback('approved')).toBe(false);
    expect(canReceiveFeedback('rejected')).toBe(false);
    expect(canDecideDeliverable('submitted')).toBe(true);
    expect(canDecideDeliverable('approved')).toBe(false);
  });
});
