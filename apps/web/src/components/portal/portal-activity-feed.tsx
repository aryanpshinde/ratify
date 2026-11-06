import { History } from 'lucide-react';
import type { ActivityLogResponse, ProjectStatus } from '@ratify/shared';
import { usePortalProjectActivity } from '@/hooks/portal/use-portal-project-activity';
import { timeAgo } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { BoundedFeed } from '@/components/paginated/bounded-feed';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';

const ACTION_LABELS: Record<string, string> = {
  project_status_changed: 'updated the project status',
  deliverable_created: 'added a deliverable',
  version_uploaded: 'uploaded a new version',
  deliverable_submitted: 'sent a deliverable for your review',
  feedback_created: 'left feedback',
};

function getActionLabel(action: string, metadata: Record<string, unknown> | null): string {
  const versionNumber = metadata?.['version_number'];
  if (action === 'version_uploaded' && typeof versionNumber === 'number') {
    return `uploaded version ${versionNumber}`;
  }
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

function getActorName(item: Pick<ActivityLogResponse, 'actorId' | 'actorName' | 'metadata'>) {
  if (item.metadata?.['author_role'] === 'client') return 'You';
  return item.actorName ?? 'Someone';
}

function StatusChangeMetadata({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata) return null;
  const oldStatus = metadata['old_status'] as ProjectStatus | undefined;
  const newStatus = metadata['new_status'] as ProjectStatus | undefined;
  if (!oldStatus || !newStatus) return null;
  return (
    <span className="mt-1 inline-flex flex-wrap items-center gap-1.5">
      <ProjectStatusBadge status={oldStatus} />
      <span className="text-caption text-muted-foreground">→</span>
      <ProjectStatusBadge status={newStatus} />
    </span>
  );
}

function PortalActivityFeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="mt-1 h-2 w-2 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PortalActivityFeedEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <History size={32} strokeWidth={1.5} aria-hidden="true" className="text-muted-foreground" />
      <p className="mt-3 text-body font-medium text-foreground">No updates yet</p>
      <p className="mt-1 max-w-xs text-caption text-muted-foreground">
        Updates will appear here as the team works on this project.
      </p>
    </div>
  );
}

interface PortalActivityFeedProps {
  projectId: string;
}

export function PortalActivityFeed({ projectId }: PortalActivityFeedProps) {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    usePortalProjectActivity(projectId);

  if (isPending) return <PortalActivityFeedSkeleton />;
  if (isError) return <p className="text-body text-error">Failed to load updates.</p>;

  const activities = data?.pages.flatMap((page) => page.items) ?? [];
  if (activities.length === 0) return <PortalActivityFeedEmpty />;

  return (
    <BoundedFeed
      label="Project updates timeline"
      loadMoreLabel="Load older updates"
      endLabel="End of updates"
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    >
      {activities.map((item, index) => (
        <div key={item.id} className="relative flex gap-3 pb-5">
          {(index < activities.length - 1 || hasNextPage) && (
            <span
              className="absolute top-3 left-[3.5px] h-full w-px bg-border"
              aria-hidden="true"
            />
          )}
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-body text-foreground">
              <span className="font-medium">{getActorName(item)}</span>{' '}
              <span className="text-muted-foreground">
                {getActionLabel(item.action, item.metadata)}
              </span>
            </p>
            {item.action === 'project_status_changed' && (
              <StatusChangeMetadata metadata={item.metadata} />
            )}
            <p className="mt-0.5 font-mono text-caption text-muted-foreground tabular-nums">
              {timeAgo(item.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </BoundedFeed>
  );
}
