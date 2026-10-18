import { describe, expect, it } from 'vitest';
import {
  canSubmitDeliverable,
  canUploadVersion,
  isDeliverableLocked,
  isPortalDeliverableVisible,
} from '../src/deliverable.js';

describe('deliverable status guards', () => {
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

  it('allows submission only from draft or rejected', () => {
    expect(canSubmitDeliverable('draft')).toBe(true);
    expect(canSubmitDeliverable('rejected')).toBe(true);
    expect(canSubmitDeliverable('submitted')).toBe(false);
    expect(canSubmitDeliverable('approved')).toBe(false);
  });

  it('hides drafts from the client portal and keeps decided work visible', () => {
    expect(isPortalDeliverableVisible('submitted')).toBe(true);
    expect(isPortalDeliverableVisible('approved')).toBe(true);
    expect(isPortalDeliverableVisible('rejected')).toBe(true);
    expect(isPortalDeliverableVisible('draft')).toBe(false);
  });
});
