const dateFormatter = new Intl.DateTimeFormat('en-US', {
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
  return new Date(`${deadline}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function toISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isISODate(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function formatDDMMYY(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('-');
}

export function parseDDMMYYtoISO(digits: string): string | null {
  let dd: number;
  let mm: number;
  let yyyy: number;
  if (digits.length === 6) {
    dd = Number(digits.slice(0, 2));
    mm = Number(digits.slice(2, 4));
    yyyy = 2000 + Number(digits.slice(4, 6));
  } else if (digits.length === 8) {
    dd = Number(digits.slice(0, 2));
    mm = Number(digits.slice(2, 4));
    yyyy = Number(digits.slice(4, 8));
  } else {
    return null;
  }
  if (mm < 1 || mm > 12 || dd < 1 || yyyy < 2000 || yyyy > 2100) return null;
  if (dd > new Date(yyyy, mm, 0).getDate()) return null;
  return toISODate(new Date(yyyy, mm - 1, dd));
}

export function isoToDDMMYY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}
