export type TeamFloorChipStatus = 'waiting' | 'in_service' | 'done' | 'no_show';

export interface TeamFloorBookingView {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  teamFloorStatus: TeamFloorChipStatus;
  notes: string | null;
  service: { name: string; price?: number; currency?: string } | null;
  customer: { name: string; phone: string | null; email: string | null } | null;
  employee: { id: string; name: string } | null;
  visitStatus?: {
    kind: 'running_late' | 'ready_now';
    minutesLate?: number;
    markedAt: string;
  } | null;
}

export interface TeamFloorColumnView {
  employeeId: string;
  employeeName: string;
  bookings: TeamFloorBookingView[];
  statusCounts: Record<TeamFloorChipStatus, number>;
}

export interface TeamFloorTodayView {
  date: string;
  viewMode: 'team';
  filterEmployeeId: string | null;
  providers: Array<{ id: string; name: string }>;
  columns: TeamFloorColumnView[];
  totalBookings: number;
}

const TEAM_FLOOR_CHIP_I18N: Record<TeamFloorChipStatus, string> = {
  waiting: 'provider.teamFloorWaiting',
  in_service: 'provider.teamFloorInService',
  done: 'provider.teamFloorDone',
  no_show: 'provider.teamFloorNoShow',
};

const TEAM_FLOOR_CHIP_COLORS: Record<TeamFloorChipStatus, string> = {
  waiting: 'warning',
  in_service: 'success',
  done: 'primary',
  no_show: 'danger',
};

export function teamFloorChipColor(status: TeamFloorChipStatus): string {
  return TEAM_FLOOR_CHIP_COLORS[status];
}

export function formatTeamFloorChipLabel(
  status: TeamFloorChipStatus,
  t: (key: string) => string,
): string {
  return t(TEAM_FLOOR_CHIP_I18N[status]);
}

export function formatTeamFloorStatusSummary(
  counts: Record<TeamFloorChipStatus, number>,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const parts: string[] = [];
  (Object.keys(counts) as TeamFloorChipStatus[]).forEach((status) => {
    const count = counts[status];
    if (count <= 0) return;
    parts.push(
      t('provider.teamFloorStatusCount', {
        count,
        status: formatTeamFloorChipLabel(status, t),
      }),
    );
  });
  return parts.join(' · ');
}

export const ALL_TEAM_FLOOR_PROVIDERS_FILTER = '__all__';
