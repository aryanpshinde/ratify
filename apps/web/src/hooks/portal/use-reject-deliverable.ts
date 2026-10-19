import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeliverableResponse, RejectDeliverableInput } from '@ratify/shared';
import { apiFetch } from '@/lib/api';
import { invalidateDeliverableDecision, showMutationError } from '@/lib/deliverable-mutations';
import { toast } from 'sonner';

interface RejectDeliverableVariables {
  deliverableId: string;
  projectId: string;
  data: RejectDeliverableInput;
}

export function useRejectDeliverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deliverableId, data }: RejectDeliverableVariables) =>
      apiFetch<DeliverableResponse>(`/portal/deliverables/${deliverableId}/reject`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, variables) => {
      invalidateDeliverableDecision(queryClient, variables);
      toast.success('Deliverable rejected');
    },
    onError: (error) =>
      showMutationError(
        error,
        'Failed to reject deliverable',
        'Failed to reject. Please try again',
      ),
  });
}
