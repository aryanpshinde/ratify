import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { FeedbackThreadPage } from '@ratify/shared';

export function fetchDeliverableFeedback(
  deliverableId: string,
  cursor: string | null = null,
): Promise<FeedbackThreadPage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiFetch<FeedbackThreadPage>(`/deliverables/${deliverableId}/feedback${query}`);
}

export function useDeliverableFeedback(deliverableId: string) {
  return useInfiniteQuery({
    queryKey: ['deliverables', deliverableId, 'feedback'],
    queryFn: ({ pageParam }) => fetchDeliverableFeedback(deliverableId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!deliverableId,
  });
}
