import { useMutation } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';
import { toast } from 'sonner';

async function acceptInvitation(token: string): Promise<{ projectId: string }> {
  return apiFetch<{ projectId: string }>(`/invitations/${token}/accept`, {
    method: 'POST',
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      toast.success('Invitation accepted');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403) {
        toast.error('That invitation was sent to a different email address.', {
          description: 'Sign in with the address the invitation was sent to.',
        });
        return;
      }
      if (error instanceof ApiError && error.status === 409) {
        toast.error('This client contact is already linked to another account.');
        return;
      }
      if (error instanceof ApiError && error.status === 410) {
        toast.error('This invitation is no longer valid.');
        return;
      }
      if (error instanceof ApiError && error.status === 401) {
        toast.error('Please sign in to accept this invitation.');
        return;
      }
      const message =
        error instanceof ApiError ? error.message : 'Failed to accept. Please try again';
      toast.error('Failed to accept invitation', { description: message });
    },
  });
}
