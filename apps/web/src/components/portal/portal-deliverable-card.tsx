import { Link } from '@tanstack/react-router';
import type { DeliverableListItem } from '@ratify/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeliverableStatusBadge } from '@/components/deliverables/deliverable-status-badge';
import { formatDate } from '@/lib/format';

interface PortalDeliverableCardProps {
  deliverable: DeliverableListItem;
}

export function PortalDeliverableCard({ deliverable }: PortalDeliverableCardProps) {
  const latest = deliverable.latestVersion;

  return (
    <Card className="noise-overlay">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-h3">{deliverable.title}</CardTitle>
          <DeliverableStatusBadge status={deliverable.status} />
        </div>
        {deliverable.description && (
          <p className="text-caption text-muted-foreground">{deliverable.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-caption text-muted-foreground">
            {latest ? `v${latest.versionNumber}` : 'No versions yet'} &middot; Updated{' '}
            {formatDate(deliverable.updatedAt)}
          </p>
          <Link
            to="/portal/projects/$projectId/deliverables/$deliverableId"
            params={{
              projectId: deliverable.projectId,
              deliverableId: deliverable.id,
            }}
            className="inline-flex items-center gap-1.5 text-caption font-medium text-primary hover:underline"
          >
            View deliverable
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
