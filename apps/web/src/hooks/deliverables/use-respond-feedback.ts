import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateFeedbackInput, CreatedFeedbackResponse } from '@ratify/shared';
import { apiFetch } from '@/lib/api';
import { invalidateDeliverableFeedback, showMutationError } from '@/lib/deliverable-mutations';
import { toast } from 'sonner';

interface RespondFeedbackVariables {
  deliverableId: string;
  projectId: string;
  data: CreateFeedbackInput;
}

export function useRespondToFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deliverableId, data }: RespondFeedbackVariables) =>
      apiFetch<CreatedFeedbackResponse>(`/deliverables/${deliverableId}/feedback`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, variables) => {
      invalidateDeliverableFeedback(queryClient, variables);
      toast.success('Response posted');
    },
    onError: (error) =>
      showMutationError(error, 'Failed to post response', 'Failed to respond. Please try again'),
  });
}
