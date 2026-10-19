import { describe, expect, it } from 'vitest';
import { encodeActivityCursor } from '@ratify/shared';
import {
  buildActivityCursor,
  parseActivityFeedParams,
  parseFeedbackFeedParams,
} from '../src/lib/pagination-guards.js';

const cursor = { t: '2026-10-18T07:26:23.480Z', i: '97b1f58d-944f-4e8e-a5e1-9cceeadf70e1' };

describe('parseActivityFeedParams', () => {
  it('applies the default page size when no params are given', () => {
    expect(parseActivityFeedParams(null, null)).toEqual({ limit: 10, cursor: null });
  });

  it('accepts a valid limit and a valid cursor', () => {
    expect(parseActivityFeedParams('25', encodeActivityCursor(cursor))).toEqual({
      limit: 25,
      cursor,
    });
  });

  it('accepts the max page size', () => {
    expect(parseActivityFeedParams(String(100), null)).toEqual({ limit: 100, cursor: null });
  });

  it('rejects out-of-range or non-integer limits', () => {
    expect(parseActivityFeedParams('0', null)).toBeNull();
    expect(parseActivityFeedParams('101', null)).toBeNull();
    expect(parseActivityFeedParams('1.5', null)).toBeNull();
    expect(parseActivityFeedParams('abc', null)).toBeNull();
    expect(parseActivityFeedParams('', null)).toBeNull();
  });

  it('rejects invalid cursors', () => {
    expect(parseActivityFeedParams('10', 'nonsense')).toBeNull();
    expect(parseActivityFeedParams('10', '!!!')).toBeNull();
  });
});

describe('parseFeedbackFeedParams', () => {
  it('applies the feedback default page size', () => {
    expect(parseFeedbackFeedParams(null, null)).toEqual({ limit: 10, cursor: null });
  });

  it('roundtrips a cursor built by buildActivityCursor', () => {
    const createdAt = new Date('2026-10-19T08:00:00.000Z');
    const id = '97b1f58d-944f-4e8e-a5e1-9cceeadf70e1';
    const parsed = parseFeedbackFeedParams('5', buildActivityCursor(createdAt, id));
    expect(parsed).toEqual({
      limit: 5,
      cursor: { t: '2026-10-19T08:00:00.000Z', i: id },
    });
  });

  it('rejects out-of-range or non-integer limits', () => {
    expect(parseFeedbackFeedParams('0', null)).toBeNull();
    expect(parseFeedbackFeedParams('101', null)).toBeNull();
    expect(parseFeedbackFeedParams('2.5', null)).toBeNull();
    expect(parseFeedbackFeedParams('abc', null)).toBeNull();
  });

  it('rejects invalid cursors', () => {
    expect(parseFeedbackFeedParams('10', 'garbage')).toBeNull();
  });
});
