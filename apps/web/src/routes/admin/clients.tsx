import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useClients } from '@/hooks/clients/use-clients';
import type { ClientResponse } from '@ratify/shared';
import { ClientsEmptyState } from '@/components/clients/clients-empty-state';
import { CreateClientDialog } from '@/components/clients/create-client-dialog';
import { UpdateClientDialog } from '@/components/clients/update-client-dialog';
import { DeleteClientDialog } from '@/components/clients/delete-client-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/admin/clients')({
  component: ClientsPage,
});

function ClientsListSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <table className="w-full text-body-sm">
        <tbody className="divide-y divide-border-subtle">
          {[1, 2, 3].map((i) => (
            <tr key={i}>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-1.5 h-4 w-32" />
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-8 w-24" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClientsPage() {
  const { data: clients, isPending, isError, error } = useClients();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientResponse | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientResponse | null>(null);

  const isEmpty = !isPending && !isError && clients?.length === 0;

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load clients', {
        description: error?.message || 'Please try again later.',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h1 text-foreground">Clients</h2>
        <Button variant={isEmpty ? 'outline' : 'default'} onClick={() => setCreateOpen(true)}>
          New Client
        </Button>
      </div>

      {isPending && <ClientsListSkeleton />}

      {!isPending && !isError && clients?.length === 0 && (
        <ClientsEmptyState onCreateClick={() => setCreateOpen(true)} />
      )}

      {!isPending && !isError && clients && clients.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm noise-overlay">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="bg-surface-raised text-left">
                <th
                  scope="col"
                  className="px-4 py-2.5 font-medium text-caption text-muted-foreground"
                >
                  Client
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-2.5 font-medium text-caption text-muted-foreground sm:table-cell"
                >
                  Contact
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-2.5 font-medium text-caption text-muted-foreground md:table-cell"
                >
                  Company
                </th>
                <th scope="col" className="px-4 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {clients.map((client) => (
                <tr key={client.id} className="transition-colors hover:bg-surface-raised">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {client.name}
                    <span className="mt-0.5 block font-mono text-caption font-normal text-muted-foreground sm:hidden">
                      {client.email}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-muted-foreground sm:table-cell">
                    {client.email}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {client.company || <span className="text-muted-foreground/60">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => setEditingClient(client)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeletingClient(client)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UpdateClientDialog
        open={!!editingClient}
        onOpenChange={(o) => !o && setEditingClient(null)}
        client={editingClient}
      />
      <DeleteClientDialog
        open={!!deletingClient}
        onOpenChange={(o) => !o && setDeletingClient(null)}
        client={deletingClient}
      />
      <CreateClientDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
