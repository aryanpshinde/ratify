import { ApiError } from '@/lib/api';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateClientSchema, type UpdateClientInput, type ClientResponse } from '@ratify/shared';
import { useUpdateClient } from '@/hooks/clients/use-update-client';
import { applyValidationIssues } from '@/lib/form-errors';
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
  client: ClientResponse | null;
}

export function UpdateClientDialog({ open, onOpenChange, client }: UpdateClientDialogProps) {
  const updateClient = useUpdateClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
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
    const payload: UpdateClientInput = {};
    if (values.name && values.name !== client.name) payload.name = values.name;
    if (values.email && values.email.toLowerCase() !== client.email.toLowerCase())
      payload.email = values.email;
    const curCompany = (values.company ?? '').trim();
    const origCompany = (client.company ?? '').trim();
    if (curCompany !== origCompany) payload.company = curCompany === '' ? null : curCompany;

    if (Object.keys(payload).length === 0) {
      reset();
      onOpenChange(false);
      return;
    }

    updateClient.mutate(
      { id: client.id, data: payload },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setError('email', { message: 'Email already exists' });
            return;
          }
          applyValidationIssues(error, setError);
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
