import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { DeliverableListItem } from '@ratify/shared';

export function fetchPortalDeliverables(projectId: string): Promise<DeliverableListItem[]> {
  return apiFetch<DeliverableListItem[]>(`/portal/projects/${projectId}/deliverables`);
}

export function usePortalDeliverables(projectId: string) {
  return useQuery({
    queryKey: ['portal', 'projects', projectId, 'deliverables'],
    queryFn: () => fetchPortalDeliverables(projectId),
    enabled: !!projectId,
  });
}
