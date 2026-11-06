import { Skeleton } from '@/components/ui/skeleton';

export function PortalGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-28" />
          <div className="mt-4 flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
