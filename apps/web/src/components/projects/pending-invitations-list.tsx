import { useState } from 'react';
import { Link, Check, Ban } from 'lucide-react';
import { toast } from 'sonner';
import type { InvitationResponse } from '@ratify/shared';
import { formatDate } from '@/lib/format';
import { useRevokeInvitation } from '@/hooks/projects/use-revoke-invitation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

function getStatus(invitation: InvitationResponse): {
  label: string;
  variant: BadgeVariant;
} {
  if (invitation.acceptedAt) {
    return { label: 'Accepted', variant: 'success' };
  }
  if (invitation.revokedAt) {
    return { label: 'Revoked', variant: 'muted' };
  }
  if (new Date(invitation.expiresAt) < new Date()) {
    return { label: 'Expired', variant: 'error' };
  }
  return { label: 'Pending', variant: 'warning' };
}

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Invitation link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link. Please try again.');
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            aria-label="Copy invitation link"
          />
        }
      >
        {copied ? <Check className="text-success" /> : <Link />}
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied!' : 'Copy invitation link'}</TooltipContent>
    </Tooltip>
  );
}

function InvitationsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm"
        >
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

interface PendingInvitationsListProps {
  invitations: InvitationResponse[] | undefined;
  isPending: boolean;
  isError: boolean;
  projectId: string;
}

export function PendingInvitationsList({
  invitations,
  isPending,
  isError,
  projectId,
}: PendingInvitationsListProps) {
  const [revokeTarget, setRevokeTarget] = useState<InvitationResponse | null>(null);
  const revokeInvitation = useRevokeInvitation();
  if (isPending) return <InvitationsSkeleton />;

  if (isError) {
    return <p className="text-body text-error">Failed to load invitations.</p>;
  }

  if (!invitations || invitations.length === 0) {
    return (
      <p className="text-body text-muted-foreground">
        No invitations yet. Click "Invite Client" to send a portal access invite.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation) => {
        const status = getStatus(invitation);
        return (
          <div
            key={invitation.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-body font-medium text-foreground">
                {invitation.email}
              </p>
              <p className="font-mono text-caption text-muted-foreground tabular-nums">
                Expires {formatDate(invitation.expiresAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <CopyLinkButton token={invitation.token} />
              {status.label === 'Pending' && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setRevokeTarget(invitation)}
                        aria-label="Revoke invitation"
                        className="text-muted-foreground hover:text-error"
                      />
                    }
                  >
                    <Ban />
                  </TooltipTrigger>
                  <TooltipContent>Revoke invitation</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        );
      })}
      {revokeTarget && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !revokeInvitation.isPending) setRevokeTarget(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-h2">Revoke invitation</DialogTitle>
              <DialogDescription>
                The link sent to{' '}
                <span className="font-mono break-all text-foreground">{revokeTarget.email}</span>{' '}
                will stop working immediately. You can send a new invitation anytime.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRevokeTarget(null)}
                disabled={revokeInvitation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={revokeInvitation.isPending}
                onClick={() =>
                  revokeInvitation.mutate(
                    { projectId, invitationId: revokeTarget.id },
                    { onSuccess: () => setRevokeTarget(null) },
                  )
                }
              >
                {revokeInvitation.isPending ? 'Revoking...' : 'Revoke invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
