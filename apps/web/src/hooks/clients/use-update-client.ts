import type { UpdateClientInput, ClientResponse } from '@ratify/shared';
import { ApiError, apiFetch } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

async function updateClient({
  id,
  data,
}: {
  id: string;
  data: UpdateClientInput;
}): Promise<ClientResponse> {
  return apiFetch<ClientResponse>(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 409 || error.status === 400)) return;
      const message =
        error instanceof ApiError ? error.message : 'Failed to update client. Please try again';
      toast.error('Failed to update client', {
        description: message,
      });
    },
  });
}
