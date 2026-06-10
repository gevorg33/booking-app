import api, { unwrap } from '../services/api';

export type ProviderCalendarUtilizationBand =
  | 'empty'
  | 'low'
  | 'medium'
  | 'high';

export interface ProviderCalendarMonthDaySummary {
  date: string;
  bookingCount: number;
  bookedMinutes: number;
  scheduledMinutes: number;
  utilizationPercent: number;
  utilizationBand: ProviderCalendarUtilizationBand;
}

export interface ProviderCalendarMonthView {
  month: string;
  from: string;
  to: string;
  viewMode: 'provider' | 'team' | 'admin' | 'owner';
  days: ProviderCalendarMonthDaySummary[];
}

export async function fetchProviderCalendarMonth(
  businessId: string,
  monthKey: string,
): Promise<ProviderCalendarMonthView> {
  const { data: res } = await api.get(
    `/businesses/${businessId}/provider/calendar/month`,
    { params: { month: monthKey } },
  );
  return unwrap<ProviderCalendarMonthView>(res);
}

export function mapCalendarMonthDaysByDate(
  days: ProviderCalendarMonthDaySummary[],
): Record<string, ProviderCalendarMonthDaySummary> {
  return Object.fromEntries(days.map((day) => [day.date, day]));
}
