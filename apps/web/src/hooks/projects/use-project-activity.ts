import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ActivityLogPage } from '@ratify/shared';

export function fetchProjectActivity(
  projectId: string,
  cursor: string | null = null,
): Promise<ActivityLogPage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiFetch<ActivityLogPage>(`/projects/${projectId}/activity${query}`);
}

export function useProjectActivity(projectId: string) {
  return useInfiniteQuery({
    queryKey: ['projects', projectId, 'activity'],
    queryFn: ({ pageParam }) => fetchProjectActivity(projectId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!projectId,
  });
}
