import { useRef, type ReactNode } from 'react';
import { useAutoLoadNextPage } from '@/hooks/use-auto-load-next-page';
import { Button } from '@/components/ui/button';

interface BoundedFeedProps {
  label: string;
  loadMoreLabel: string;
  endLabel: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  children: ReactNode;
}

export function BoundedFeed({
  label,
  loadMoreLabel,
  endLabel,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  children,
}: BoundedFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useAutoLoadNextPage({
    containerRef,
    sentinelRef,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={label}
      tabIndex={0}
      className="max-h-[20rem] overflow-y-auto scrollbar-thin rounded-md pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {children}
      <div ref={sentinelRef} className="flex items-center justify-end pt-1">
        {hasNextPage ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : loadMoreLabel}
          </Button>
        ) : (
          <span className="text-caption text-muted-foreground">{endLabel}</span>
        )}
      </div>
    </div>
  );
}
