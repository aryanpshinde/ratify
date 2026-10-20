import { describe, expect, it } from 'vitest';
import { envSchema, isSecureEndpoint } from '../src/lib/env-schema.js';

const base = {
  DATABASE_URL: 'postgres://user:pass@localhost:5432/ratify',
  BETTER_AUTH_SECRET: 'a-secret-that-is-long-enough-for-tests',
  STORAGE_PROVIDER: 'neon',
  STORAGE_ENDPOINT: 'https://storage.example.com',
  STORAGE_BUCKET: 'ratify-deliverables',
  STORAGE_ACCESS_KEY: 'key',
  STORAGE_SECRET_KEY: 'secret',
  STORAGE_REGION: 'us-east-1',
};

describe('isSecureEndpoint', () => {
  it('accepts https anywhere', () => {
    expect(isSecureEndpoint('https://storage.example.com')).toBe(true);
    expect(isSecureEndpoint('https://127.0.0.1:9000')).toBe(true);
  });

  it('accepts http only on loopback hosts', () => {
    expect(isSecureEndpoint('http://127.0.0.1:9000')).toBe(true);
    expect(isSecureEndpoint('http://localhost:9000')).toBe(true);
    expect(isSecureEndpoint('http://[::1]:9000')).toBe(true);
  });

  it('rejects http on any other host', () => {
    expect(isSecureEndpoint('http://storage.example.com')).toBe(false);
    expect(isSecureEndpoint('http://10.0.0.5:9000')).toBe(false);
    expect(isSecureEndpoint('http://127.0.0.1.evil.test:9000')).toBe(false);
    expect(isSecureEndpoint('http://notlocalhost:9000')).toBe(false);
    expect(isSecureEndpoint('http://[::ffff:127.0.0.1]:9000')).toBe(false);
  });
});

describe('envSchema', () => {
  it('accepts a complete non production configuration', () => {
    const parsed = envSchema.safeParse(base);
    expect(parsed.success).toBe(true);
  });

  it('accepts a loopback storage endpoint for a local emulator', () => {
    const parsed = envSchema.safeParse({ ...base, STORAGE_ENDPOINT: 'http://127.0.0.1:9000' });
    expect(parsed.success).toBe(true);
  });

  it('rejects a plain http storage endpoint on a remote host', () => {
    const parsed = envSchema.safeParse({ ...base, STORAGE_ENDPOINT: 'http://storage.example.com' });
    expect(parsed.success).toBe(false);
  });

  it('rejects a missing database url', () => {
    const { DATABASE_URL, ...withoutDatabase } = base;
    void DATABASE_URL;
    const parsed = envSchema.safeParse(withoutDatabase);
    expect(parsed.success).toBe(false);
  });

  it('requires a long secret and https origins in production', () => {
    const short = envSchema.safeParse({
      ...base,
      NODE_ENV: 'production',
      BETTER_AUTH_SECRET: 'short',
      FRONTEND_URL: 'http://localhost:5173',
      BETTER_AUTH_URL: 'http://localhost:3000',
    });

    expect(short.success).toBe(false);
    const paths = short.success ? [] : short.error.issues.map((issue) => issue.path.join('.'));
    expect(paths).toContain('BETTER_AUTH_SECRET');
    expect(paths).toContain('FRONTEND_URL');
    expect(paths).toContain('BETTER_AUTH_URL');
  });

  it('accepts a valid production configuration', () => {
    const parsed = envSchema.safeParse({
      ...base,
      NODE_ENV: 'production',
      BETTER_AUTH_SECRET: 'a-secret-that-is-long-enough-for-production',
      FRONTEND_URL: 'https://app.example.com',
      BETTER_AUTH_URL: 'https://app.example.com',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a loopback storage endpoint in production', () => {
    const parsed = envSchema.safeParse({
      ...base,
      NODE_ENV: 'production',
      BETTER_AUTH_SECRET: 'a-secret-that-is-long-enough-for-production',
      FRONTEND_URL: 'https://app.example.com',
      BETTER_AUTH_URL: 'https://app.example.com',
      STORAGE_ENDPOINT: 'http://127.0.0.1:9000',
    });

    expect(parsed.success).toBe(false);
    const paths = parsed.success ? [] : parsed.error.issues.map((issue) => issue.path.join('.'));
    expect(paths).toContain('STORAGE_ENDPOINT');
  });
});
