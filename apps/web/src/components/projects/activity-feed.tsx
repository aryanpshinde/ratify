import { History } from 'lucide-react';
import type { ProjectStatus } from '@ratify/shared';
import { useProjectActivity } from '@/hooks/projects/use-project-activity';
import { timeAgo } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectStatusBadge } from './project-status-badge';

const ACTION_LABELS: Record<string, string> = {
  project_created: 'created the project',
  project_status_changed: 'changed project status',
  client_invited: 'invited a client',
  deliverable_created: 'created a deliverable',
  version_uploaded: 'uploaded a new version',
  deliverable_submitted: 'submitted for review',
  feedback_created: 'left feedback',
  deliverable_approved: 'approved the deliverable',
  deliverable_rejected: 'rejected the deliverable',
};

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

function StatusChangeMetadata({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata) return null;
  const oldStatus = metadata['old_status'] as ProjectStatus | undefined;
  const newStatus = metadata['new_status'] as ProjectStatus | undefined;
  if (!oldStatus || !newStatus) return null;
  return (
    <span className="mt-1 inline-flex items-center gap-1.5">
      <ProjectStatusBadge status={oldStatus} />
      <span className="text-caption text-muted-foreground">→</span>
      <ProjectStatusBadge status={newStatus} />
    </span>
  );
}

function ActivityFeedSkeleton() {
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

function ActivityFeedEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <History size={32} strokeWidth={1.5} aria-hidden="true" className="text-muted-foreground" />
      <p className="mt-3 text-body text-muted-foreground">No activity yet</p>
    </div>
  );
}

interface ActivityFeedProps {
  projectId: string;
}

export function ActivityFeed({ projectId }: ActivityFeedProps) {
  const { data: activities, isPending, isError } = useProjectActivity(projectId);

  if (isPending) return <ActivityFeedSkeleton />;
  if (isError) return <p className="text-body text-error">Failed to load activity.</p>;
  if (!activities || activities.length === 0) return <ActivityFeedEmpty />;

  return (
    <div className="space-y-0">
      {activities.map((item, index) => (
        <div key={item.id} className="relative flex gap-3 pb-5">
          {index < activities.length - 1 && (
            <span
              className="absolute top-3 left-[3.5px] h-full w-px bg-border"
              aria-hidden="true"
            />
          )}
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-body text-foreground">
              <span className="font-medium">{item.actorName ?? 'Someone'}</span>{' '}
              <span className="text-muted-foreground">{getActionLabel(item.action)}</span>
            </p>
            {item.action === 'project_status_changed' && (
              <StatusChangeMetadata metadata={item.metadata} />
            )}
            <p className="mt-0.5 text-caption text-muted-foreground">{timeAgo(item.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
