import { ApiError, apiFetch } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

async function deleteClient(id: string): Promise<string> {
  return apiFetch<string>(`/clients/${id}`, {
    method: 'DELETE',
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Deleted client successfully');
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Failed to delete client. Please try again';
      toast.error('Failed to delete client', {
        description: message,
      });
    },
  });
}
