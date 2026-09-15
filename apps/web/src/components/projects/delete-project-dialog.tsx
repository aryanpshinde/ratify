import type { ProjectListItem } from '@ratify/shared';
import { useDeleteProject } from '@/hooks/projects/use-delete-project';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectListItem | null;
}

export function DeleteProjectDialog({ open, onOpenChange, project }: DeleteProjectDialogProps) {
  const deleteProject = useDeleteProject();

  const handleDelete = () => {
    if (!project) return;
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-h2">Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {project?.title ? `"${project.title}"` : 'this project'}
            ? This action cannot be undone and will permanently remove all deliverables, feedback,
            and activity history.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteProject.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProject.isPending}
          >
            {deleteProject.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
