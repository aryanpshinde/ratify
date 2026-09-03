import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api';
import type { CreateClientInput, ClientResponse } from '@ratify/shared';

async function createClient(data: CreateClientInput): Promise<ClientResponse> {
  return apiFetch<ClientResponse>('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 409 || error.status === 400)) return;
      const message =
        error instanceof ApiError ? error.message : 'Failed to create client. Please try again.';
      toast.error('Failed to create client', { description: message });
    },
  });
}
