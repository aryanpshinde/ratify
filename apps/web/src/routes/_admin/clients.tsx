import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useClients } from '@/hooks/use-clients';
import { ClientsEmptyState } from '@/components/clients/clients-empty-state';
import { CreateClientDialog } from '@/components/clients/create-client-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_admin/clients')({
  component: ClientsPage,
});

function ClientsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
        >
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

function ClientsPage() {
  const { data: clients, isPending, isError, error } = useClients();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load clients', {
        description: error?.message || 'Please try again later.',
      });
    }
  }, [isError, error]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h1 text-foreground">Clients</h2>
        <Button onClick={() => setCreateOpen(true)}>New Client</Button>
      </div>

      {isPending && <ClientsListSkeleton />}

      {!isPending && !isError && clients?.length === 0 && (
        <ClientsEmptyState onCreateClick={() => setCreateOpen(true)} />
      )}

      {!isPending && !isError && clients && clients.length > 0 && (
        <div className="space-y-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="text-body font-medium text-foreground">{client.name}</p>
                <p className="text-caption text-muted-foreground">
                  {client.company || client.email || 'No company or email'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateClientDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
