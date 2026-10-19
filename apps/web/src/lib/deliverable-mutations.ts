import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { toast } from 'sonner';

interface DeliverableMutationScope {
  deliverableId: string;
  projectId: string;
}

export function invalidateDeliverableFeedback(
  queryClient: QueryClient,
  { deliverableId, projectId }: DeliverableMutationScope,
) {
  queryClient.invalidateQueries({
    queryKey: ['portal', 'deliverables', deliverableId, 'feedback'],
  });
  queryClient.invalidateQueries({ queryKey: ['deliverables', deliverableId, 'feedback'] });
  queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'activity'] });
}

export function invalidateDeliverableDecision(
  queryClient: QueryClient,
  scope: DeliverableMutationScope,
) {
  queryClient.invalidateQueries({ queryKey: ['portal', 'deliverables', scope.deliverableId] });
  queryClient.invalidateQueries({
    queryKey: ['portal', 'projects', scope.projectId, 'deliverables'],
  });
  queryClient.invalidateQueries({ queryKey: ['deliverables', scope.deliverableId] });
  queryClient.invalidateQueries({ queryKey: ['projects', scope.projectId, 'deliverables'] });
  invalidateDeliverableFeedback(queryClient, scope);
}

export function showMutationError(error: unknown, title: string, fallback: string) {
  if (error instanceof ApiError && (error.status === 400 || error.status === 404)) return;
  const message = error instanceof ApiError ? error.message : fallback;
  toast.error(title, { description: message });
}
