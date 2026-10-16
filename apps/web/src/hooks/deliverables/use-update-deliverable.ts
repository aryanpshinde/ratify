import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeliverableResponse, UpdateDeliverableInput } from '@ratify/shared';
import { ApiError, apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface UpdateDeliverableVariables {
  deliverableId: string;
  projectId: string;
  data: UpdateDeliverableInput;
}

async function updateDeliverable({
  deliverableId,
  data,
}: UpdateDeliverableVariables): Promise<DeliverableResponse> {
  return apiFetch<DeliverableResponse>(`/deliverables/${deliverableId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function useUpdateDeliverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDeliverable,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables', variables.deliverableId] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'deliverables'] });
      toast.success('Deliverable updated');
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) return;
      const message =
        error instanceof ApiError ? error.message : 'Failed to update deliverable. Please try again';
      toast.error('Failed to update deliverable', { description: message });
    },
  });
}
