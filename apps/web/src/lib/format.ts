const dateFormatter = new Intl.DateTimeFormat('en-us', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}

export function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

export function formatDeadline(deadline: string): string {
  return new Date(`${deadline}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
