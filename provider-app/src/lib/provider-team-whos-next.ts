import type { TeamFloorChipStatus } from './provider-team-floor';

export interface TeamWhosNextQueueItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  isNext: boolean;
  queuePosition: number;
  teamFloorStatus: TeamFloorChipStatus;
  service: { name: string; price?: number; currency?: string } | null;
  customer: { name: string; phone: string | null; email: string | null } | null;
  visitStatus?: {
    kind: 'running_late' | 'ready_now';
    minutesLate?: number;
    markedAt: string;
  } | null;
}

export interface TeamWhosNextProviderColumn {
  employeeId: string;
  employeeName: string;
  nextBookingId: string | null;
  queue: TeamWhosNextQueueItem[];
}

export interface TeamWhosNextView {
  viewMode: 'team';
  windowHours: number;
  windowStart: string;
  windowEnd: string;
  columns: TeamWhosNextProviderColumn[];
  totalQueued: number;
}

export function formatTeamWhosNextWindowLabel(
  view: TeamWhosNextView,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  return t('provider.teamWhosNextWindow', { hours: view.windowHours });
}

export function countProvidersWithQueue(view?: TeamWhosNextView | null): number {
  return view?.columns.filter((column) => column.queue.length > 0).length ?? 0;
}
