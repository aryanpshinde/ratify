import type { UpdateProjectInput, ProjectResponse } from '@ratify/shared';
import { ApiError, apiFetch } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UpdateProjectVariables {
  id: string;
  data: UpdateProjectInput;
  successMessage?: string;
}

async function updateProject({ id, data }: UpdateProjectVariables): Promise<ProjectResponse> {
  return apiFetch<ProjectResponse>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(variables.successMessage ?? 'Project updated successfully');
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 409 || error.status === 400)) return;
      const message =
        error instanceof ApiError ? error.message : 'Failed to update project. Please try again';
      toast.error('Failed to update project', {
        description: message,
      });
    },
  });
}
