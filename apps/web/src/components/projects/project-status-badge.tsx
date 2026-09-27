import type { ProjectStatus } from '@ratify/shared';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const STATUS_CONFIG: Record<ProjectStatus, { label: string; variant: BadgeVariant }> = {
  planning: { label: 'Planning', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'info' },
  review: { label: 'Review', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  archived: { label: 'Archived', variant: 'muted' },
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
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
