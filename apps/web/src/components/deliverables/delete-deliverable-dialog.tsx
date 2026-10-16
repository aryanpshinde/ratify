import type { DeliverableResponse } from '@ratify/shared';
import { useDeleteDeliverable } from '@/hooks/deliverables/use-delete-deliverable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteDeliverableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverable: DeliverableResponse | null;
  onDeleted?: () => void;
}

export function DeleteDeliverableDialog({
  open,
  onOpenChange,
  deliverable,
  onDeleted,
}: DeleteDeliverableDialogProps) {
  const deleteDeliverable = useDeleteDeliverable();

  const handleDelete = () => {
    if (!deliverable) return;
    deleteDeliverable.mutate(
      { deliverableId: deliverable.id, projectId: deliverable.projectId },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDeleted?.();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-h2">Delete Deliverable</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            {deliverable?.title ? `"${deliverable.title}"` : 'this deliverable'}? This action cannot
            be undone and will also delete its full version history.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteDeliverable.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteDeliverable.isPending}
          >
            {deleteDeliverable.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
