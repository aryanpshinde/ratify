import type { ProjectListItem } from '@ratify/shared';
import { Card } from '@/components/ui/card';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

interface RecentProjectsSectionProps {
  projects: ProjectListItem[];
}

export function RecentProjectsSection({ projects }: RecentProjectsSectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-h2 text-foreground">Recently Updated</h3>
      <Card className="noise-overlay">
        <div className="divide-y divide-border">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-body font-medium text-foreground">{project.title}</p>
                <p className="truncate text-caption text-muted-foreground">{project.clientName}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ProjectStatusBadge status={project.status} />
                <span className="text-caption text-muted-foreground">
                  {formatRelativeTime(project.updatedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
