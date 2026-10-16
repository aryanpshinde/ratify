import { describe, expect, it } from 'vitest';
import { canUploadVersion, isDeliverableLocked } from '../src/lib/deliverable-guards.js';

describe('deliverable guards', () => {
  it('locks approved deliverables only', () => {
    expect(isDeliverableLocked('approved')).toBe(true);
    expect(isDeliverableLocked('draft')).toBe(false);
    expect(isDeliverableLocked('submitted')).toBe(false);
    expect(isDeliverableLocked('rejected')).toBe(false);
  });

  it('allows version uploads for draft, submitted and rejected', () => {
    expect(canUploadVersion('draft')).toBe(true);
    expect(canUploadVersion('submitted')).toBe(true);
    expect(canUploadVersion('rejected')).toBe(true);
    expect(canUploadVersion('approved')).toBe(false);
  });
});
