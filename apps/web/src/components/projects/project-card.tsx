import { Archive, Banknote, Calendar, EllipsisVertical, Trash2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ProjectListItem } from '@ratify/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectStatusBadge } from './project-status-badge';
import { formatDeadline } from '@/lib/format';

interface ProjectCardProps {
  project: ProjectListItem;
  onToggleArchive?: (project: ProjectListItem) => void;
  onDelete?: (project: ProjectListItem) => void;
}

export function ProjectCard({ project, onToggleArchive, onDelete }: ProjectCardProps) {
  const isArchived = project.status === 'archived';

  return (
    <Card className="noise-overlay transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-h3">
            <Link
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="transition-colors hover:text-accent"
            >
              {project.title}
            </Link>
          </CardTitle>
          <div className="flex shrink-0 items-center gap-1.5">
            <ProjectStatusBadge status={project.status} />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${project.title}`}
                  />
                }
              >
                <EllipsisVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem onClick={() => onToggleArchive?.(project)}>
                  <Archive />
                  {isArchived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(project)}>
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
