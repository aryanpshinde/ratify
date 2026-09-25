import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateInvitationInput, InvitationResponse } from '@ratify/shared';
import { apiFetch, ApiError } from '@/lib/api';
import { toast } from 'sonner';

interface CreateInvitationVariables {
  projectId: string;
  data: CreateInvitationInput;
}

async function createInvitation({
  projectId,
  data,
}: CreateInvitationVariables): Promise<InvitationResponse> {
  return apiFetch<InvitationResponse>(`/projects/${projectId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvitation,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'invitations'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'activity'] });
      toast.success('Invitation created');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('An active invitation already exists for this client.');
        return;
      }
      if (error instanceof ApiError && error.status === 400) {
        toast.error('Failed to create invitation', { description: error.message });
        return;
      }
      if (error instanceof ApiError && error.status === 404) return;
      const message =
        error instanceof ApiError ? error.message : 'Failed to create invitation. Please try again';
      toast.error('Failed to create invitation', { description: message });
    },
  });
}
