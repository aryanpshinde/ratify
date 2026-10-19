import {
  ACTIVITY_PAGE_SIZE_DEFAULT,
  ACTIVITY_PAGE_SIZE_MAX,
  FEEDBACK_PAGE_SIZE_DEFAULT,
  FEEDBACK_PAGE_SIZE_MAX,
  decodeActivityCursor,
  encodeActivityCursor,
  type ActivityCursor,
} from '@ratify/shared';

export interface ActivityFeedParams {
  limit: number;
  cursor: ActivityCursor | null;
}

function parseKeysetFeedParams(
  limitRaw: string | null | undefined,
  cursorRaw: string | null | undefined,
  defaultLimit: number,
  maxLimit: number,
): ActivityFeedParams | null {
  const limitInput = limitRaw ?? null;
  const cursorInput = cursorRaw ?? null;

  let limit = defaultLimit;
  if (limitInput !== null) {
    const parsed = Number(limitInput);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > maxLimit) {
      return null;
    }
    limit = parsed;
  }

  if (cursorInput === null) {
    return { limit, cursor: null };
  }

  const cursor = decodeActivityCursor(cursorInput);
  if (!cursor) {
    return null;
  }

  return { limit, cursor };
}

export function parseActivityFeedParams(
  limitRaw: string | null | undefined,
  cursorRaw: string | null | undefined,
): ActivityFeedParams | null {
  return parseKeysetFeedParams(
    limitRaw,
    cursorRaw,
    ACTIVITY_PAGE_SIZE_DEFAULT,
    ACTIVITY_PAGE_SIZE_MAX,
  );
}

export function parseFeedbackFeedParams(
  limitRaw: string | null | undefined,
  cursorRaw: string | null | undefined,
): ActivityFeedParams | null {
  return parseKeysetFeedParams(
    limitRaw,
    cursorRaw,
    FEEDBACK_PAGE_SIZE_DEFAULT,
    FEEDBACK_PAGE_SIZE_MAX,
  );
}

export function buildActivityCursor(createdAt: Date, id: string): string {
  return encodeActivityCursor({ t: createdAt.toISOString(), i: id });
}
