import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ActivityLogResponse } from '@ratify/shared';

export function fetchProjectActivity(projectId: string): Promise<ActivityLogResponse[]> {
  return apiFetch<ActivityLogResponse[]>(`/projects/${projectId}/activity`);
}

export function useProjectActivity(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'activity'],
    queryFn: () => fetchProjectActivity(projectId),
    enabled: !!projectId,
  });
}
