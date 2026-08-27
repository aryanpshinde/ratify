import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router';
import { useSession } from '@/lib/auth-client';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export const Route = createFileRoute('/_admin')({
  component: AdminLayout,
});

function AdminLayout() {
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
    <DashboardLayout session={session}>
      <Outlet />
    </DashboardLayout>
  );
}
