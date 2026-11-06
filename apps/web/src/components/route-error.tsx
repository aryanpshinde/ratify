import { Link } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function RouteError({ error, reset }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <p className="font-mono text-micro tracking-widest text-muted-foreground uppercase">
        Unexpected error
      </p>
      <h1 className="text-h1 text-foreground">Something went wrong</h1>
      <p className="max-w-sm text-body text-muted-foreground">
        Something broke on our side. Try again, or head back to your workspace.
      </p>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="max-w-md overflow-x-auto rounded-lg border border-border bg-card p-3 text-left font-mono text-caption text-error">
          {error.message}
        </pre>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link
          to="/"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Button variant="outline">Back to Ratify</Button>
        </Link>
      </div>
    </main>
  );
}
