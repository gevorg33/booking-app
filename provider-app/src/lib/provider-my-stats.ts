import api, { unwrap } from '../services/api';

export type ProviderMyStatsPeriod = 'week' | 'month';
export type ProviderMyStatsScope = 'mine' | 'team';

export interface ProviderMyStats {
  period: ProviderMyStatsPeriod;
  scope: ProviderMyStatsScope;
  from: string;
  to: string;
  canTeamRollup: boolean;
  completedBookings: number;
  paidRevenue: number;
  currency: string;
  utilizationPercent: number;
  bookedMinutes: number;
  scheduledMinutes: number;
  averageReviewScore: number | null;
  newReviewsCount: number;
  employeeCount: number;
  tipsEnabled: boolean;
  tipTotal?: number;
  tippedVisitCount?: number;
}

export async function fetchProviderMyStats(
  businessId: string,
  params: { period: ProviderMyStatsPeriod; scope: ProviderMyStatsScope },
): Promise<ProviderMyStats> {
  const { data: res } = await api.get(`/businesses/${businessId}/provider/stats`, {
    params,
  });
  return unwrap<ProviderMyStats>(res);
}

export function formatUtilizationPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatStatsPeriodLabel(
  period: ProviderMyStatsPeriod,
  labels: { week: string; month: string },
): string {
  return period === 'month' ? labels.month : labels.week;
}

export function formatScheduledHoursLabel(
  scheduledMinutes: number,
  hoursLabel: string,
): string {
  const hours = Math.round((scheduledMinutes / 60) * 10) / 10;
  return `${hours} ${hoursLabel}`;
}
