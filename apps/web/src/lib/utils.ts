import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const linkFocusRing =
  'rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

export function getInitials(name: string, email: string): string {
  const fromName = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return fromName || email.slice(0, 2).toUpperCase();
}
