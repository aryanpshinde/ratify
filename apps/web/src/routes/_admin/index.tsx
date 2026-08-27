import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSession } from '@/lib/auth-client';
import { JUST_SIGNED_UP_KEY } from '@/lib/constants';

export const Route = createFileRoute('/_admin/')({
  component: DashboardHome,
});

function DashboardHome() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(JUST_SIGNED_UP_KEY)) return;
    sessionStorage.removeItem(JUST_SIGNED_UP_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing with sessionStorage on mount
    setWelcomeOpen(true);
  }, []);

  const name = session?.user.name;

  const handleGetStarted = () => {
    setWelcomeOpen(false);
    navigate({ to: '/clients' });
  };

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <h2 className="text-h1 text-foreground">Welcome{name ? `, ${name}` : ''}</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Your workspace is ready. Start by adding your first client.
      </p>

      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <PartyPopper
              size={48}
              strokeWidth={1}
              aria-hidden="true"
              className="mx-auto text-primary"
            />
            <DialogTitle>Account created successfully!</DialogTitle>
            <DialogDescription>
              Welcome to Ratify
              {name ? `, ${name}` : ''}. Your workspace is ready — add your first client to get
              started.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={handleGetStarted}>
              Create your first client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
