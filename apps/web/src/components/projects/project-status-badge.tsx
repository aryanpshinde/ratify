import type { ProjectStatus } from '@ratify/shared';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  planning: {
    label: 'Planning',
    className: 'bg-info-subtle text-info/85 border-info/10',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-info-subtle text-info/85 border-info/10',
  },
  review: {
    label: 'Review',
    className: 'bg-warning-subtle text-warning/85 border-warning/10',
  },
  completed: {
    label: 'Completed',
    className: 'bg-success-subtle text-success/85 border-success/10',
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
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-micro whitespace-nowrap',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
