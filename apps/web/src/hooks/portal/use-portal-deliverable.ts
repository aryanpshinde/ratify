import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { DeliverableDetail } from '@ratify/shared';

export function fetchPortalDeliverable(deliverableId: string): Promise<DeliverableDetail> {
  return apiFetch<DeliverableDetail>(`/portal/deliverables/${deliverableId}`);
}

export function usePortalDeliverable(deliverableId: string) {
  return useQuery({
    queryKey: ['portal', 'deliverables', deliverableId],
    queryFn: () => fetchPortalDeliverable(deliverableId),
    enabled: !!deliverableId,
  });
}
