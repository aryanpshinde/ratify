import { describe, expect, it } from 'vitest';
import {
  createInvitationSchema,
  invitationResponseSchema,
} from '../src/invitation.js';

describe('createInvitationSchema', () => {
  it('accepts a valid email', () => {
    const result = createInvitationSchema.safeParse({ email: 'client@acme.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = createInvitationSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('lowercases email via common schema', () => {
    const result = createInvitationSchema.safeParse({ email: 'Client@Acme.COM' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('client@acme.com');
    }
  });
});

describe('invitationResponseSchema token', () => {
  const base = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    projectId: '550e8400-e29b-41d4-a716-446655440001',
    email: 'client@acme.com',
    invitedBy: null,
    acceptedAt: null,
    revokedAt: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };

  it('accepts 64-char token', () => {
    const result = invitationResponseSchema.safeParse({ ...base, token: 'a'.repeat(64) });
    expect(result.success).toBe(true);
  });

  it('rejects short token', () => {
    const result = invitationResponseSchema.safeParse({ ...base, token: 'short' });
    expect(result.success).toBe(false);
  });
});
