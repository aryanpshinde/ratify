import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { type PortalProjectListItem } from '@ratify/shared';

async function fetchPortalProjects(): Promise<PortalProjectListItem[]> {
  return apiFetch<PortalProjectListItem[]>('/portal/projects');
}

export function usePortalProjects(enabled = true) {
  return useQuery({
    queryKey: ['portal', 'projects'],
    queryFn: fetchPortalProjects,
    enabled,
  });
}
