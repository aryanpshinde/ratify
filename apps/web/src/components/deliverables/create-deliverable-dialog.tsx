import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDeliverableSchema, type CreateDeliverableInput } from '@ratify/shared';
import { ApiError } from '@/lib/api';
import { applyValidationIssues } from '@/lib/form-errors';
import { useCreateDeliverable } from '@/hooks/deliverables/use-create-deliverable';
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

interface CreateDeliverableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

export function CreateDeliverableDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle,
}: CreateDeliverableDialogProps) {
  const createDeliverable = useCreateDeliverable();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateDeliverableInput>({
    resolver: zodResolver(createDeliverableSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = (values: CreateDeliverableInput) => {
    createDeliverable.mutate(
      { projectId, data: values },
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
          <DialogTitle className="text-h2">New Deliverable</DialogTitle>
          <DialogDescription>
            Create a deliverable for{' '}
            <span className="font-medium text-foreground">{projectTitle}</span>. It starts as a
            draft that clients cannot see yet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="deliverable-title">Title</Label>
            <Input
              id="deliverable-title"
              placeholder="Homepage Hero"
              autoFocus
              {...register('title')}
            />
            {errors.title && <p className="text-caption text-error">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="deliverable-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="deliverable-description"
              placeholder="Hero design export and notes"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-caption text-error">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDeliverable.isPending}>
              {createDeliverable.isPending ? 'Creating...' : 'Create Deliverable'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
