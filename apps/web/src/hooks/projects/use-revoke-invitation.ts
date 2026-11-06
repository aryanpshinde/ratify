import { ApiError, apiFetch } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RevokeInvitationVariables {
  projectId: string;
  invitationId: string;
}

async function revokeInvitation({ projectId, invitationId }: RevokeInvitationVariables) {
  return apiFetch<string>(`/projects/${projectId}/invitations/${invitationId}`, {
    method: 'DELETE',
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['projects', variables.projectId, 'invitations'],
      });
      toast.success('Invitation revoked');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(error.message);
        return;
      }
      const message =
        error instanceof ApiError ? error.message : 'Failed to revoke invitation. Please try again';
      toast.error('Failed to revoke invitation', { description: message });
    },
  });
}
