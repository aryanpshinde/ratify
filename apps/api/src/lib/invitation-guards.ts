export interface InviteStatus {
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}

export function isInviteExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt <= now;
}

export function isInviteActive(inv: InviteStatus, now: Date = new Date()): boolean {
  return inv.acceptedAt === null && inv.revokedAt === null && inv.expiresAt > now;
}

export function emailsMatch(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function findActiveInvite<T extends InviteStatus>(
  invites: T[],
  now: Date = new Date(),
): T | undefined {
  return invites.find((inv) => isInviteActive(inv, now));
}

export function isTokenShapeValid(raw: string): boolean {
  const t = raw.trim();
  return t.length >= 64 && t.length <= 255;
}

export function isPortalProjectVisible(
  membership: { role: string } | null,
  status: string,
): boolean {
  return membership !== null && membership.role === 'client' && status !== 'archived';
}
