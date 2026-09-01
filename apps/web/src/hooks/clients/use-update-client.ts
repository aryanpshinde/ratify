import type { UpdateClientInput } from '@ratify/shared';
import type { Client } from './use-clients';
import { ApiError, apiFetch } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

async function updateClient({
  id,
  data,
}: {
  id: string;
  data: UpdateClientInput;
}): Promise<Client> {
  return apiFetch<Client>(`/clients/${id}`, {
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
      const message =
        error instanceof ApiError ? error.message : 'Failed to update client. Please try again';
      toast.error('Failed to update client', {
        description: message,
      });
    },
  });
}
