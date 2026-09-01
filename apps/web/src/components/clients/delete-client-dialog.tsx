import type { Client } from '@/hooks/clients/use-clients';
import { useDeleteClient } from '@/hooks/clients/use-delete-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function DeleteClientDialog({ open, onOpenChange, client }: DeleteClientDialogProps) {
  const deleteClient = useDeleteClient();

  const handleDelete = () => {
    if (!client) return;
    deleteClient.mutate(client.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-h2">Delete Client</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {client?.name ? `"${client.name}"` : 'this client'}?
            This action cannot be undone and will also delete their projects.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteClient.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteClient.isPending}
          >
            {deleteClient.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
