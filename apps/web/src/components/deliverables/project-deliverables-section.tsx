import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import type { DeliverableListItem } from '@ratify/shared';
import { formatDate } from '@/lib/format';
import { useProjectDeliverables } from '@/hooks/deliverables/use-project-deliverables';
import { DeliverableStatusBadge } from '@/components/deliverables/deliverable-status-badge';
import { CreateDeliverableDialog } from '@/components/deliverables/create-deliverable-dialog';
import { LinkVersionDialog } from '@/components/deliverables/link-version-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function DeliverablesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm"
        >
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

interface ProjectDeliverablesSectionProps {
  projectId: string;
  projectTitle: string;
}

export function ProjectDeliverablesSection({
  projectId,
  projectTitle,
}: ProjectDeliverablesSectionProps) {
  const { data: deliverables, isPending, isError } = useProjectDeliverables(projectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<DeliverableListItem | null>(null);

  return (
    <Card className="noise-overlay">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-h3">Deliverables</CardTitle>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            New Deliverable
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <DeliverablesSkeleton />
        ) : isError ? (
          <p className="text-body text-error">Failed to load deliverables.</p>
        ) : !deliverables || deliverables.length === 0 ? (
          <p className="text-body text-muted-foreground">
            No deliverables yet. Click "New Deliverable" to create your first one.
          </p>
        ) : (
          <div className="space-y-3">
            {deliverables.map((deliverable) => (
              <div
                key={deliverable.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:bg-muted/50"
              >
                <Link
                  to="/admin/projects/$projectId/deliverables/$deliverableId"
                  params={{ projectId, deliverableId: deliverable.id }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-body font-medium text-foreground">
                    {deliverable.title}
                  </p>
                  <p className="text-caption text-muted-foreground tabular-nums">
                    {deliverable.latestVersion
                      ? `v${deliverable.latestVersion.versionNumber} · `
                      : ''}
                    {deliverable.versionCount === 1
                      ? '1 version'
                      : `${deliverable.versionCount} versions`}
                    {' · '}
                    Updated {formatDate(deliverable.updatedAt)}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <DeliverableStatusBadge status={deliverable.status} />
                  {deliverable.status !== 'approved' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLinkTarget(deliverable)}
                    >
                      Add Link
                    </Button>
                  )}
                  <Link
                    to="/admin/projects/$projectId/deliverables/$deliverableId"
                    params={{ projectId, deliverableId: deliverable.id }}
                    aria-label={`Open ${deliverable.title}`}
                  >
                    <Button variant="ghost" size="icon-sm" aria-hidden="true" tabIndex={-1}>
                      <ChevronRight />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CreateDeliverableDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        projectTitle={projectTitle}
      />
      <LinkVersionDialog
        open={linkTarget !== null}
        onOpenChange={(open) => {
          if (!open) setLinkTarget(null);
        }}
        deliverableId={linkTarget?.id ?? ''}
        projectId={projectId}
        deliverableTitle={linkTarget?.title ?? ''}
        nextVersionNumber={(linkTarget?.latestVersion?.versionNumber ?? 0) + 1}
      />
    </Card>
  );
}
