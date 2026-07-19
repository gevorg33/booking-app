import type { BookingService } from '../booking/booking.service.js';
import type { EmployeeService } from '../employee/employee.service.js';
import type { ServiceService } from '../service/service.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  formatDateDisplay,
  getTodayDateKey,
} from '../../common/utils/date-format.util.js';
import {
  buildWeekDateKeys,
  resolveTourBookingDateRange,
} from '../../common/utils/tour-calendar.util.js';
import {
  extractTourBookingMetadata,
  isTourService,
  resolveTourCatalogServiceByName,
} from '../../common/utils/tour-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseListTourCalendarWeekFromPrompt,
  type ParsedListTourCalendarWeek,
} from './ai-tour-calendar-week.util.js';

export interface TourCalendarWeekLogicDeps {
  bookingService: Pick<BookingService, 'findAll'>;
  serviceService: Pick<ServiceService, 'findAll'>;
  employeeService: Pick<EmployeeService, 'findAll'>;
}

const CONFIRMED_TOUR_STATUSES = new Set<BookingStatus>([
  BookingStatus.CONFIRMED,
]);

export interface TourCalendarWeekEntry {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  tourStartDate: string;
  tourEndDate: string;
  paxCount: number;
  customerName: string | null;
  employeeId: string | null;
  employeeName: string | null;
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

function resolveEmployeeByName<T extends { id: string; name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

function formatDateRange(start: string, end: string): string {
  const startLabel = formatDateDisplay(start);
  const endLabel = formatDateDisplay(end);
  return start === end ? startLabel : `${startLabel}–${endLabel}`;
}

function formatEntryLine(entry: TourCalendarWeekEntry): string {
  return `${formatDateRange(entry.tourStartDate, entry.tourEndDate)}: ${entry.serviceName} — ${entry.paxCount} pax`;
}

function buildSummary(
  parsed: ParsedListTourCalendarWeek,
  weekStart: string,
  weekEnd: string,
  entries: TourCalendarWeekEntry[],
  employeeLabel: string | null,
): string {
  const weekLabel = `${formatDateDisplay(weekStart)}–${formatDateDisplay(weekEnd)}`;
  const providerNote = employeeLabel ? ` for ${employeeLabel}` : '';
  const filterNote = parsed.serviceName ? ` (${parsed.serviceName})` : '';

  if (entries.length === 0) {
    return `No confirmed tour departures visible on the provider calendar week ${weekLabel}${providerNote}${filterNote}.`;
  }

  return `${entries.length} tour departure${entries.length === 1 ? '' : 's'} on calendar week ${weekLabel}${providerNote}${filterNote}: ${entries.map(formatEntryLine).join('; ')}.`;
}

export async function handleListTourCalendarWeekLogic(
  deps: TourCalendarWeekLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseListTourCalendarWeekFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'list_tour_calendar_week',
      'Ask to list tour departures on the provider calendar week (e.g. "List tour departures on the provider calendar this week" or "Summarize Maria\'s calendar week tours with pax").',
      { clarify: true },
    );
  }

  const weekAnchor = parsed.weekStartDate ?? getTodayDateKey();
  const weekDateKeys = buildWeekDateKeys(weekAnchor);
  const weekStart = weekDateKeys[0];
  const weekEnd = weekDateKeys[6];

  let employeeId = parsed.employeeId;
  let employeeLabel: string | null = parsed.employeeName ?? null;

  if (!employeeId && parsed.employeeName) {
    const employees = await deps.employeeService.findAll(businessId);
    const match = resolveEmployeeByName(employees, parsed.employeeName);
    if (!match) {
      return failure(
        'list_tour_calendar_week',
        `Could not find provider "${parsed.employeeName}" for calendar week tour list.`,
        {
          employeeName: parsed.employeeName,
          clarify: true,
        },
      );
    }
    employeeId = match.id;
    employeeLabel = match.name;
  }

  const allServices = await deps.serviceService.findAll(businessId);
  const tourServices = allServices.filter((service) =>
    isTourService((service.metadata ?? {}) as Record<string, unknown>),
  );

  let scopedServiceIds: Set<string> | null = null;
  if (parsed.serviceId) {
    scopedServiceIds = new Set([parsed.serviceId]);
  } else if (parsed.serviceName) {
    const match = resolveTourCatalogServiceByName(
      tourServices,
      parsed.serviceName,
    );
    scopedServiceIds = match ? new Set([match.id]) : new Set();
  }

  const tourServiceIds = new Set(
    (scopedServiceIds && scopedServiceIds.size > 0
      ? tourServices.filter((service) => scopedServiceIds.has(service.id))
      : tourServices
    ).map((service) => service.id),
  );

  const bookings = await deps.bookingService.findAll(
    businessId,
    undefined,
    employeeId,
    false,
    weekStart,
    weekEnd,
  );

  const entries: TourCalendarWeekEntry[] = bookings
    .filter((booking) => {
      if (!CONFIRMED_TOUR_STATUSES.has(booking.status)) return false;
      const isTour =
        tourServiceIds.has(booking.serviceId) ||
        isTourService(booking.service?.metadata ?? null) ||
        Boolean(extractTourBookingMetadata(booking.metadata).tourStartDate);
      if (!isTour) return false;
      if (scopedServiceIds && !scopedServiceIds.has(booking.serviceId)) {
        return false;
      }
      const range = resolveTourBookingDateRange({
        metadata: booking.metadata,
        startTime: booking.startTime,
      });
      if (range) {
        return range.tourEndDate >= weekStart && range.tourStartDate <= weekEnd;
      }
      const dayKey = booking.startTime.toISOString().slice(0, 10);
      return dayKey >= weekStart && dayKey <= weekEnd;
    })
    .map((booking) => {
      const tourMeta = extractTourBookingMetadata(booking.metadata);
      const range = resolveTourBookingDateRange({
        metadata: booking.metadata,
        startTime: booking.startTime,
      }) ?? {
        tourStartDate: booking.startTime.toISOString().slice(0, 10),
        tourEndDate: booking.endTime.toISOString().slice(0, 10),
      };
      return {
        bookingId: booking.id,
        serviceId: booking.serviceId,
        serviceName: booking.service?.name ?? 'Tour',
        tourStartDate: range.tourStartDate,
        tourEndDate: range.tourEndDate,
        paxCount: tourMeta.paxCount ?? 1,
        customerName: booking.customer?.name ?? null,
        employeeId: booking.employeeId ?? null,
        employeeName: booking.employee?.name ?? null,
      };
    })
    .sort((a, b) =>
      a.tourStartDate === b.tourStartDate
        ? a.serviceName.localeCompare(b.serviceName)
        : a.tourStartDate.localeCompare(b.tourStartDate),
    );

  const summary = buildSummary(
    parsed,
    weekStart,
    weekEnd,
    entries,
    employeeLabel,
  );

  return success('list_tour_calendar_week', summary, {
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    employeeName: employeeLabel,
    employeeId: employeeId ?? null,
    serviceName: parsed.serviceName ?? null,
    serviceId: parsed.serviceId ?? null,
    entries,
    departureCount: entries.length,
    totalPax: entries.reduce((sum, entry) => sum + entry.paxCount, 0),
  });
}
