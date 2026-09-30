import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { InvitationPreview } from '@ratify/shared';

async function fetchInvitation(token: string): Promise<InvitationPreview> {
  return apiFetch<InvitationPreview>(`/invitations/${token}`);
}

export function useInvitation(token: string) {
  return useQuery({
    queryKey: ['invitations', token],
    queryFn: () => fetchInvitation(token),
    enabled: !!token,
    retry: false,
  });
}
