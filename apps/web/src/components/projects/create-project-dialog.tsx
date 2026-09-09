import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { createProjectSchema, type CreateProjectInput } from '@ratify/shared';
import { ApiError } from '@/lib/api';
import { applyValidationIssues } from '@/lib/form-errors';
import { useCreateProject } from '@/hooks/projects/use-create-project';
import { useClients } from '@/hooks/clients/use-clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const createProject = useCreateProject();
  const { data: clients, isPending: clientsPending } = useClients();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      clientId: '',
      deadline: '',
      budgetDisplay: '',
    },
  });

  const clientId = useWatch({ control, name: 'clientId' });
  const hasClients = (clients?.length ?? 0) > 0;

  const clientOptions = (clients ?? []).map((client) => ({
    value: client.id,
    label: client.company ? `${client.name} · ${client.company}` : client.name,
  }));

  const onSubmit = (values: CreateProjectInput) => {
    createProject.mutate(values, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 404) {
          setError('clientId', { message: 'Client not found. It may have been deleted.' });
          return;
        }
        applyValidationIssues(error, setError);
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
          <DialogTitle className="text-h2">New Project</DialogTitle>
          <DialogDescription>
            Create a project for one of your clients. You can invite them to review deliverables
            later.
          </DialogDescription>
        </DialogHeader>

        {clientsPending ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : hasClients ? (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-title">Title</Label>
              <Input
                id="project-title"
                placeholder="Website Redesign"
                autoFocus
                {...register('title')}
              />
              {errors.title && <p className="text-caption text-error">{errors.title.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="project-client">Client</Label>
              <Select
                value={clientId || null}
                items={clientOptions}
                onValueChange={(value) => {
                  if (value === null) return;
                  setValue('clientId', value, { shouldValidate: true });
                }}
              >
                <SelectTrigger
                  id="project-client"
                  className="w-full"
                  aria-invalid={!!errors.clientId}
                >
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-caption text-error">{errors.clientId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="project-description">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="project-description"
                placeholder="Full rebrand and marketing site"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-caption text-error">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="project-deadline">
                  Deadline <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="project-deadline"
                  type="date"
                  {...register('deadline', {
                    setValueAs: (value: string) => (value === '' ? undefined : value),
                  })}
                />
                {errors.deadline && (
                  <p className="text-caption text-error">{errors.deadline.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="project-budget">
                  Budget <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input id="project-budget" placeholder="$5,000" {...register('budgetDisplay')} />
                {errors.budgetDisplay && (
                  <p className="text-caption text-error">{errors.budgetDisplay.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-body text-muted-foreground">
              You need at least one client before you can create a project.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleOpenChange(false);
                  navigate({ to: '/clients' });
                }}
              >
                Add a Client
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
