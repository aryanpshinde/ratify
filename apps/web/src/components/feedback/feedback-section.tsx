import type { ReactNode } from 'react';
import type { CreateFeedbackInput, FeedbackThreadResponse } from '@ratify/shared';
import { BoundedFeed } from '@/components/paginated/bounded-feed';
import { FeedbackComposer } from './feedback-composer';
import { FeedbackThreads } from './feedback-threads';
import { Skeleton } from '@/components/ui/skeleton';

interface FeedbackSectionProps {
  reviewInProgress: boolean;
  versions: Array<{ id: string; versionNumber: number }>;
  composerSubmitLabel: string;
  createPending: boolean;
  onCreate: (input: CreateFeedbackInput, onDone: (ok: boolean) => void) => void;
  threads: FeedbackThreadResponse[];
  feedPending: boolean;
  feedError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  emptyState: ReactNode;
  children?: ReactNode;
}

export function FeedbackSection({
  reviewInProgress,
  versions,
  composerSubmitLabel,
  createPending,
  onCreate,
  threads,
  feedPending,
  feedError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  emptyState,
  children,
}: FeedbackSectionProps) {
  const handleReply = (parentId: string, body: string, onDone: (ok: boolean) => void) => {
    const thread = threads.find((item) => item.id === parentId);
    onCreate({ versionId: thread?.versionId ?? '', body, parentId }, onDone);
  };

  return (
    <div className="space-y-6">
      {reviewInProgress && (
        <FeedbackComposer
          versions={versions}
          isPending={createPending}
          submitLabel={composerSubmitLabel}
          onSend={onCreate}
        />
      )}

      {feedPending ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : feedError ? (
        <p className="text-body text-error">Failed to load feedback.</p>
      ) : threads.length === 0 ? (
        emptyState
      ) : (
        <BoundedFeed
          label="Feedback threads"
          loadMoreLabel="Load older feedback"
          endLabel="End of feedback"
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        >
          <FeedbackThreads
            threads={threads}
            canReply={reviewInProgress}
            replyPending={createPending}
            onReply={handleReply}
          />
        </BoundedFeed>
      )}

      {children}
    </div>
  );
}
