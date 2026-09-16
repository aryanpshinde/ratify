interface StatCardProps {
  label: string;
  value: number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="noise-overlay rounded-lg border border-border bg-card p-5">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-2 text-h1 text-foreground">{value}</p>
    </div>
  );
}
