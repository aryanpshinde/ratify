import { describe, expect, it } from 'vitest';
import { isTransientDbError, withDbRetry } from '../src/lib/db-retry.js';

describe('isTransientDbError', () => {
  it('recognises neon transient sqlstates', () => {
    expect(isTransientDbError({ code: '57P01' })).toBe(true);
    expect(isTransientDbError({ code: '08006' })).toBe(true);
    expect(isTransientDbError({ code: '08003' })).toBe(true);
  });

  it('reads the sqlstate from a driver error cause', () => {
    expect(isTransientDbError({ cause: { code: '57P01' } })).toBe(true);
  });

  it('recognises dropped socket messages', () => {
    expect(
      isTransientDbError({
        cause: new Error(
          'Client network socket disconnected before secure TLS connection was established',
        ),
      }),
    ).toBe(true);
    expect(isTransientDbError(new Error('Connection terminated unexpectedly'))).toBe(true);
    expect(isTransientDbError(new Error('timeout exceeded when trying to connect'))).toBe(true);
  });

  it('does not treat permanent failures as transient', () => {
    expect(isTransientDbError({ code: '23505' })).toBe(false);
    expect(isTransientDbError(new Error('duplicate key value violates unique constraint'))).toBe(
      false,
    );
    expect(isTransientDbError(new Error('relation "users" does not exist'))).toBe(false);
    expect(isTransientDbError(undefined)).toBe(false);
  });
});

describe('withDbRetry', () => {
  it('returns the first successful result without retrying', async () => {
    let attempts = 0;
    const result = await withDbRetry(async () => {
      attempts += 1;
      return 'ok';
    });

    expect(result).toBe('ok');
    expect(attempts).toBe(1);
  });

  it('retries a transient failure and succeeds', async () => {
    let attempts = 0;
    const result = await withDbRetry(async () => {
      attempts += 1;
      if (attempts < 3) {
        throw { cause: { code: '08006' } };
      }
      return 'recovered';
    });

    expect(result).toBe('recovered');
    expect(attempts).toBe(3);
  });

  it('gives up after the attempt budget and rethrows', async () => {
    let attempts = 0;
    await expect(
      withDbRetry(async () => {
        attempts += 1;
        throw { cause: { code: '08006' } };
      }),
    ).rejects.toBeTruthy();

    expect(attempts).toBe(3);
  });

  it('does not retry a permanent failure', async () => {
    let attempts = 0;
    await expect(
      withDbRetry(async () => {
        attempts += 1;
        throw { code: '23505' };
      }),
    ).rejects.toBeTruthy();

    expect(attempts).toBe(1);
  });
});
