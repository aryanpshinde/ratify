import type { ProjectStatus } from '@ratify/shared';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  planning: {
    label: 'Planning',
    className: 'bg-info-subtle text-info border-info/20',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-info-subtle text-info border-info/20',
  },
  review: {
    label: 'Review',
    className: 'bg-warning-subtle text-warning border-warning/20',
  },
  completed: {
    label: 'Completed',
    className: 'bg-success-subtle text-success border-success/20',
  },
  archived: {
    label: 'Archived',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-micro whitespace-nowrap',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
