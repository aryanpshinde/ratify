import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientsEmptyStateProps {
  onCreateClick: () => void;
}

export function ClientsEmptyState({ onCreateClick }: ClientsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <Users size={64} strokeWidth={1} aria-hidden="true" className="text-muted-foreground" />
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
