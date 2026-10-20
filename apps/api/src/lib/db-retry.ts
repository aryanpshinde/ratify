const TRANSIENT_CODES = new Set(['57P01', '08006', '08003', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE']);

const TRANSIENT_MESSAGES = [
  'Client network socket disconnected',
  'Connection terminated',
  'timeout exceeded',
  'Connection reset by peer',
  'the database system is starting up',
];

export function isTransientDbError(error: unknown): boolean {
  const code =
    (error as { code?: unknown } | undefined)?.code ??
    (error as { cause?: { code?: unknown } } | undefined)?.cause?.code;
  const message =
    (error as { message?: unknown } | undefined)?.message ??
    (error as { cause?: { message?: unknown } } | undefined)?.cause?.message;

  if (typeof code === 'string' && TRANSIENT_CODES.has(code)) {
    return true;
  }

  return (
    typeof message === 'string' &&
    TRANSIENT_MESSAGES.some((candidate) => message.includes(candidate))
  );
}

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientDbError(error) || attempt === attempts - 1) {
        throw error;
      }
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
    }
  }

  throw lastError;
}
