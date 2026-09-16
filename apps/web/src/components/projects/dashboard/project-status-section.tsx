import type { ProjectListItem, ProjectStatus } from '@ratify/shared';
import { ProjectCard } from '@/components/projects/project-card';

interface ProjectStatusSectionProps {
  group: {
    status: ProjectStatus;
    label: string;
    projects: ProjectListItem[];
  };
  onToggleArchive: (project: ProjectListItem) => void;
  onDelete: (project: ProjectListItem) => void;
}

export function ProjectStatusSection({
  group,
  onToggleArchive,
  onDelete,
}: ProjectStatusSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-h2 text-foreground">{group.label}</h3>
        <span className="text-caption text-muted-foreground">{group.projects.length}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {group.projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onToggleArchive={onToggleArchive}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
