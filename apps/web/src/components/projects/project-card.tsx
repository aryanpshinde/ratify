import { Calendar, Banknote } from 'lucide-react';
import type { ProjectListItem } from '@ratify/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectStatusBadge } from './project-status-badge';

function formatDeadline(deadline: string) {
  return new Date(`${deadline}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Card className="noise-overlay transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-h3">{project.title}</CardTitle>
          <ProjectStatusBadge status={project.status} />
        </div>
        <p className="text-caption text-muted-foreground">
          {project.clientName}
          {project.clientCompany ? ` · ${project.clientCompany}` : ''}
        </p>
      </CardHeader>
      {(project.deadline || project.budgetDisplay) && (
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-caption text-muted-foreground">
            {project.deadline && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={16} strokeWidth={1.5} aria-hidden="true" />
                Due {formatDeadline(project.deadline)}
              </span>
            )}
            {project.budgetDisplay && (
              <span className="inline-flex items-center gap-1.5">
                <Banknote size={16} strokeWidth={1.5} aria-hidden="true" />
                {project.budgetDisplay}
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
