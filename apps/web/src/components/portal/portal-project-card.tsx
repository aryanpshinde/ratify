import { Banknote, Calendar } from 'lucide-react';
import type { PortalProjectListItem } from '@ratify/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { formatDeadline } from '@/lib/format';

interface PortalProjectCardProps {
  project: PortalProjectListItem;
}

export function PortalProjectCard({ project }: PortalProjectCardProps) {
  return (
    <Card className="noise-overlay">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-h3">{project.title}</CardTitle>
          <ProjectStatusBadge status={project.status} />
        </div>
        <p className="text-caption text-muted-foreground">
          {project.clientName}
          {project.clientCompany ? ` . ${project.clientCompany}` : ''}
        </p>
      </CardHeader>
      {(project.deadline || project.budgetDisplay) && (
        <CardContent>
          <div className=" flex flex-wrap items-center gap-4 text-caption text-muted-foreground">
            {project.deadline && (
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Calendar size={16} strokeWidth={1.5} aria-hidden="true" />
                Due {formatDeadline(project.deadline)}
              </span>
            )}
            {project.budgetDisplay && (
              <span className="inline-flex items-center gap-1.5 font-mono">
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
