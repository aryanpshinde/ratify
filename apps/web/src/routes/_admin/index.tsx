import { createFileRoute } from '@tanstack/react-router';
import { useSession } from '@/lib/auth-client';

export const Route = createFileRoute('/_admin/')({
  component: DashboardHome,
});

function DashboardHome() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <h2 className="text-h1 text-foreground">Welcome, {session?.user.name}</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Your workspace is ready. Start managing your projects.
      </p>
    </div>
  );
}
