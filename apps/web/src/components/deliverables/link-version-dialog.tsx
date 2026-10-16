import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLinkVersionSchema, type CreateLinkVersionInput } from '@ratify/shared';
import { ApiError } from '@/lib/api';
import { applyValidationIssues } from '@/lib/form-errors';
import { useCreateLinkVersion } from '@/hooks/deliverables/use-create-link-version';
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

interface LinkVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverableId: string;
  projectId: string;
  deliverableTitle: string;
  nextVersionNumber: number;
}

export function LinkVersionDialog({
  open,
  onOpenChange,
  deliverableId,
  projectId,
  deliverableTitle,
  nextVersionNumber,
}: LinkVersionDialogProps) {
  const createLinkVersion = useCreateLinkVersion();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateLinkVersionInput>({
    resolver: zodResolver(createLinkVersionSchema),
    defaultValues: {
      externalUrl: '',
    },
  });

  const onSubmit = (values: CreateLinkVersionInput) => {
    createLinkVersion.mutate(
      { deliverableId, projectId, data: values },
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
          <DialogTitle className="text-h2">Add Link Version</DialogTitle>
          <DialogDescription>
            Add an external link to{' '}
            <span className="font-medium text-foreground">{deliverableTitle}</span>. It becomes{' '}
            <span className="font-mono tabular-nums">v{nextVersionNumber}</span>; previous versions
            are preserved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="link-version-url">External URL</Label>
            <Input
              id="link-version-url"
              placeholder="https://figma.com/file/..."
              inputMode="url"
              autoFocus
              className="font-mono"
              {...register('externalUrl')}
            />
            {errors.externalUrl && (
              <p className="text-caption text-error">{errors.externalUrl.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLinkVersion.isPending}>
              {createLinkVersion.isPending ? 'Adding...' : 'Add Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
