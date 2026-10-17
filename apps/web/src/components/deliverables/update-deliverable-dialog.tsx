import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateDeliverableSchema, type UpdateDeliverableInput } from '@ratify/shared';
import type { DeliverableResponse } from '@ratify/shared';
import { ApiError } from '@/lib/api';
import { applyValidationIssues } from '@/lib/form-errors';
import { useUpdateDeliverable } from '@/hooks/deliverables/use-update-deliverable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpdateDeliverableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverable: DeliverableResponse;
}

export function UpdateDeliverableDialog({
  open,
  onOpenChange,
  deliverable,
}: UpdateDeliverableDialogProps) {
  const updateDeliverable = useUpdateDeliverable();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateDeliverableInput>({
    resolver: zodResolver(updateDeliverableSchema),
    defaultValues: {
      title: deliverable.title,
      description: deliverable.description ?? '',
    },
  });

  const onSubmit = (values: UpdateDeliverableInput) => {
    updateDeliverable.mutate(
      { deliverableId: deliverable.id, projectId: deliverable.projectId, data: values },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 400) {
            applyValidationIssues(error, setError);
          }
        },
      },
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-h2">Edit Deliverable</DialogTitle>
          <DialogDescription>
            Update the title or description of this deliverable.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="update-deliverable-title">Title</Label>
            <Input id="update-deliverable-title" autoFocus {...register('title')} />
            {errors.title && <p className="text-caption text-error">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="update-deliverable-description">Description</Label>
            <Input id="update-deliverable-description" {...register('description')} />
            {errors.description && (
              <p className="text-caption text-error">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateDeliverable.isPending}>
              {updateDeliverable.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
