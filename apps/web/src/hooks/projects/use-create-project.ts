import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api';
import type { CreateProjectInput, ProjectResponse } from '@ratify/shared';

async function createProject(data: CreateProjectInput): Promise<ProjectResponse> {
  return apiFetch<ProjectResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) return;
      const message =
        error instanceof ApiError ? error.message : 'Failed to create project. Please try again';
      toast.error('Failed to create project', { description: message });
    },
  });
}
