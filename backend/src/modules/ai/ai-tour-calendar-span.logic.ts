import type { Booking } from '../booking/entities/booking.entity.js';
import type { BookingService } from '../booking/booking.service.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import {
  extractTourBookingMetadata,
  isTourService,
} from '../../common/utils/tour-service.util.js';
import {
  buildServiceColorMap,
  buildTourCalendarSpans,
  buildWeekDateKeys,
  normalizeTourWeekAnchorDateKey,
  TOUR_SERVICE_COLORS,
  type CalendarWeekBooking,
} from '../../common/utils/tour-calendar.util.js';
import { resolveLocale, type AppLocale } from '../../common/i18n/messages.js';
import type { CommandResult } from './command-completion.types.js';
import { formatDateForAiLabel } from './ai-date-label.util.js';
import { detectSemanticPromptLocale } from './intent-anchor.seed.util.js';
import {
  parseExplainTourCalendarSpanFromPrompt,
  type ParsedExplainTourCalendarSpan,
  type TourCalendarSpanAspect,
} from './ai-tour-calendar-span.util.js';

export interface TourCalendarSpanLogicDeps {
  bookingService: Pick<BookingService, 'findAll'>;
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function isTourBooking(booking: Booking): boolean {
  if (
    isTourService((booking.service?.metadata ?? {}) as Record<string, unknown>)
  ) {
    return true;
  }
  return Boolean(
    extractTourBookingMetadata(booking.metadata).tourStartDate ||
    extractTourBookingMetadata(booking.metadata).paxCount,
  );
}

function toCalendarWeekBooking(booking: Booking): CalendarWeekBooking {
  return {
    id: booking.id,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    serviceId: booking.serviceId,
    service: booking.service
      ? { id: booking.service.id, name: booking.service.name }
      : null,
    customer: booking.customer ? { name: booking.customer.name } : null,
    metadata: booking.metadata,
  };
}

function resolveWeekAnchor(
  parsed: ParsedExplainTourCalendarSpan,
  tourBookings: Booking[],
): string {
  const normalized = normalizeTourWeekAnchorDateKey(parsed.weekStartDate);
  if (normalized) return normalized;
  const withRange = tourBookings
    .map(
      (booking) => extractTourBookingMetadata(booking.metadata).tourStartDate,
    )
    .filter((value): value is string => Boolean(value))
    .sort();
  return withRange[0] ?? getTodayDateKey();
}

/** Prefer prompt script (hy/ru), then params.locale — e2e-bug.336 (mirrors e2e-bug.289). */
export function resolveExplainTourCalendarSpanLocale(
  params: Record<string, unknown> = {},
  prompt?: string,
): AppLocale {
  const text = String(prompt ?? params._prompt ?? '');
  const detected = detectSemanticPromptLocale(text);
  if (detected === 'hy' || detected === 'ru') return detected;
  return resolveLocale(
    typeof params.locale === 'string' ? params.locale : null,
  );
}

// e2e-bug.336 — no DD/MM slash dates (sibling of Fixed e2e-bug.306/308).
function formatSpanRange(
  start: string,
  end: string,
  locale: AppLocale,
): string {
  const startLabel = formatDateForAiLabel(start, locale);
  const endLabel = formatDateForAiLabel(end, locale);
  return start === end ? startLabel : `${startLabel}–${endLabel}`;
}

function buildAspectSummary(
  aspect: TourCalendarSpanAspect,
  weekDateKeys: string[],
  spans: ReturnType<typeof buildTourCalendarSpans>,
  colorMap: Record<string, string>,
  locale: AppLocale,
): string {
  const weekLabel = `${formatDateForAiLabel(weekDateKeys[0], locale)}–${formatDateForAiLabel(weekDateKeys[6], locale)}`;
  const parts: string[] = [];

  if (aspect === 'all' || aspect === 'multiDaySpan') {
    if (spans.length === 0) {
      parts.push(
        `no tour spans in week ${weekLabel} — multi-day tours need tourStartDate/tourEndDate metadata and appear as horizontal bars across day columns`,
      );
    } else {
      const examples = spans
        .slice(0, 3)
        .map(
          (span) =>
            `${span.serviceName} cols ${span.colStart + 1}–${span.colEnd + 1} (${formatSpanRange(span.tourStartDate, span.tourEndDate, locale)})`,
        )
        .join('; ');
      parts.push(
        `vert-tour-1.10 draws each tour booking from tourStartDate through tourEndDate across calendar columns — ${examples}`,
      );
    }
  }

  if (aspect === 'all' || aspect === 'serviceColors') {
    const entries = Object.entries(colorMap);
    if (entries.length === 0) {
      parts.push(
        `service colors come from a fixed ${TOUR_SERVICE_COLORS.length}-color palette assigned in serviceId order`,
      );
    } else {
      const labels = entries
        .map(([serviceId, color]) => {
          const name =
            spans.find((span) => span.serviceId === serviceId)?.serviceName ??
            serviceId;
          return `${name} → ${color}`;
        })
        .join(', ');
      parts.push(
        `each distinct serviceId gets the next palette color (${TOUR_SERVICE_COLORS.join(', ')}) — ${labels}`,
      );
    }
  }

  if (aspect === 'all' || aspect === 'clippedWeek') {
    const clipped = spans.filter(
      (span) =>
        span.tourStartDate < weekDateKeys[0] ||
        span.tourEndDate > weekDateKeys[6],
    );
    if (clipped.length === 0) {
      parts.push(
        `week ${weekLabel} shows full spans; tours starting before Monday or ending after Sunday are clipped to the visible Mon–Sun columns`,
      );
    } else {
      const examples = clipped
        .slice(0, 2)
        .map(
          (span) =>
            `${span.serviceName} stored ${formatSpanRange(span.tourStartDate, span.tourEndDate, locale)} clipped to cols ${span.colStart + 1}–${span.colEnd + 1}`,
        )
        .join('; ');
      parts.push(
        `tours extending beyond the visible week are clipped at week boundaries — ${examples}`,
      );
    }
  }

  if (aspect === 'all' || aspect === 'stackedDepartures') {
    const stacked = spans.filter((span) => span.lane > 0);
    const maxLane = spans.reduce((max, span) => Math.max(max, span.lane), 0);
    if (stacked.length === 0 && maxLane === 0) {
      parts.push(
        'overlapping tour spans stack on separate lanes (lane 0, 1, …) so same-day departures do not collide',
      );
    } else {
      const laneSummary = spans
        .slice(0, 4)
        .map((span) => `${span.serviceName} lane ${span.lane}`)
        .join(', ');
      parts.push(
        `overlapping column ranges assign stacked departure lanes — ${laneSummary}`,
      );
    }
  }

  return `Provider tour calendar (week ${weekLabel}) — ${parts.join('; ')}.`;
}

export async function handleExplainTourCalendarSpanLogic(
  deps: TourCalendarSpanLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainTourCalendarSpanFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_tour_calendar_span',
      'Ask how the provider calendar renders tour spans (e.g. "Why do tours span multiple days on the calendar?" or "How are tour service colors assigned?").',
      {
        clarify: true,
        missing: ['aspect'],
      },
    );
  }

  const bookings = await deps.bookingService.findAll(businessId);
  let tourBookings = bookings.filter(isTourBooking);

  if (parsed.serviceName) {
    const needle = parsed.serviceName.toLowerCase();
    tourBookings = tourBookings.filter((booking) =>
      (booking.service?.name ?? '').toLowerCase().includes(needle),
    );
  }

  if (parsed.serviceId) {
    tourBookings = tourBookings.filter(
      (booking) => booking.serviceId === parsed.serviceId,
    );
  }

  const weekAnchor = resolveWeekAnchor(parsed, tourBookings);
  const weekDateKeys = buildWeekDateKeys(weekAnchor);
  const calendarBookings = tourBookings.map(toCalendarWeekBooking);
  const spans = buildTourCalendarSpans(calendarBookings, weekDateKeys);
  const colorMap = buildServiceColorMap(spans.map((span) => span.serviceId));
  const locale = resolveExplainTourCalendarSpanLocale(params, prompt);

  const summary = buildAspectSummary(
    parsed.aspect,
    weekDateKeys,
    spans,
    colorMap,
    locale,
  );

  return success('explain_tour_calendar_span', summary, {
    aspect: parsed.aspect,
    weekStartDate: weekDateKeys[0],
    weekEndDate: weekDateKeys[6],
    serviceName: parsed.serviceName ?? null,
    serviceId: parsed.serviceId ?? null,
    spanCount: spans.length,
    spans: spans.map((span) => ({
      bookingId: span.bookingId,
      serviceId: span.serviceId,
      serviceName: span.serviceName,
      tourStartDate: span.tourStartDate,
      tourEndDate: span.tourEndDate,
      colStart: span.colStart,
      colEnd: span.colEnd,
      lane: span.lane,
      color: colorMap[span.serviceId] ?? null,
    })),
    serviceColors: colorMap,
  });
}
