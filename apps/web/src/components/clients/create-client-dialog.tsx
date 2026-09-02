import { ApiError } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClientSchema, type CreateClientInput } from '@ratify/shared';
import { useCreateClient } from '@/hooks/clients/use-create-client';
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

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
    },
  });

  const onSubmit = (values: CreateClientInput) => {
    createClient.mutate(values, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          setError('email', { message: 'Email already exists for this owner' });
        }
      },
    });
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
          <DialogTitle className="text-h2">New Client</DialogTitle>
          <DialogDescription>
            Add a client contact. You'll be able to create projects and invite them to the delivery
            portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-name">Name</Label>
            <Input id="client-name" placeholder="Jane Doe" autoFocus {...register('name')} />
            {errors.name && <p className="text-caption text-error">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              type="email"
              placeholder="jane@example.com"
              {...register('email')}
            />
            {errors.email && <p className="text-caption text-error">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="client-company">
              Company <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input id="client-company" placeholder="Acme Inc." {...register('company')} />
            {errors.company && <p className="text-caption text-error">{errors.company.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? 'Creating...' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
