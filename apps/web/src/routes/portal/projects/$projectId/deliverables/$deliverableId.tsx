import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ThumbsDown, ThumbsUp } from 'lucide-react';
import { canReceiveFeedback } from '@ratify/shared';
import { usePortalDeliverable } from '@/hooks/portal/use-portal-deliverable';
import { usePortalDownloadVersion } from '@/hooks/portal/use-portal-version-download';
import { usePortalFeedback } from '@/hooks/portal/use-portal-feedback';
import { useCreatePortalFeedback } from '@/hooks/portal/use-create-portal-feedback';
import { useApproveDeliverable } from '@/hooks/portal/use-approve-deliverable';
import { useRejectDeliverable } from '@/hooks/portal/use-reject-deliverable';
import { FeedbackSection } from '@/components/feedback/feedback-section';
import { DecisionDialog } from '@/components/portal/portal-decision-dialog';
import { DeliverableStatusBadge } from '@/components/deliverables/deliverable-status-badge';
import { DeliverableVersionsList } from '@/components/deliverables/deliverable-versions-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeliverableVersionResponse } from '@ratify/shared';

export const Route = createFileRoute('/portal/projects/$projectId/deliverables/$deliverableId')({
  component: PortalDeliverableDetailPage,
});

function PortalDeliverableDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function PortalDeliverableDetailPage() {
  const { deliverableId, projectId } = Route.useParams();
  const navigate = useNavigate();
  const { data: deliverable, isPending, isError } = usePortalDeliverable(deliverableId);
  const downloadVersion = usePortalDownloadVersion();
  const feedback = usePortalFeedback(deliverableId);
  const createFeedback = useCreatePortalFeedback();
  const approveDeliverable = useApproveDeliverable();
  const rejectDeliverable = useRejectDeliverable();
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);

  const handleDownload = (version: DeliverableVersionResponse) => {
    downloadVersion.mutate(version.id);
  };

  if (isPending) return <PortalDeliverableDetailSkeleton />;

  if (isError || !deliverable) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-body text-muted-foreground">Deliverable not available.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            navigate({ to: '/portal/projects/$projectId', params: { projectId: projectId } })
          }
        >
          Back to project
        </Button>
      </div>
    );
  }

  const threads = (feedback.data?.pages ?? []).flatMap((page) => page.items);
  const reviewInProgress = canReceiveFeedback(deliverable.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/portal/projects/$projectId" params={{ projectId: projectId }}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Back to project">
                  <ArrowLeft />
                </Button>
              }
            />
            <TooltipContent>Back to project</TooltipContent>
          </Tooltip>
        </Link>
        <h2 className="text-h1 text-foreground">{deliverable.title}</h2>
        <DeliverableStatusBadge status={deliverable.status} />
      </div>

      {deliverable.description && (
        <Card className="noise-overlay">
          <CardHeader>
            <CardTitle className="text-h3">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body text-muted-foreground">{deliverable.description}</p>
          </CardContent>
        </Card>
      )}

      <Card className="noise-overlay">
        <CardHeader>
          <CardTitle className="text-h3">Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliverableVersionsList
            versions={deliverable.versions}
            isPending={isPending}
            onDownload={handleDownload}
          />
        </CardContent>
      </Card>

      <Card className="noise-overlay">
        <CardHeader>
          <CardTitle className="text-h3">Feedback</CardTitle>
          {!reviewInProgress && (
            <p className="text-caption text-muted-foreground">
              Feedback is closed — this deliverable has already been decided.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <FeedbackSection
            reviewInProgress={reviewInProgress}
            versions={deliverable.versions.map((version) => ({
              id: version.id,
              versionNumber: version.versionNumber,
            }))}
            composerSubmitLabel="Post feedback"
            createPending={createFeedback.isPending}
            onCreate={(input, onDone) =>
              createFeedback.mutate(
                {
                  deliverableId: deliverable.id,
                  projectId,
                  data: input,
                },
                { onSuccess: () => onDone(true), onError: () => onDone(false) },
              )
            }
            threads={threads}
            feedPending={feedback.isPending}
            feedError={feedback.isError}
            hasNextPage={feedback.hasNextPage}
            isFetchingNextPage={feedback.isFetchingNextPage}
            fetchNextPage={feedback.fetchNextPage}
            emptyState={
              <p className="text-caption text-muted-foreground">
                No feedback yet. Comments and decisions will appear here.
              </p>
            }
          >
            {reviewInProgress && (
              <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
                <Button
                  variant="outline"
                  disabled={rejectDeliverable.isPending}
                  onClick={() => setDecision('reject')}
                >
                  <ThumbsDown />
                  Reject
                </Button>
                <Button
                  disabled={approveDeliverable.isPending}
                  onClick={() => setDecision('approve')}
                >
                  <ThumbsUp />
                  Approve
                </Button>
              </div>
            )}
          </FeedbackSection>
        </CardContent>
      </Card>

      {decision === 'approve' && (
        <DecisionDialog
          open
          onOpenChange={(open) => (open ? undefined : setDecision(null))}
          decision="approve"
          deliverableTitle={deliverable.title}
          isPending={approveDeliverable.isPending}
          onConfirm={(data, onDone) => {
            approveDeliverable.mutate(
              {
                deliverableId: deliverable.id,
                projectId,
                data,
              },
              { onSuccess: () => onDone(true), onError: () => onDone(false) },
            );
          }}
        />
      )}
      {decision === 'reject' && (
        <DecisionDialog
          open
          onOpenChange={(open) => (open ? undefined : setDecision(null))}
          decision="reject"
          deliverableTitle={deliverable.title}
          isPending={rejectDeliverable.isPending}
          onConfirm={(data, onDone) => {
            rejectDeliverable.mutate(
              {
                deliverableId: deliverable.id,
                projectId,
                data,
              },
              { onSuccess: () => onDone(true), onError: () => onDone(false) },
            );
          }}
        />
      )}
    </div>
  );
}
