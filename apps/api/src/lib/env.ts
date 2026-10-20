import 'dotenv/config';
import * as z from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required')
      .refine(
        (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
        'DATABASE_URL must be a Postgresql connection string',
      ),
    BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
    BETTER_AUTH_URL: z.string().optional(),
    FRONTEND_URL: z.url().default('http://localhost:5173'),
    STORAGE_PROVIDER: z.enum(['neon']),
    STORAGE_ENDPOINT: z
      .url()
      .refine((value) => value.startsWith('https://'), 'STORAGE_ENDPOINT must use https'),
    STORAGE_BUCKET: z
      .string()
      .min(3)
      .max(63)
      .regex(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/, 'STORAGE_BUCKET must be a valid bucket name'),
    STORAGE_ACCESS_KEY: z.string().min(1, 'STORAGE_ACCESS_KEY is required'),
    STORAGE_SECRET_KEY: z.string().min(1, 'STORAGE_SECRET_KEY is required'),
    STORAGE_REGION: z.string().min(1, 'STORAGE_REGION is required'),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== 'production') {
      return;
    }

    if (value.BETTER_AUTH_SECRET.length < 32) {
      ctx.addIssue({
        code: 'custom',
        path: ['BETTER_AUTH_SECRET'],
        message: 'BETTER_AUTH_SECRET must be at least 32 characters in production',
      });
    }

    if (!value.FRONTEND_URL.startsWith('https://')) {
      ctx.addIssue({
        code: 'custom',
        path: ['FRONTEND_URL'],
        message: 'FRONTEND_URL must use https in production',
      });
    }

    if (value.BETTER_AUTH_URL !== undefined && !value.BETTER_AUTH_URL.startsWith('https://')) {
      ctx.addIssue({
        code: 'custom',
        path: ['BETTER_AUTH_URL'],
        message: 'BETTER_AUTH_URL must use https in production',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environmental variables');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
