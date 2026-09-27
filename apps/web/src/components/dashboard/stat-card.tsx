interface StatCardProps {
  label: string;
  value: number;
  hint?: string | undefined;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="noise-overlay rounded-lg border border-border bg-card p-5 shadow-sm">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-h1 text-foreground tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-caption text-muted-foreground">{hint}</p>}
    </div>
  );
}
