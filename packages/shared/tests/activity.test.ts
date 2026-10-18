import { describe, expect, it } from 'vitest';
import {
  decodeActivityCursor,
  encodeActivityCursor,
  activityLogPageSchema,
  ACTIVITY_PAGE_SIZE_DEFAULT,
  ACTIVITY_PAGE_SIZE_MAX,
} from '../src/activity.js';

const cursor = { t: '2026-10-18T07:26:23.480Z', i: '97b1f58d-944f-4e8e-a5e1-9cceeadf70e1' };

describe('activity cursor codec', () => {
  it('round-trips a cursor through url-safe encoding', () => {
    const encoded = encodeActivityCursor(cursor);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeActivityCursor(encoded)).toEqual(cursor);
  });

  it('rejects tampered cursors', () => {
    const encoded = encodeActivityCursor(cursor);
    expect(decodeActivityCursor(encoded.slice(0, -2))).toBeNull();
    expect(decodeActivityCursor(encodeActivityCursor({ ...cursor, i: 'not-a-uuid' }))).toBeNull();
    expect(decodeActivityCursor(encodeActivityCursor({ ...cursor, t: 'yesterday' }))).toBeNull();
  });

  it('rejects malformed or oversized input without throwing', () => {
    expect(decodeActivityCursor('')).toBeNull();
    expect(decodeActivityCursor('a'.repeat(513))).toBeNull();
    expect(decodeActivityCursor('!!!invalid base64url')).toBeNull();
    expect(decodeActivityCursor('dHJ1bmsgfCBzdHVmZg==')).toBeNull();
  });
});

describe('activity page schema', () => {
  it('accepts a page payload and validates defaults exist', () => {
    const parsed = activityLogPageSchema.safeParse({
      items: [
        {
          id: '97b1f58d-944f-4e8e-a5e1-9cceeadf70e1',
          projectId: 'c7f6a288-8232-4ad4-a445-3ec35d5e9fb4',
          actorId: null,
          actorName: null,
          action: 'project_created',
          targetType: null,
          targetId: null,
          metadata: null,
          createdAt: '2026-10-18T07:26:23.480Z',
        },
      ],
      nextCursor: null,
    });
    expect(parsed.success).toBe(true);
    expect(ACTIVITY_PAGE_SIZE_DEFAULT).toBe(10);
    expect(ACTIVITY_PAGE_SIZE_MAX).toBe(100);
  });
});
