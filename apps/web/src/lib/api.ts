const API_BASE = '/api';

export interface ApiSuccess<T> {
  status: 'ok';
  data: T;
}

export interface ApiFailure {
  status: 'error';
  message: string;
  error?: unknown;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  readonly status: number;
  readonly issues: unknown;

  constructor(message: string, status: number, issues: unknown = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.issues = issues;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  let envelope: ApiEnvelope<T> | undefined;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    envelope = undefined;
  }

  if (!res.ok || !envelope || envelope.status !== 'ok') {
    const message =
      envelope && envelope.status === 'error'
        ? envelope.message
        : `Request failed with status ${res.status}`;
    const issues = envelope && envelope.status === 'error' ? envelope.error : undefined;
    throw new ApiError(message, res.status, issues);
  }

  return envelope.data;
}
