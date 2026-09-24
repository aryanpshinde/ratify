import { ApiError, apiFetch } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

async function deleteProject(id: string): Promise<string> {
  return apiFetch<string>(`/projects/${id}`, {
    method: 'DELETE',
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Failed to delete project. Please try again';
      toast.error('Failed to delete project', {
        description: message,
      });
    },
  });
}
