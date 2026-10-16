import type { DeliverableStatus } from '@ratify/shared';

export function isDeliverableLocked(status: DeliverableStatus): boolean {
  return status === 'approved';
}

export function canUploadVersion(status: DeliverableStatus): boolean {
  return !isDeliverableLocked(status);
}
