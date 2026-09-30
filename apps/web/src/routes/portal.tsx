import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router';
import { useSession } from '@/lib/auth-client';
import { PortalShell } from '@/components/portal/portal-shell';

export const Route = createFileRoute('/portal')({
  component: PortalLayout,
});

function PortalLayout() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-body text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return (
    <PortalShell session={session}>
      <Outlet />
    </PortalShell>
  );
}
