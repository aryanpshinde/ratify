import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeliverableVersionResponse } from '@ratify/shared';
import { ApiError, apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface CreateFileVersionVariables {
  deliverableId: string;
  projectId: string;
  file: File;
}

async function createFileVersion({
  deliverableId,
  file,
}: CreateFileVersionVariables): Promise<DeliverableVersionResponse> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<DeliverableVersionResponse>(`/deliverables/${deliverableId}/versions/file`, {
    method: 'POST',
    body: form,
  });
}

export function useCreateFileVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFileVersion,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables', variables.deliverableId] });
      queryClient.invalidateQueries({
        queryKey: ['projects', variables.projectId, 'deliverables'],
      });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'activity'] });
      toast.success('File version created');
    },
    onError: (error) => {
      if (
        error instanceof ApiError &&
        (error.status === 400 || error.status === 404 || error.status === 403)
      )
        return;
      const message =
        error instanceof ApiError ? error.message : 'Failed to upload file. Please try again';
      toast.error('Failed to upload file', { description: message });
    },
  });
}
