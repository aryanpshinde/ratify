import { useState, type ReactNode } from 'react';
import { signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface PortalShellProps {
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

export function PortalShell({ session, children }: PortalShellProps) {
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
          <div className="flex items-center gap-3">
            <Avatar>
              {session.user.image && (
                <AvatarImage src={session.user.image} alt={session.user.name} />
              )}
              <AvatarFallback>{getInitials(session.user.name, session.user.email)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-end">
              <span className="text-body-sm font-medium text-foreground">{session.user.name}</span>
              <span className="font-mono text-caption text-muted-foreground">
                {session.user.email}
              </span>
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
