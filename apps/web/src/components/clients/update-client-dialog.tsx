import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateClientSchema, type UpdateClientInput } from '@ratify/shared';
import { useUpdateClient } from '@/hooks/clients/use-update-client';
import type { Client } from '@/hooks/clients/use-clients';
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

interface UpdateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function UpdateClientDialog({ open, onOpenChange, client }: UpdateClientDialogProps) {
  const updateClient = useUpdateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateClientInput>({
    resolver: zodResolver(updateClientSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
    },
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        email: client.email,
        company: client.company ?? '',
      });
    }
  }, [client, reset]);

  const onSubmit = (values: UpdateClientInput) => {
    if (!client) return;
    const { company, ...rest } = values;
    const payload: UpdateClientInput = company?.trim()
      ? { ...rest, company: company.trim() }
      : { ...rest, company: '' };
    updateClient.mutate(
      { id: client.id, data: payload },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
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
          <DialogTitle className="text-h2">Edit Client</DialogTitle>
          <DialogDescription>Update client details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-client-name">Name</Label>
            <Input id="edit-client-name" placeholder="Jane Doe" {...register('name')} />
            {errors.name && <p className="text-caption text-error">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-client-email">Email</Label>
            <Input
              id="edit-client-email"
              type="email"
              placeholder="jane@example.com"
              {...register('email')}
            />
            {errors.email && <p className="text-caption text-error">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-client-company">
              Company <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input id="edit-client-company" placeholder="Acme Inc." {...register('company')} />
            {errors.company && <p className="text-caption text-error">{errors.company.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateClient.isPending || !isDirty}>
              {updateClient.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
