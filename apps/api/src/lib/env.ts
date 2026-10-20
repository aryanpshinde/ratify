import 'dotenv/config';
import { envSchema } from './env-schema.js';

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
