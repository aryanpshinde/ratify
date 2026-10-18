import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { usePortalDeliverable } from '@/hooks/portal/use-portal-deliverable';
import { usePortalDownloadVersion } from '@/hooks/portal/use-portal-version-download';
import { DeliverableStatusBadge } from '@/components/deliverables/deliverable-status-badge';
import { DeliverableVersionsList } from '@/components/deliverables/deliverable-versions-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeliverableVersionResponse } from '@ratify/shared';

export const Route = createFileRoute('/portal/projects/$projectId/deliverables/$deliverableId')({
  component: PortalDeliverableDetailPage,
});

function PortalDeliverableDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function PortalDeliverableDetailPage() {
  const { deliverableId, projectId } = Route.useParams();
  const navigate = useNavigate();
  const { data: deliverable, isPending, isError } = usePortalDeliverable(deliverableId);
  const downloadVersion = usePortalDownloadVersion();

  const handleDownload = (version: DeliverableVersionResponse) => {
    downloadVersion.mutate(version.id);
  };

  if (isPending) return <PortalDeliverableDetailSkeleton />;

  if (isError || !deliverable) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-body text-muted-foreground">Deliverable not available.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            navigate({ to: '/portal/projects/$projectId', params: { projectId: projectId } })
          }
        >
          Back to project
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/portal/projects/$projectId" params={{ projectId: projectId }}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Back to project">
                  <ArrowLeft />
                </Button>
              }
            />
            <TooltipContent>Back to project</TooltipContent>
          </Tooltip>
        </Link>
        <h2 className="text-h1 text-foreground">{deliverable.title}</h2>
        <DeliverableStatusBadge status={deliverable.status} />
      </div>

      {deliverable.description && (
        <Card className="noise-overlay">
          <CardHeader>
            <CardTitle className="text-h3">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body text-muted-foreground">{deliverable.description}</p>
          </CardContent>
        </Card>
      )}

      <Card className="noise-overlay">
        <CardHeader>
          <CardTitle className="text-h3">Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliverableVersionsList
            versions={deliverable.versions}
            isPending={isPending}
            onDownload={handleDownload}
          />
        </CardContent>
      </Card>
    </div>
  );
}
