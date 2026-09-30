import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CalendarClock, Mail } from 'lucide-react';
import { signOut, useSession } from '@/lib/auth-client';
import { useInvitation } from '@/hooks/invitations/use-invitation';
import { useAcceptInvitation } from '@/hooks/invitations/use-accept-invitation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';

export const Route = createFileRoute('/invite/$token')({
  component: InvitePage,
});

function InvitePage() {
  const queryClient = useQueryClient();

  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: invitation, isPending, isError, error } = useInvitation(token);
  const accept = useAcceptInvitation();

  const sessionEmail = session?.user.email ?? '';
  const emailMismatch =
    !!session && !!invitation && sessionEmail.toLowerCase() !== invitation.email.toLowerCase();

  const handleAccept = () => {
    accept.mutate(token, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['portal', 'projects'] });
        navigate({ to: '/portal' });
      },
    });
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md noise-overlay">
        {isPending || sessionPending ? (
          <CardContent className="p-6">
            <p className="text-body text-muted-foreground">Checking invitation...</p>
          </CardContent>
        ) : isError ? (
          <CardContent className="p-6">
            <CardTitle className="text-h2 text-foreground">Invitation unavailable</CardTitle>
            <p className="mt-2 text-body text-muted-foreground">
              {error?.message ?? 'This invitation could not be found.'}
            </p>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-h2">Project access</CardTitle>
              <CardDescription>You have been invited to view a project on Ratify.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-caption text-muted-foreground">Project</p>
                <p className="text-h3 text-foreground">{invitation.projectTitle}</p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Invited email</p>
                <p className="flex items-center gap-1.5 font-mono text-body-sm text-foreground">
                  <Mail size={14} strokeWidth={1.5} aria-hidden="true" />
                  {invitation.email}
                </p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Expires</p>
                <p className="flex items-center gap-1.5 font-mono text-body-sm text-foreground">
                  <CalendarClock size={14} strokeWidth={1.5} aria-hidden="true" />
                  {formatDate(invitation.expiresAt)}
                </p>
              </div>

              {emailMismatch ? (
                <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-body-sm font-medium text-error">Wrong account</p>
                  <p className="text-caption text-muted-foreground">
                    This invitation was sent to{' '}
                    <span className="font-mono text-foreground">{invitation.email}</span>, but you
                    are signed in as{' '}
                    <span className="font-mono text-foreground">{sessionEmail}</span>.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => signOut()}>
                    Sign in with a different account
                  </Button>
                </div>
              ) : !session ? (
                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full"
                    onClick={() =>
                      navigate({ to: '/signup', search: { redirect: `/invite/${token}` } })
                    }
                  >
                    Create an account
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      navigate({ to: '/login', search: { redirect: `/invite/${token}` } })
                    }
                  >
                    I already have an account
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={handleAccept} disabled={accept.isPending}>
                  {accept.isPending ? 'Accepting...' : 'Accept invitation'}
                </Button>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
