import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface DeleteDeliverableVariables {
  deliverableId: string;
  projectId: string;
}

async function deleteDeliverable({ deliverableId }: DeleteDeliverableVariables): Promise<string> {
  return apiFetch<string>(`/deliverables/${deliverableId}`, {
    method: 'DELETE',
  });
}

export function useDeleteDeliverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeliverable,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['projects', variables.projectId, 'deliverables'],
      });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'activity'] });
      toast.success('Deliverable deleted');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 404) return;
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to delete deliverable. Please try again';
      toast.error('Failed to delete deliverable', { description: message });
    },
  });
}
