import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { usePortalProjects } from '@/hooks/portal/use-portal-projects';
import { PortalProjectCard } from '@/components/portal/portal-project-card';
import { PortalProjectsEmptyState } from '@/components/portal/portal-projects-empty-state';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/portal/')({
  component: PortalHome,
});

function PortalHome() {
  const { data: projects, isPending, isError, error, isFetching, refetch } = usePortalProjects();

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load projects', {
        description: error?.message || 'Please try again later',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  return (
    <div className="space-y-8">
      <h2 className="text-h1 text-foreground">Your projects</h2>

      {isPending && <DashboardSkeleton />}

      {isError && !projects && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center shadow-sm noise-overlay">
          <p className="text-h2 text-foreground">Could not load your projects</p>
          <p className="mt-2 max-w-sm text-body text-muted-foreground">
            Something went wrong on our end. Please try again in a moment.
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'Retrying...' : 'Try again'}
          </Button>
        </div>
      )}

      {!isPending && !isError && projects?.length === 0 && <PortalProjectsEmptyState />}

      {!isPending && !isError && projects && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <PortalProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
