import { ApiError } from '@/lib/api';
import { useCreateInvitation } from '@/hooks/projects/use-create-invitation';
import type { ProjectListItem } from '@ratify/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InviteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectListItem;
}

export function InviteClientDialog({ open, onOpenChange, project }: InviteClientDialogProps) {
  const createInvitation = useCreateInvitation();

  const handleConfirm = () => {
    createInvitation.mutate(
      { projectId: project.id, data: { email: project.clientEmail } },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          if (error instanceof ApiError && (error.status === 409 || error.status === 400)) {
            onOpenChange(false);
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-h2">Invite Client</DialogTitle>
          <DialogDescription>
            Send a portal access invite to{' '}
            <span className="font-medium text-foreground">{project.clientName}</span> at{' '}
            <span className="font-medium text-foreground">{project.clientEmail}</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={createInvitation.isPending}>
            {createInvitation.isPending ? 'Sending...' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
