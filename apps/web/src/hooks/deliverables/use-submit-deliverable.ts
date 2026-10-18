import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeliverableResponse } from '@ratify/shared';
import { ApiError, apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface SubmitDeliverableVariables {
  deliverableId: string;
  projectId: string;
}

async function submitDeliverable({
  deliverableId,
}: SubmitDeliverableVariables): Promise<DeliverableResponse> {
  return apiFetch<DeliverableResponse>(`/deliverables/${deliverableId}/submit`, {
    method: 'POST',
  });
}

export function useSubmitDeliverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitDeliverable,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables', variables.deliverableId] });
      queryClient.invalidateQueries({
        queryKey: ['projects', variables.projectId, 'deliverables'],
      });
      toast.success('Deliverable submitted for review');
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to submit deliverable. Please try again';
      toast.error('Failed to submit deliverable', { description: message });
    },
  });
}
