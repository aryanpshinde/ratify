import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { type PortalProjectListItem } from '@ratify/shared';

export function fetchPortalProject(projectId: string): Promise<PortalProjectListItem> {
  return apiFetch<PortalProjectListItem>(`/portal/projects/${projectId}`);
}

export function usePortalProject(projectId: string) {
  return useQuery({
    queryKey: ['portal', 'projects', projectId],
    queryFn: () => fetchPortalProject(projectId),
    enabled: !!projectId,
  });
}
