import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api';
import type { CreateClientInput } from '@ratify/shared';
import type { Client } from './use-clients';

async function createClient(data: CreateClientInput): Promise<Client> {
  return apiFetch<Client>('/clients', {
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
      const message =
        error instanceof ApiError ? error.message : 'Failed to create client. Please try again.';
      toast.error('Failed to create client', { description: message });
    },
  });
}
