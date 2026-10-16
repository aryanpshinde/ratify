import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateLinkVersionInput, DeliverableVersionResponse } from '@ratify/shared';
import { ApiError, apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface CreateLinkVersionVariables {
  deliverableId: string;
  projectId: string;
  data: CreateLinkVersionInput;
}

async function createLinkVersion({
  deliverableId,
  data,
}: CreateLinkVersionVariables): Promise<DeliverableVersionResponse> {
  return apiFetch<DeliverableVersionResponse>(`/deliverables/${deliverableId}/versions/link`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function useCreateLinkVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLinkVersion,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables', variables.deliverableId] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'deliverables'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'activity'] });
      toast.success('Link version created');
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) return;
      const message =
        error instanceof ApiError ? error.message : 'Failed to add link version. Please try again';
      toast.error('Failed to add link version', { description: message });
    },
  });
}
