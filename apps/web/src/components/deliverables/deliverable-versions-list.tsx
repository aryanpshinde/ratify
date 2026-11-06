import { Download, ExternalLink } from 'lucide-react';
import type { DeliverableVersionResponse } from '@ratify/shared';
import { formatDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function VersionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm"
        >
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

interface DeliverableVersionsListProps {
  versions: DeliverableVersionResponse[] | undefined;
  isPending: boolean;
  onDownload?: (version: DeliverableVersionResponse) => void;
}

export function DeliverableVersionsList({
  versions,
  isPending,
  onDownload,
}: DeliverableVersionsListProps) {
  if (isPending) return <VersionsSkeleton />;

  if (!versions || versions.length === 0) {
    return (
      <p className="text-body text-muted-foreground">
        No versions yet. Upload a file or add an external link to create the first version.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <div
          key={version.id}
          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
        >
          <div className="min-w-0">
            <p className="font-mono text-body font-medium text-foreground tabular-nums">
              v{version.versionNumber}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-caption text-muted-foreground">
              <span className="tabular-nums">{formatDate(version.createdAt)}</span>
              {version.externalUrl && (
                <span className="max-w-56 truncate sm:max-w-80">{version.externalUrl}</span>
              )}
              {version.fileName && (
                <span className="line-clamp-2 max-w-56 break-all sm:max-w-80">
                  {version.fileName}
                  {version.fileSize !== null ? ` · ${formatBytes(version.fileSize)}` : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border-subtle pt-2 sm:border-0 sm:pt-0">
            {version.externalUrl && (
              <a
                href={version.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-caption font-medium text-primary hover:underline"
              >
                <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
                Open link
              </a>
            )}
            {version.fileName && (
              <button
                type="button"
                onClick={() => onDownload?.(version)}
                className="inline-flex items-center gap-1.5 text-caption font-medium text-primary hover:underline"
              >
                <Download size={14} strokeWidth={1.5} aria-hidden="true" />
                Download
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
