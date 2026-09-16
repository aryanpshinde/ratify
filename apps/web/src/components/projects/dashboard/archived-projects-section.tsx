import type { ProjectListItem } from '@ratify/shared';
import { ProjectCard } from '@/components/projects/project-card';

interface ArchivedProjectsSectionProps {
  projects: ProjectListItem[];
  onToggleArchive: (project: ProjectListItem) => void;
  onDelete: (project: ProjectListItem) => void;
}

export function ArchivedProjectsSection({
  projects,
  onToggleArchive,
  onDelete,
}: ArchivedProjectsSectionProps) {
  return (
    <details>
      <summary className="cursor-pointer text-body-sm text-muted-foreground transition-colors hover:text-foreground">
        Archived ({projects.length})
      </summary>
      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onToggleArchive={onToggleArchive}
            onDelete={onDelete}
          />
        ))}
      </div>
    </details>
  );
}
