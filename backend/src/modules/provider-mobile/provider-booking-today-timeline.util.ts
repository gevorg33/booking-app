/** prov-exp-3.3 — compact Today timeline from today's bookings. */

import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  computeWallClockNowMarkerPercent,
  getWallClockNowFromInstant,
  isWallClockRangeActiveAt,
  isWallClockStartStrictlyFutureAt,
  minutesUntilWallClockStartAt,
  resolveBusinessWallClockTimezone,
} from '../../common/utils/timezone.util.js';

export type ProviderTodayTimelineSegmentKind = 'booking' | 'gap';

export interface ProviderTodayTimelineBookingLike {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  customer?: { name?: string | null } | null;
}

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

const UPCOMING_STATUSES = new Set<string>([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
]);

const TIMELINE_EXCLUDED_STATUSES = new Set<string>([BookingStatus.CANCELLED]);

function parseInstant(value: Date | string): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIso(value: Date): string {
  return value.toISOString();
}

export function minutesBetween(startMs: number, endMs: number): number {
  if (endMs <= startMs) return 0;
  return Math.round((endMs - startMs) / 60_000);
}

export function formatProviderTimelineDurationMinutes(minutes: number): string {
  if (minutes <= 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function computeProviderTodayNowMarkerPercent(
  rangeStartMs: number,
  rangeEndMs: number,
  nowMs: number,
): number | null {
  if (rangeEndMs <= rangeStartMs) return null;
  if (nowMs < rangeStartMs || nowMs > rangeEndMs) return null;
  const percent = ((nowMs - rangeStartMs) / (rangeEndMs - rangeStartMs)) * 100;
  return Math.min(100, Math.max(0, Math.round(percent * 10) / 10));
}

export function resolveProviderTodayNextClient(
  bookings: ProviderTodayTimelineBookingLike[],
  timeZone: string,
  now?: Date,
): ProviderTodayTimelineNextClient | null {
  const wallNow = getWallClockNowFromInstant(now ?? new Date(), timeZone);
  const upcoming = bookings
    .map((booking) => {
      const start = parseInstant(booking.startTime);
      if (!start || !UPCOMING_STATUSES.has(booking.status)) return null;
      if (!isWallClockStartStrictlyFutureAt(start, wallNow)) return null;
      return { booking, start };
    })
    .filter(
      (
        entry,
      ): entry is {
        booking: ProviderTodayTimelineBookingLike;
        start: Date;
      } => Boolean(entry),
    )
    .sort(
      (a, b) =>
        minutesUntilWallClockStartAt(a.start, wallNow) -
        minutesUntilWallClockStartAt(b.start, wallNow),
    );

  const next = upcoming[0];
  if (!next) return null;

  return {
    bookingId: next.booking.id,
    startTime: toIso(next.start),
    customerName: next.booking.customer?.name?.trim() || null,
    minutesUntilStart: minutesUntilWallClockStartAt(next.start, wallNow),
  };
}

export function resolveProviderTodayActiveBookingId(
  bookings: ProviderTodayTimelineBookingLike[],
  timeZone: string,
  now?: Date,
): string | null {
  const wallNow = getWallClockNowFromInstant(now ?? new Date(), timeZone);
  for (const booking of bookings) {
    if (!UPCOMING_STATUSES.has(booking.status)) continue;
    const start = parseInstant(booking.startTime);
    const end = parseInstant(booking.endTime);
    if (!start || !end) continue;
    if (isWallClockRangeActiveAt(start, end, wallNow)) {
      return booking.id;
    }
  }
  return null;
}

export function buildProviderTodayTimelineSegments(
  bookings: ProviderTodayTimelineBookingLike[],
): ProviderTodayTimelineSegment[] {
  const sorted = bookings
    .map((booking) => {
      const start = parseInstant(booking.startTime);
      const end = parseInstant(booking.endTime);
      if (!start || !end || TIMELINE_EXCLUDED_STATUSES.has(booking.status)) {
        return null;
      }
      return { booking, start, end };
    })
    .filter(
      (
        entry,
      ): entry is {
        booking: ProviderTodayTimelineBookingLike;
        start: Date;
        end: Date;
      } => Boolean(entry),
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const segments: ProviderTodayTimelineSegment[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = sorted[index - 1];

    if (previous && current.start.getTime() > previous.end.getTime()) {
      segments.push({
        kind: 'gap',
        startTime: toIso(previous.end),
        endTime: toIso(current.start),
        durationMinutes: minutesBetween(
          previous.end.getTime(),
          current.start.getTime(),
        ),
      });
    }

    segments.push({
      kind: 'booking',
      bookingId: current.booking.id,
      startTime: toIso(current.start),
      endTime: toIso(current.end),
      customerName: current.booking.customer?.name?.trim() || null,
      status: current.booking.status,
    });
  }

  return segments;
}

export function buildProviderTodayTimelineView(input: {
  enabled: boolean;
  date: string;
  bookings: ProviderTodayTimelineBookingLike[];
  now?: Date;
  timeZone?: string;
}): ProviderTodayTimelineView {
  const timeZone = input.timeZone ?? 'UTC';
  const wallNow = getWallClockNowFromInstant(input.now ?? new Date(), timeZone);
  const segments = buildProviderTodayTimelineSegments(input.bookings);

  const bookingSegments = segments.filter(
    (segment): segment is ProviderTodayTimelineBookingSegment =>
      segment.kind === 'booking',
  );

  if (!input.enabled || bookingSegments.length === 0) {
    return {
      enabled: input.enabled,
      date: input.date,
      rangeStart: null,
      rangeEnd: null,
      segments: [],
      nowMarkerPercent: null,
      nextClient: null,
      activeBookingId: null,
    };
  }

  const rangeStartMs = Math.min(
    ...bookingSegments.map((segment) => new Date(segment.startTime).getTime()),
  );
  const rangeEndMs = Math.max(
    ...bookingSegments.map((segment) => new Date(segment.endTime).getTime()),
  );

  return {
    enabled: input.enabled,
    date: input.date,
    rangeStart: new Date(rangeStartMs).toISOString(),
    rangeEnd: new Date(rangeEndMs).toISOString(),
    segments,
    nowMarkerPercent: computeWallClockNowMarkerPercent(
      new Date(rangeStartMs),
      new Date(rangeEndMs),
      wallNow,
    ),
    nextClient: resolveProviderTodayNextClient(
      input.bookings,
      timeZone,
      input.now,
    ),
    activeBookingId: resolveProviderTodayActiveBookingId(
      input.bookings,
      timeZone,
      input.now,
    ),
  };
}

export function providerMobileShowTodayTimeline(
  settings?: Record<string, unknown> | null,
): boolean {
  const raw =
    (settings?.providerMobile as Record<string, unknown> | undefined) ?? {};
  if (raw.showTodayTimeline === false) return false;
  return true;
}
