import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, LogOut, Menu, Users } from 'lucide-react';
import { signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getInitials } from '@/lib/utils';

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
  'rounded-lg px-2.5 py-1 text-body-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

const drawerLinkClasses =
  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/clients', label: 'Clients', icon: Users, exact: false },
] as const;

export function DashboardLayout({ session, children }: DashboardLayoutProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const queryClient = useQueryClient();
  const pathname = useLocation().pathname;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNavOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      queryClient.clear();
    } finally {
      setLoggingOut(false);
    }
  };

  const initials = getInitials(session.user.name, session.user.email);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card noise-overlay">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6">
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="lg:hidden"
                    aria-label="Open navigation menu"
                  />
                }
              >
                <Menu />
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="text-h2">Ratify</SheetTitle>
                  <SheetDescription>Admin navigation</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4" aria-label="Admin navigation">
                  {navItems.map(({ to, label, icon: Icon, exact }) => (
                    <Link
                      key={to}
                      to={to}
                      className={drawerLinkClasses}
                      activeProps={{ className: 'bg-muted text-foreground' }}
                      activeOptions={{ exact }}
                    >
                      <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                      {label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto border-t border-border-subtle p-4">
                  <p className="px-2 text-micro text-muted-foreground">Signed in as</p>
                  <div className="mt-2 flex items-center gap-3 rounded-lg p-2">
                    <Avatar size="lg">
                      {session.user.image && (
                        <AvatarImage src={session.user.image} alt={session.user.name} />
                      )}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-medium text-foreground">
                        {session.user.name}
                      </p>
                      <p className="truncate font-mono text-caption text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-h2 text-foreground">Ratify</h1>

            <nav className="hidden items-center gap-1 lg:flex">
              <Link
                to="/admin"
                className={navLinkClasses}
                activeProps={{ className: 'bg-muted text-foreground' }}
                activeOptions={{ exact: true }}
              >
                Dashboard
              </Link>
              <Link
                to="/admin/clients"
                className={navLinkClasses}
                activeProps={{ className: 'bg-muted text-foreground' }}
              >
                Clients
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Avatar>
              {session.user.image && (
                <AvatarImage src={session.user.image} alt={session.user.name} />
              )}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-end lg:flex">
              <span className="text-body-sm font-medium text-foreground">{session.user.name}</span>
              <span className="font-mono text-caption text-muted-foreground">
                {session.user.email}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden lg:inline-flex"
            >
              {loggingOut ? 'Logging Out...' : 'Log Out'}
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="lg:hidden"
              aria-label={loggingOut ? 'Logging out' : 'Log out'}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
