import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Pencil, Trash2, Link as LinkIcon, Upload, Send } from 'lucide-react';
import { useDeliverable } from '@/hooks/deliverables/use-deliverable';
import { useDownloadVersion } from '@/hooks/deliverables/use-download-version';
import { useSubmitDeliverable } from '@/hooks/deliverables/use-submit-deliverable';
import { useDeliverableFeedback } from '@/hooks/deliverables/use-deliverable-feedback';
import { useRespondToFeedback } from '@/hooks/deliverables/use-respond-feedback';
import { canReceiveFeedback, canSubmitDeliverable } from '@ratify/shared';
import { FeedbackSection } from '@/components/feedback/feedback-section';
import { DeliverableStatusBadge } from '@/components/deliverables/deliverable-status-badge';
import { DeliverableVersionsList } from '@/components/deliverables/deliverable-versions-list';
import { LinkVersionDialog } from '@/components/deliverables/link-version-dialog';
import { FileVersionDialog } from '@/components/deliverables/file-version-dialog';
import { UpdateDeliverableDialog } from '@/components/deliverables/update-deliverable-dialog';
import { DeleteDeliverableDialog } from '@/components/deliverables/delete-deliverable-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeliverableVersionResponse } from '@ratify/shared';

function EmptyFeedbackNote({ reviewInProgress }: { reviewInProgress: boolean }) {
  return (
    <p className="text-caption text-muted-foreground">
      No feedback yet.{' '}
      {reviewInProgress
        ? 'Client comments and decisions will appear here.'
        : 'Feedback opens when the delivery is submitted for review.'}
    </p>
  );
}

export const Route = createFileRoute('/admin/projects/$projectId/deliverables/$deliverableId')({
  component: DeliverableDetailPage,
});

function DeliverableDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function DeliverableDetailPage() {
  const { deliverableId } = Route.useParams();
  const navigate = useNavigate();
  const { data: deliverable, isPending, isError } = useDeliverable(deliverableId);
  const downloadVersion = useDownloadVersion();
  const submitDeliverable = useSubmitDeliverable();
  const feedback = useDeliverableFeedback(deliverableId);
  const respondToFeedback = useRespondToFeedback();
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDownload = (version: DeliverableVersionResponse) => {
    downloadVersion.mutate(version.id);
  };

  if (isPending) return <DeliverableDetailSkeleton />;

  if (isError || !deliverable) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-body text-muted-foreground">Deliverable not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: '/admin' })}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const locked = deliverable.status === 'approved';
  const reviewInProgress = canReceiveFeedback(deliverable.status);
  const backProjectId = deliverable.projectId;
  const nextVersionNumber = (deliverable.versions[0]?.versionNumber ?? 0) + 1;
  const threads = (feedback.data?.pages ?? []).flatMap((page) => page.items);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/projects/$projectId" params={{ projectId: backProjectId }}>
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
        {!locked && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={submitDeliverable.isPending || !canSubmitDeliverable(deliverable.status)}
              onClick={() =>
                submitDeliverable.mutate({
                  deliverableId: deliverable.id,
                  projectId: deliverable.projectId,
                })
              }
            >
              <Send />
              Submit for review
            </Button>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit deliverable"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil />
                  </Button>
                }
              />
              <TooltipContent>Edit deliverable</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete deliverable"
                    className="text-error hover:text-error"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 />
                  </Button>
                }
              />
              <TooltipContent>Delete deliverable</TooltipContent>
            </Tooltip>
          </div>
        )}
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-h3">Version History</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setFileOpen(true)} disabled={locked}>
                <Upload />
                Upload File
              </Button>
              <Button size="sm" onClick={() => setLinkOpen(true)} disabled={locked}>
                <LinkIcon />
                Add External Link
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {locked && (
            <p className="mb-3 text-caption text-muted-foreground">
              Approved deliverables are locked. Create a new deliverable if more work is needed.
            </p>
          )}
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
              Feedback is open only while review is in progress.
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
            composerSubmitLabel="Respond"
            createPending={respondToFeedback.isPending}
            onCreate={(input, onDone) =>
              respondToFeedback.mutate(
                {
                  deliverableId: deliverable.id,
                  projectId: deliverable.projectId,
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
            emptyState={<EmptyFeedbackNote reviewInProgress={reviewInProgress} />}
          />
        </CardContent>
      </Card>

      <UpdateDeliverableDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        deliverable={deliverable}
      />
      <LinkVersionDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        deliverableId={deliverable.id}
        projectId={deliverable.projectId}
        deliverableTitle={deliverable.title}
        nextVersionNumber={nextVersionNumber}
      />
      <FileVersionDialog
        open={fileOpen}
        onOpenChange={setFileOpen}
        deliverableId={deliverable.id}
        projectId={deliverable.projectId}
        deliverableTitle={deliverable.title}
        nextVersionNumber={nextVersionNumber}
      />
      <DeleteDeliverableDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        deliverable={deliverable}
        onDeleted={() =>
          navigate({ to: '/admin/projects/$projectId', params: { projectId: backProjectId } })
        }
      />
    </div>
  );
}
