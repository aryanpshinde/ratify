import { describe, expect, it } from 'vitest';
import {
  emailsMatch,
  findActiveInvite,
  isInviteActive,
  isInviteExpired,
  isPortalProjectVisible,
  isTokenShapeValid,
} from '../src/lib/invitation-guards.js';

describe('invite guards', () => {
  it('expired when past', () => {
    expect(isInviteExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(isInviteExpired(new Date(Date.now() + 86400000))).toBe(false);
  });

  it('active only when pending and fresh', () => {
    const fresh = new Date(Date.now() + 86400000);
    const stale = new Date(Date.now() - 1000);
    expect(isInviteActive({ acceptedAt: null, revokedAt: null, expiresAt: fresh })).toBe(true);
    expect(
      isInviteActive({ acceptedAt: new Date(), revokedAt: null, expiresAt: fresh }),
    ).toBe(false);
    expect(
      isInviteActive({ acceptedAt: null, revokedAt: new Date(), expiresAt: fresh }),
    ).toBe(false);
    expect(isInviteActive({ acceptedAt: null, revokedAt: null, expiresAt: stale })).toBe(false);
  });

  it('matches emails case-insensitively', () => {
    expect(emailsMatch('Client@Acme.com', 'client@acme.com')).toBe(true);
    expect(emailsMatch('a@x.com', 'b@x.com')).toBe(false);
  });

  it('finds active ignoring expired', () => {
    const fresh = new Date(Date.now() + 86400000);
    const stale = new Date(Date.now() - 1000);
    const found = findActiveInvite([
      { acceptedAt: null, revokedAt: null, expiresAt: stale },
      { acceptedAt: null, revokedAt: null, expiresAt: fresh },
    ]);
    expect(found?.expiresAt).toEqual(fresh);
  });

  it('validates token shape', () => {
    expect(isTokenShapeValid('a'.repeat(64))).toBe(true);
    expect(isTokenShapeValid('short')).toBe(false);
  });

  it('portal visible only for client non-archived', () => {
    expect(isPortalProjectVisible({ role: 'client' }, 'in_progress')).toBe(true);
    expect(isPortalProjectVisible({ role: 'client' }, 'archived')).toBe(false);
    expect(isPortalProjectVisible({ role: 'admin' }, 'in_progress')).toBe(false);
    expect(isPortalProjectVisible(null, 'in_progress')).toBe(false);
  });
});
