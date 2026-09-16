import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-14" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-44" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-32" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-4 w-28" />
              <Skeleton className="mt-4 h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
