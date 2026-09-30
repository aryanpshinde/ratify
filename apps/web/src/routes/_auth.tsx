import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router';
import { useSession } from '@/lib/auth-client';
import { usePortalProjects } from '@/hooks/portal/use-portal-projects';

function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/') || value.startsWith('//')) return undefined;
  return value;
}

export const Route = createFileRoute('/_auth')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = safeRedirect(search.redirect);
    return redirect ? { redirect } : {};
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { redirect } = Route.useSearch();
  const { data: session, isPending } = useSession();
  const { data: portalProjects, isPending: portalPending, isError: portalError } =
    usePortalProjects(!!session);

  if (isPending || (session && portalPending)) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-body text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (session) {
    if (redirect) {
      return <Navigate to={redirect} />;
    }
    if (portalError) {
      return <Navigate to="/portal" />;
    }
    const hasPortalAccess = !!portalProjects && portalProjects.length > 0;
    return <Navigate to={hasPortalAccess ? '/portal' : '/'} />;
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-10 p-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-display text-foreground">Ratify</h1>
        <p className="text-body text-muted-foreground">Client delivery portal</p>
      </div>
      <Outlet />
    </main>
  );
}
