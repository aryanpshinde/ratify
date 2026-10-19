import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { FeedbackThreadPage } from '@ratify/shared';

export function fetchPortalFeedback(
  deliverableId: string,
  cursor: string | null = null,
): Promise<FeedbackThreadPage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiFetch<FeedbackThreadPage>(`/portal/deliverables/${deliverableId}/feedback${query}`);
}

export function usePortalFeedback(deliverableId: string) {
  return useInfiniteQuery({
    queryKey: ['portal', 'deliverables', deliverableId, 'feedback'],
    queryFn: ({ pageParam }) => fetchPortalFeedback(deliverableId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!deliverableId,
  });
}
