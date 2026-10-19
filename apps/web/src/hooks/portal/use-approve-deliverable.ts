import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApproveDeliverableInput, DeliverableResponse } from '@ratify/shared';
import { apiFetch } from '@/lib/api';
import { invalidateDeliverableDecision, showMutationError } from '@/lib/deliverable-mutations';
import { toast } from 'sonner';

interface ApproveDeliverableVariables {
  deliverableId: string;
  projectId: string;
  data: ApproveDeliverableInput;
}

export function useApproveDeliverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deliverableId, data }: ApproveDeliverableVariables) =>
      apiFetch<DeliverableResponse>(`/portal/deliverables/${deliverableId}/approve`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, variables) => {
      invalidateDeliverableDecision(queryClient, variables);
      toast.success('Deliverable approved');
    },
    onError: (error) =>
      showMutationError(
        error,
        'Failed to approve deliverable',
        'Failed to approve. Please try again',
      ),
  });
}
