import type { Context } from 'hono';
import { z } from 'zod';

const uuidParamSchema = z.uuid();

export function getUuidParam(c: Context, name: string): string | null {
  const parsed = uuidParamSchema.safeParse(c.req.param(name));
  return parsed.success ? parsed.data : null;
}
