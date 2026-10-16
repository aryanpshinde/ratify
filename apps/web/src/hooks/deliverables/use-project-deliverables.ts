import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { DeliverableListItem } from '@ratify/shared';

export function fetchProjectDeliverables(projectId: string): Promise<DeliverableListItem[]> {
  return apiFetch<DeliverableListItem[]>(`/projects/${projectId}/deliverables`);
}

export function useProjectDeliverables(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'deliverables'],
    queryFn: () => fetchProjectDeliverables(projectId),
    enabled: !!projectId,
  });
}
