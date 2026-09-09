import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { type ProjectListItem } from '@ratify/shared';

async function fetchProjects(): Promise<ProjectListItem[]> {
  return apiFetch<ProjectListItem[]>('/projects');
}

export function useProjects() {
  return useQuery({
    queryFn: fetchProjects,
    queryKey: ['projects'],
  });
}
