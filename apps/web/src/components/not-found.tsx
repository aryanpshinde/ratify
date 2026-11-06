import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <p className="font-mono text-micro tracking-widest text-muted-foreground uppercase">404</p>
      <h1 className="text-h1 text-foreground">Page not found</h1>
      <p className="max-w-sm text-body text-muted-foreground">
        This page doesn't exist, or it moved. Head back and pick up where you left off.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Button>Back to Ratify</Button>
      </Link>
    </main>
  );
}
