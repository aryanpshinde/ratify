export function PortalDeliverablesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center shadow-sm noise-overlay">
      <p className="text-h3 text-foreground">Nothing to review here yet</p>
      <p className="mt-2 max-w-sm text-body text-muted-foreground">
        Deliverables will appear here once we share them with you.
      </p>
    </div>
  );
}
