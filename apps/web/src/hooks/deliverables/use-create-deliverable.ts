import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateDeliverableInput, DeliverableResponse } from '@ratify/shared';
import { ApiError, apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface CreateDeliverableVariables {
  projectId: string;
  data: CreateDeliverableInput;
}

async function createDeliverable({
  projectId,
  data,
}: CreateDeliverableVariables): Promise<DeliverableResponse> {
  return apiFetch<DeliverableResponse>(`/projects/${projectId}/deliverables`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function useCreateDeliverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeliverable,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'deliverables'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'activity'] });
      toast.success('Deliverable created');
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) return;
      const message =
        error instanceof ApiError ? error.message : 'Failed to create deliverable. Please try again';
      toast.error('Failed to create deliverable', { description: message });
    },
  });
}
