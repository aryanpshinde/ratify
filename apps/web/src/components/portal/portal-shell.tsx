import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { LogOut } from 'lucide-react';

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
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      queryClient.clear();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card noise-overlay">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <h1 className="text-h2 text-foreground">Ratify</h1>
          <div className="flex items-center gap-3">
            <Avatar>
              {session.user.image && (
                <AvatarImage src={session.user.image} alt={session.user.name} />
              )}
              <AvatarFallback>{getInitials(session.user.name, session.user.email)}</AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-end sm:flex">
              <span className="max-w-48 truncate text-body-sm font-medium text-foreground">
                {session.user.name}
              </span>
              <span className="max-w-48 truncate font-mono text-caption text-muted-foreground">
                {session.user.email}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="sm:hidden"
              aria-label={loggingOut ? 'Logging out' : 'Log out'}
            >
              <LogOut />
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden sm:inline-flex"
            >
              {loggingOut ? 'Logging Out...' : 'Log Out'}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
