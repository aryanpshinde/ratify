import { Button } from '@/components/ui/button';

interface ClientsEmptyStateProps {
  onCreateClick: () => void;
}

export function ClientsEmptyState({ onCreateClick }: ClientsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <h3 className="mt-6 text-h2 text-foreground">No clients yet</h3>
      <p className="mt-2 max-w-sm text-body text-muted-foreground">
        Get started by adding your first client. You'll be able to create projects and invite them
        to the delivery portal.
      </p>
      <Button className="mt-6" onClick={onCreateClick}>
        Create First Client
      </Button>
    </div>
  );
}
