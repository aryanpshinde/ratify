import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router';
import { useSession } from '@/lib/auth-client';

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
});

function AuthLayout() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-body text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (session) {
    return <Navigate to="/" />;
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-display text-foreground">Ratify</h1>
        <p className="text-body text-muted-foreground">Client delivery portal</p>
      </div>
      <Outlet />
    </main>
  );
}
