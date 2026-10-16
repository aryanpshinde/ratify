import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { DeliverableDetail } from '@ratify/shared';

export function fetchDeliverable(deliverableId: string): Promise<DeliverableDetail> {
  return apiFetch<DeliverableDetail>(`/deliverables/${deliverableId}`);
}

export function useDeliverable(deliverableId: string) {
  return useQuery({
    queryKey: ['deliverables', deliverableId],
    queryFn: () => fetchDeliverable(deliverableId),
    enabled: !!deliverableId,
  });
}
