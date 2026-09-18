import type { ProjectListItem } from '@ratify/shared';
import { Card } from '@/components/ui/card';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { timeAgo } from '@/lib/format';

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
                  {timeAgo(project.updatedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
