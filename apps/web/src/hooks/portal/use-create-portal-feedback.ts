import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateFeedbackInput, CreatedFeedbackResponse } from '@ratify/shared';
import { apiFetch } from '@/lib/api';
import { invalidateDeliverableFeedback, showMutationError } from '@/lib/deliverable-mutations';
import { toast } from 'sonner';

interface CreatePortalFeedbackVariables {
  deliverableId: string;
  projectId: string;
  data: CreateFeedbackInput;
}

export function useCreatePortalFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deliverableId, data }: CreatePortalFeedbackVariables) =>
      apiFetch<CreatedFeedbackResponse>(`/portal/deliverables/${deliverableId}/feedback`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, variables) => {
      invalidateDeliverableFeedback(queryClient, variables);
      toast.success('Feedback posted');
    },
    onError: (error) =>
      showMutationError(
        error,
        'Failed to post feedback',
        'Failed to post feedback. Please try again',
      ),
  });
}
