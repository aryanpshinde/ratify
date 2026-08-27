import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
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
  children: ReactNode;
}

const navLinkClasses =
  'rounded-lg px-2.5 py-1 text-body-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

export function DashboardLayout({ session, children }: DashboardLayoutProps) {
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
          <div className="flex items-center gap-6">
            <h1 className="text-h2 text-foreground">Ratify</h1>
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={navLinkClasses}
                activeProps={{ className: 'bg-muted text-foreground' }}
              >
                Dashboard
              </Link>
              <Link
                to="/clients"
                className={navLinkClasses}
                activeProps={{ className: 'bg-muted text-foreground' }}
              >
                Clients
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-caption text-muted-foreground">{session.user.email}</span>
            </div>
            <Button variant="outline" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? 'Logging Out...' : 'Log Out'}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
