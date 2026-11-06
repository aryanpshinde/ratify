import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ActivityLogPage } from '@ratify/shared';

export function fetchPortalProjectActivity(
  projectId: string,
  cursor: string | null = null,
): Promise<ActivityLogPage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiFetch<ActivityLogPage>(`/portal/projects/${projectId}/activity${query}`);
}

export function usePortalProjectActivity(projectId: string) {
  return useInfiniteQuery({
    queryKey: ['portal', 'projects', projectId, 'activity'],
    queryFn: ({ pageParam }) => fetchPortalProjectActivity(projectId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!projectId,
  });
}
