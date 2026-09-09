import { FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectsEmptyStateProps {
  onCreateClick: () => void;
}

export function ProjectsEmptyState({ onCreateClick }: ProjectsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <FolderKanban
        size={64}
        strokeWidth={1}
        aria-hidden="true"
        className="text-muted-foreground"
      />
      <h3 className="mt-6 text-h2 text-foreground">No projects yet</h3>
      <p className="mt-2 max-w-sm text-body text-muted-foreground">
        Create your first project to start tracking deliverables, deadlines, and client feedback in
        one place.
      </p>
      <Button className="mt-6" onClick={onCreateClick}>
        Create First Project
      </Button>
    </div>
  );
}
