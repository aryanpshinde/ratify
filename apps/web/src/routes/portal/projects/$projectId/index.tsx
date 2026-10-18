import { useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Banknote, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { usePortalProject } from '@/hooks/portal/use-portal-project';
import { usePortalDeliverables } from '@/hooks/portal/use-portal-deliverables';
import { PortalDeliverableCard } from '@/components/portal/portal-deliverable-card';
import { PortalDeliverablesEmptyState } from '@/components/portal/portal-deliverables-empty-state';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDeadline } from '@/lib/format';

export const Route = createFileRoute('/portal/projects/$projectId/')({
  component: PortalProjectPage,
});

function PortalProjectPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const {
    data: project,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = usePortalProject(projectId);
  const {
    data: deliverables,
    isPending: deliverablesPending,
    isError: deliverablesError,
    error: deliverablesErrorDetails,
    isFetching: deliverablesFetching,
    refetch: refetchDeliverables,
  } = usePortalDeliverables(projectId);

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load project', {
        description: error?.message || 'Please try again later',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  useEffect(() => {
    if (deliverablesError) {
      toast.error('Failed to load deliverables', {
        description: deliverablesErrorDetails?.message || 'Please try again later',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverablesError]);

  if (isPending) return <DashboardSkeleton />;

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-body text-muted-foreground">
          This project is not available in your portal.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/portal' })}>
            Back to projects
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Retrying...' : 'Try again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link to="/portal">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Back to projects">
                  <ArrowLeft />
                </Button>
              }
            />
            <TooltipContent>Back to projects</TooltipContent>
          </Tooltip>
        </Link>
        <h2 className="text-h1 text-foreground">{project.title}</h2>
        <ProjectStatusBadge status={project.status} />
      </div>

      {(project.deadline || project.budgetDisplay) && (
        <div className="flex flex-wrap items-center gap-4 text-caption text-muted-foreground">
          {project.deadline && (
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Calendar size={16} strokeWidth={1.5} aria-hidden="true" />
              Due {formatDeadline(project.deadline)}
            </span>
          )}
          {project.budgetDisplay && (
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Banknote size={16} strokeWidth={1.5} aria-hidden="true" />
              {project.budgetDisplay}
            </span>
          )}
        </div>
      )}

      {project.description && (
        <p className="max-w-2xl text-body text-muted-foreground">{project.description}</p>
      )}

      <section className="space-y-4">
        <h3 className="text-h2 text-foreground">Deliverables</h3>
        {deliverablesPending && <DashboardSkeleton />}
        {deliverablesError && !deliverablesPending && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center shadow-sm noise-overlay">
            <p className="text-body text-muted-foreground">Could not load deliverables</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => refetchDeliverables()}
              disabled={deliverablesFetching}
            >
              {deliverablesFetching ? 'Retrying...' : 'Try again'}
            </Button>
          </div>
        )}
        {!deliverablesPending && !deliverablesError && deliverables?.length === 0 && (
          <PortalDeliverablesEmptyState />
        )}
        {!deliverablesPending && !deliverablesError && deliverables && deliverables.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deliverables.map((deliverable) => (
              <PortalDeliverableCard key={deliverable.id} deliverable={deliverable} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
