import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { InvitationResponse } from '@ratify/shared';

export function fetchInvitations(projectId: string): Promise<InvitationResponse[]> {
  return apiFetch<InvitationResponse[]>(`/projects/${projectId}/invitations`);
}

export function useInvitations(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'invitations'],
    queryFn: () => fetchInvitations(projectId),
    enabled: !!projectId,
  });
}
