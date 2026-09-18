import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ProjectListItem } from '@ratify/shared';

export function fetchProject(projectId: string): Promise<ProjectListItem> {
  return apiFetch<ProjectListItem>(`/projects/${projectId}`);
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });
}
