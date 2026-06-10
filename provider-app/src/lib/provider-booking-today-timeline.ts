export type ProviderTodayTimelineSegmentKind = 'booking' | 'gap';

export interface ProviderTodayTimelineBookingSegment {
  kind: 'booking';
  bookingId: string;
  startTime: string;
  endTime: string;
  customerName: string | null;
  status: string;
}

export interface ProviderTodayTimelineGapSegment {
  kind: 'gap';
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export type ProviderTodayTimelineSegment =
  | ProviderTodayTimelineBookingSegment
  | ProviderTodayTimelineGapSegment;

export interface ProviderTodayTimelineNextClient {
  bookingId: string;
  startTime: string;
  customerName: string | null;
  minutesUntilStart: number;
}

export interface ProviderTodayTimelineView {
  enabled: boolean;
  date: string;
  rangeStart: string | null;
  rangeEnd: string | null;
  segments: ProviderTodayTimelineSegment[];
  nowMarkerPercent: number | null;
  nextClient: ProviderTodayTimelineNextClient | null;
  activeBookingId: string | null;
}

export function formatProviderTimelineDurationMinutes(minutes: number): string {
  if (minutes <= 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function formatProviderTimelineNextClientLabel(
  nextClient: ProviderTodayTimelineNextClient,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (nextClient.minutesUntilStart <= 0) {
    return t('provider.todayTimelineNextNow', {
      name: nextClient.customerName ?? t('provider.todayTimelineUnknownClient'),
    });
  }
  if (nextClient.minutesUntilStart < 60) {
    return t('provider.todayTimelineNextMinutes', {
      minutes: nextClient.minutesUntilStart,
      name: nextClient.customerName ?? t('provider.todayTimelineUnknownClient'),
    });
  }
  const hours = Math.floor(nextClient.minutesUntilStart / 60);
  const minutes = nextClient.minutesUntilStart % 60;
  return t('provider.todayTimelineNextHours', {
    hours,
    minutes,
    name: nextClient.customerName ?? t('provider.todayTimelineUnknownClient'),
  });
}

export function computeSegmentWidthPercent(
  segmentStartIso: string,
  segmentEndIso: string,
  rangeStartIso: string,
  rangeEndIso: string,
): number {
  const rangeStart = new Date(rangeStartIso).getTime();
  const rangeEnd = new Date(rangeEndIso).getTime();
  const segmentStart = new Date(segmentStartIso).getTime();
  const segmentEnd = new Date(segmentEndIso).getTime();
  const total = rangeEnd - rangeStart;
  if (total <= 0) return 0;
  return Math.max(0, ((segmentEnd - segmentStart) / total) * 100);
}

export function shouldShowProviderTodayTimeline(
  timeline?: ProviderTodayTimelineView | null,
): boolean {
  return Boolean(
    timeline?.enabled &&
      timeline.segments.some((segment) => segment.kind === 'booking'),
  );
}
