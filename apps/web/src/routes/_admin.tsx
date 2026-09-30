import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router';
import { useSession } from '@/lib/auth-client';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { useClients } from '@/hooks/clients/use-clients';
import { usePortalProjects } from '@/hooks/portal/use-portal-projects';

export const Route = createFileRoute('/_admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const { data: session, isPending } = useSession();
  const { data: clients, isPending: clientsPending } = useClients(!!session);
  const { data: portalProjects, isPending: portalPending } = usePortalProjects(!!session);

  if (isPending || clientsPending || portalPending) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-body text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  if (!clients?.length && portalProjects?.length) {
    return <Navigate to="/portal" />;
  }

  return (
    <DashboardLayout session={session}>
      <Outlet />
    </DashboardLayout>
  );
}
