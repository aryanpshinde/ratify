import { useState } from 'react';
import { signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null | undefined;
    };
  };
}

export function DashboardLayout({ session }: DashboardLayoutProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card noise-overlay">
        <div className="flex h-14 items-center justify-between px-6">
          <h1 className="text-h2 text-foreground">Ratify</h1>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-caption text-muted-foreground">{session.user.email}</span>
            </div>
            <Button variant={'outline'} onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? 'Logging Out...' : 'Log Out'}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">
        <div className="flex flex-col items-center justify-center py-24">
          <h2 className="text-h1 text-foreground">Welcome, {session.user.name}</h2>
          <p className="mt-2 text-body text-muted-foreground">
            Your workspace is ready. Start managing your projects.
          </p>
        </div>
      </main>
    </div>
  );
}
