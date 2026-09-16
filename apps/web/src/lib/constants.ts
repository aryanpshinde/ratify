export const JUST_SIGNED_UP_KEY = 'ratify:just-signed-up';
import type { ProjectStatus } from '@ratify/shared';
export const PROJECT_STATUS_GROUPS: Array<{ status: ProjectStatus; label: string }> = [
  { status: 'planning', label: 'Planning' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'completed', label: 'Completed' },
];
