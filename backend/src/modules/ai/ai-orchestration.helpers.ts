import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import {
  parseDateInput,
  toIsoDay,
  formatDateDisplay,
  formatTimeDisplay,
  getTodayDateKey,
  buildUtcStartTimeFromDayAndTime,
} from '../../common/utils/date-format.util.js';
import { normalizeTime24, timeToMinutes } from '../../common/utils/time-format.util.js';
import { addDaysToDateKey, resolveTimezone } from '../../common/utils/timezone.util.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface DateRange {
  start: string;
  end: string;
}

const MONTH_NAME_MAP: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
  september: 9, sep: 9, sept: 9, october: 10, oct: 10, november: 11, nov: 11,
  december: 12, dec: 12,
};

function inferYearForMonthDay(day: number, month: number, timeZone: string): number {
  const tz = resolveTimezone(timeZone);
  const todayKey = getTodayDateKey(tz);
  const today = dayjs.tz(todayKey, tz);
  let year = today.year();
  const candidate = dayjs.tz(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    tz,
  );
  if (candidate.isBefore(today, 'day')) year += 1;
  return year;
}

function buildIsoDay(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseMonthDayToken(token: string, timeZone: string): string | null {
  const trimmed = token.trim();
  const lower = trimmed.toLowerCase();

  const dayMonth = lower.match(/^(\d{1,2})(?:st|nd|rd|th)?(?:\s+of\s+|\s+)([a-z]+)(?:\s+(\d{4}))?$/);
  if (dayMonth) {
    const month = MONTH_NAME_MAP[dayMonth[2]];
    if (!month) return null;
    const day = parseInt(dayMonth[1], 10);
    const year = dayMonth[3] ? parseInt(dayMonth[3], 10) : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const monthDay = lower.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?$/);
  if (monthDay) {
    const month = MONTH_NAME_MAP[monthDay[1]];
    if (!month) return null;
    const day = parseInt(monthDay[2], 10);
    const year = monthDay[3] ? parseInt(monthDay[3], 10) : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const slash = trimmed.match(/^(\d{1,2})[/_](\d{1,2})(?:[/_](\d{2,4}))?$/);
  if (slash) {
    const day = parseInt(slash[1], 10);
    const month = parseInt(slash[2], 10);
    let year = slash[3] ? parseInt(slash[3], 10) : inferYearForMonthDay(day, month, timeZone);
    if (year < 100) year += 2000;
    return buildIsoDay(year, month, day);
  }

  return null;
}

/** Parse explicit date ranges from natural language (e.g. "June 2-June 10", "from 02/06 to 10/06"). */
export function extractDateRangeFromPrompt(prompt: string, timeZone = 'UTC'): DateRange | null {
  const lower = prompt.toLowerCase();

  const sameMonth = lower.match(
    /\b(?:from\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:-|–|to|through)\s*(?:\1\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/,
  );
  if (sameMonth) {
    const month = MONTH_NAME_MAP[sameMonth[1]];
    const startDay = parseInt(sameMonth[2], 10);
    const endDay = parseInt(sameMonth[3], 10);
    const year = inferYearForMonthDay(startDay, month, timeZone);
    return {
      start: buildIsoDay(year, month, startDay),
      end: buildIsoDay(year, month, endDay),
    };
  }

  const crossMonth = lower.match(
    /\bfrom\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:-|–|to|through)\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/,
  );
  if (crossMonth) {
    const startMonth = MONTH_NAME_MAP[crossMonth[1]];
    const endMonth = MONTH_NAME_MAP[crossMonth[3]];
    const startDay = parseInt(crossMonth[2], 10);
    const endDay = parseInt(crossMonth[4], 10);
    const startYear = inferYearForMonthDay(startDay, startMonth, timeZone);
    let endYear = startYear;
    if (endMonth < startMonth || (endMonth === startMonth && endDay < startDay)) {
      endYear += 1;
    }
    return {
      start: buildIsoDay(startYear, startMonth, startDay),
      end: buildIsoDay(endYear, endMonth, endDay),
    };
  }

  const numericRange = prompt.match(
    /\b(\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?)\s*(?:-|–|to|through)\s*(\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?)\b/i,
  );
  if (numericRange) {
    const start = parseMonthDayToken(numericRange[1], timeZone);
    const end = parseMonthDayToken(numericRange[2], timeZone);
    if (start && end) return { start, end };
  }

  return null;
}

/** Fill dateFrom/dateTo from prompt when the LLM only extracted the start date. */
export function enrichDateRangeFromPrompt(
  params: Record<string, any>,
  prompt: string,
  timeZone = 'UTC',
): void {
  if (params.dateFrom && params.dateTo) return;
  const range = extractDateRangeFromPrompt(prompt, timeZone);
  if (!range) return;
  params.dateFrom = formatDateDisplay(range.start);
  params.dateTo = formatDateDisplay(range.end);
}

export function normalizeEmployeeNameToken(name: string): string {
  return name
    .trim()
    .replace(/^both\s+/i, '')
    .replace(/^all\s+/i, '')
    .replace(/['']s$/i, '')
    .trim();
}

export function splitEmployeeNameList(input: string): string[] {
  return input
    .split(/[/,]|(?:\s+and\s+)|(?:\s+or\s+)/i)
    .map(normalizeEmployeeNameToken)
    .filter(Boolean);
}

export function getRequestedEmployeeNames(params: {
  employeeName?: string | null;
  employeeNames?: string[] | null;
  allProviders?: boolean | null;
}): string[] {
  if (params.allProviders) return [];
  if (params.employeeNames?.length) {
    return params.employeeNames.map(normalizeEmployeeNameToken).filter(Boolean);
  }
  if (params.employeeName) return splitEmployeeNameList(params.employeeName);
  return [];
}

export function fuzzyMatchByName<T extends { name: string }>(items: T[], name: string): T | undefined {
  const normalized = normalizeEmployeeNameToken(name);
  const lower = normalized.toLowerCase();
  if (!lower) return undefined;

  return (
    items.find((item) => item.name.toLowerCase() === lower) ||
    items.find((item) => item.name.toLowerCase().includes(lower)) ||
    items.find((item) => lower.includes(item.name.toLowerCase())) ||
    items.find((item) =>
      item.name
        .toLowerCase()
        .split(/\s+/)
        .some((part) => part === lower || part.startsWith(lower) || lower.startsWith(part)),
    )
  );
}

/** Collapse spaces/punctuation so "face massage" matches catalog "facemassage". */
export function normalizeServiceLookup(text: string): string {
  return text.toLowerCase().replace(/[\s_-]+/g, '');
}

export function fuzzyMatchServiceByName<T extends { name: string }>(
  items: T[],
  name: string,
): T | undefined {
  const lower = name.trim().toLowerCase();
  if (!lower) return undefined;
  const normalized = normalizeServiceLookup(lower);

  const exact = items.find((item) => item.name.toLowerCase() === lower);
  if (exact) return exact;

  const exactNorm = items.find((item) => normalizeServiceLookup(item.name) === normalized);
  if (exactNorm) return exactNorm;

  let best: T | undefined;
  let bestLen = 0;
  for (const item of items) {
    const normName = normalizeServiceLookup(item.name);
    if (
      normName.length >= 4 &&
      (normalized.includes(normName) || normName.includes(normalized))
    ) {
      if (normName.length > bestLen) {
        best = item;
        bestLen = normName.length;
      }
    }
  }
  if (best) return best;

  return (
    items.find((item) => item.name.toLowerCase().includes(lower)) ||
    items.find((item) => lower.includes(item.name.toLowerCase()))
  );
}

export function resolveEmployees(
  employees: Employee[],
  params: {
    employeeName?: string | null;
    employeeNames?: string[] | null;
    allProviders?: boolean | null;
  },
): Employee[] {
  if (params.allProviders) return employees;

  const names = getRequestedEmployeeNames(params);

  const resolved: Employee[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const emp = fuzzyMatchByName(employees, name);
    if (emp && !seen.has(emp.id)) {
      seen.add(emp.id);
      resolved.push(emp);
    }
  }
  return resolved;
}

export function resolveTemplate(
  templates: ScheduleTemplate[],
  name?: string | null,
): ScheduleTemplate | undefined {
  if (!name?.trim()) {
    return templates.find((t) => !t.isDeleted && t.isActive) ?? templates[0];
  }
  return fuzzyMatchByName(templates, name);
}

export function resolveServices(
  catalog: Service[],
  params: { serviceName?: string | null; serviceNames?: string[] | null },
): Service[] {
  const rawNames: string[] = [];
  if (params.serviceNames?.length) rawNames.push(...params.serviceNames);
  else if (params.serviceName) {
    rawNames.push(
      ...params.serviceName
        .split(/[/,]|(?:\s+and\s+)|(?:\s+or\s+)/i)
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  const resolved: Service[] = [];
  const seen = new Set<string>();
  for (const name of rawNames) {
    const svc = fuzzyMatchServiceByName(catalog, name);
    if (svc && !seen.has(svc.id)) {
      seen.add(svc.id);
      resolved.push(svc);
    }
  }
  return resolved;
}

export function getEmployeeServices(employee: Employee, catalog: Service[]): Service[] {
  if (employee.serviceIds?.length) {
    const allowed = new Set(employee.serviceIds);
    return catalog.filter((s) => allowed.has(s.id));
  }
  return catalog;
}

/** Services explicitly assigned on the employee profile (empty when none assigned). */
export function getEmployeeAssignedServices(employee: Employee, catalog: Service[]): Service[] {
  if (!employee.serviceIds?.length) {
    return [];
  }
  const allowed = new Set(employee.serviceIds);
  return catalog.filter((s) => allowed.has(s.id));
}

export function isProviderOwnServicesPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(his|her|their)\s+services?\b/i.test(lower) ||
    /\b(?:with|for)\s+(?:his|her|their)\s+services\b/i.test(lower) ||
    /\bprovider'?s?\s+services\b/i.test(lower) ||
    /\bassigned\s+services\b/i.test(lower)
  );
}

/** Services to attach to schedule periods — never the full catalog when the employee has assignments. */
export function resolveScheduleServicesForEmployee(
  employee: Employee,
  catalog: Service[],
  params: { serviceName?: string | null; serviceNames?: string[] | null },
  prompt?: string,
): Service[] {
  const assigned = getEmployeeAssignedServices(employee, catalog);
  const ownServicesPrompt = prompt ? isProviderOwnServicesPrompt(prompt) : false;
  const fromParams = resolveServices(catalog, params);

  if (ownServicesPrompt || fromParams.length === 0) {
    return assigned;
  }

  if (assigned.length === 0) {
    return fromParams;
  }

  return fromParams.filter((s) => assigned.some((a) => a.id === s.id));
}

/** Parse relative dates and ranges from prompt + params into ISO day range. */
export function resolveDateRange(
  params: {
    date?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    _timeZone?: string | null;
  },
  prompt?: string,
  timeZone?: string,
): DateRange | null {
  if (params.dateFrom && params.dateTo) {
    const tz = resolveTimezone(timeZone ?? params._timeZone ?? 'UTC');
    return {
      start: toIsoDay(params.dateFrom, tz),
      end: toIsoDay(params.dateTo, tz),
    };
  }

  const promptRange = extractDateRangeFromPrompt(prompt ?? '', timeZone ?? params._timeZone ?? 'UTC');
  if (promptRange) return promptRange;

  const tz = resolveTimezone(timeZone ?? params._timeZone ?? 'UTC');
  const lower = (prompt ?? '').toLowerCase();
  const todayKey = getTodayDateKey(tz);
  const today = dayjs.tz(todayKey, tz);

  const weekRange = (offsetWeeks = 0) => {
    const day = today.day();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = today.add(mondayOffset + offsetWeeks * 7, 'day');
    const end = start.add(6, 'day');
    return {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
    };
  };

  if (/\blast week\b/i.test(lower)) return weekRange(-1);
  if (/\bthis week\b/i.test(lower)) return weekRange(0);
  if (/\bnext week\b/i.test(lower)) return weekRange(1);

  if (/\bthis month\b/i.test(lower) || /\bcurrent month\b/i.test(lower)) {
    return {
      start: today.startOf('month').format('YYYY-MM-DD'),
      end: today.endOf('month').format('YYYY-MM-DD'),
    };
  }

  if (/\blast month\b/i.test(lower)) {
    const prev = today.subtract(1, 'month');
    return {
      start: prev.startOf('month').format('YYYY-MM-DD'),
      end: prev.endOf('month').format('YYYY-MM-DD'),
    };
  }

  const weekdayMap: Record<string, number> = {
    sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3, thursday: 4, thu: 4, thurs: 4,
    friday: 5, fri: 5, saturday: 6, sat: 6,
  };
  const nextDayMatch = lower.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/);
  if (nextDayMatch) {
    const target = weekdayMap[nextDayMatch[1]];
    const cur = today.day();
    let delta = (target - cur + 7) % 7;
    if (delta === 0) delta = 7;
    const iso = today.add(delta, 'day').format('YYYY-MM-DD');
    return { start: iso, end: iso };
  }

  if (/\btoday\b/i.test(lower) || /\btonight\b/i.test(lower)) {
    return { start: todayKey, end: todayKey };
  }
  if (/\btomorrow\b/i.test(lower)) {
    const iso = addDaysToDateKey(todayKey, 1, tz);
    return { start: iso, end: iso };
  }
  if (/\byesterday\b/i.test(lower)) {
    const iso = addDaysToDateKey(todayKey, -1, tz);
    return { start: iso, end: iso };
  }

  if (params.date) {
    const iso = toIsoDay(params.date, tz);
    return { start: iso, end: iso };
  }

  return null;
}

/** Extract single date hint from prompt for params.date (display format). */
export function extractSingleDateFromPrompt(prompt: string, timeZone = 'UTC'): string | null {
  const range = resolveDateRange({ _timeZone: timeZone }, prompt, timeZone);
  if (!range || range.start !== range.end) return null;
  return formatDateDisplay(range.start);
}

export function enumerateDaysInRange(range: DateRange): Date[] {
  const start = parseDateInput(range.start);
  const end = parseDateInput(range.end);
  if (!start || !end) return [];

  const days: Date[] = [];
  const cur = new Date(start);
  cur.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setUTCHours(0, 0, 0, 0);

  while (cur <= endDay) {
    days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

export function parseWeekdaysFromParams(
  params: { applyDays?: number[] | null; weekdays?: string[] | null },
  prompt?: string,
): number[] {
  if (params.applyDays?.length) return params.applyDays;

  const text = [
    ...(params.weekdays ?? []),
    prompt ?? '',
  ].join(' ').toLowerCase();

  const map: Record<string, number> = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thur: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
  };

  const found = new Set<number>();
  for (const [key, val] of Object.entries(map)) {
    if (text.includes(key)) found.add(val);
  }

  if (found.size > 0) return [...found].sort();

  if (text.includes('weekday') || text.includes('weekdays')) {
    return [1, 2, 3, 4, 5];
  }
  if (text.includes('weekend')) return [0, 6];

  return [0, 1, 2, 3, 4, 5, 6];
}

const TIME_RANGE_IN_PROMPT =
  /(?:between\s+)?\d{1,2}(?::\d{2})?\s*[-–]\s*\d{1,2}(?::\d{2})?/i;

export function hasExplicitTimeWindow(
  params: { timeFrom?: string | null; timeTo?: string | null },
  prompt?: string,
): boolean {
  if (params.timeFrom && params.timeTo) return true;
  return TIME_RANGE_IN_PROMPT.test(prompt ?? '');
}

export function parseTimeWindow(
  params: { timeFrom?: string | null; timeTo?: string | null },
  prompt?: string,
  defaults = { timeFrom: '09:00', timeTo: '19:00' },
): { timeFrom: string; timeTo: string } {
  if (params.timeFrom && params.timeTo) {
    return {
      timeFrom: normalizeTime24(params.timeFrom),
      timeTo: normalizeTime24(params.timeTo),
    };
  }

  const match = (prompt ?? '').match(
    /(?:between\s+)?(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?/i,
  );
  if (match) {
    const timeFrom = normalizeTime24(`${match[1]}:${match[2] ?? '00'}`);
    const timeTo = normalizeTime24(`${match[3]}:${match[4] ?? '00'}`);
    if (timeToMinutes(timeTo) > timeToMinutes(timeFrom)) {
      return { timeFrom, timeTo };
    }
  }

  return defaults;
}

export function bookingOverlapsTimeWindow(
  booking: { startTime: Date; endTime: Date },
  isoDay: string,
  timeFrom: string,
  timeTo: string,
): boolean {
  const windowStart = new Date(buildUtcStartTimeFromDayAndTime(isoDay, timeFrom));
  const windowEnd = new Date(buildUtcStartTimeFromDayAndTime(isoDay, timeTo));
  const start =
    booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
  const end = booking.endTime instanceof Date ? booking.endTime : new Date(booking.endTime);
  return start < windowEnd && end > windowStart;
}

/** Narrow bookings to an explicit timeSlot or timeFrom–timeTo window (overlap, not start-only). */
export function filterBookingsByTimeConstraints<T extends { startTime: Date; endTime: Date }>(
  bookings: T[],
  params: {
    timeSlot?: string | null;
    timeFrom?: string | null;
    timeTo?: string | null;
    date?: string | null;
    _timeZone?: string;
  },
  prompt?: string,
): T[] {
  if (hasExplicitTimeWindow(params, prompt)) {
    const window = parseTimeWindow(params, prompt);
    return bookings.filter((b) => {
      const start =
        b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
      const isoDay = start.toISOString().split('T')[0];
      return bookingOverlapsTimeWindow(b, isoDay, window.timeFrom, window.timeTo);
    });
  }

  if (params.timeSlot) {
    const slot = normalizeTime24(params.timeSlot);
    return bookings.filter((b) => formatTimeDisplay(b.startTime) === slot);
  }

  return bookings;
}

export function isScheduleTemplateCreationPrompt(prompt?: string): boolean {
  return /\bcreate\b[\s\S]{0,80}\b(?:schedule\s+)?template\b/i.test(prompt ?? '');
}

/** cleanup / clear / wipe / reset provider schedule (not appointments). */
export function isClearSchedulePrompt(prompt?: string): boolean {
  const lower = (prompt ?? '').toLowerCase();
  if (!/\bschedule\b/.test(lower)) return false;
  if (/\b(from calendar|appointment|booking)s?\b/.test(lower) && !/\bschedule\b/.test(lower)) {
    return false;
  }
  return (
    /\b(clean\s*up|clear|reset|wipe)\b/.test(lower) ||
    (/\bremove\b/.test(lower) && !/\b(from calendar|appointment|booking)/.test(lower))
  );
}

export function isFullDayBlock(params: { blockFullDay?: boolean | null }, prompt?: string): boolean {
  if (params.blockFullDay) return true;
  const lower = (prompt ?? '').toLowerCase();
  return (
    lower.includes('full day') ||
    lower.includes('entire day') ||
    lower.includes('whole day') ||
    lower.includes('block the day') ||
    !!lower.match(/block\s+\d{1,2}[/_]\d{1,2}[/_]\d{4}\s*(entirely|completely)?/)
  );
}

export function shouldAutoExecute(action: string, stepCount: number, providerCount: number): boolean {
  const readOnly = [
    'list_bookings', 'show_appointments', 'check_availability', 'summarize_day',
    'summarize_bookings', 'list_services', 'analyze_services', 'summarize_staff',
    'lookup_customer', 'summarize_waitlist', 'lookup_service_assignment', 'list_employees', 'list_templates', 'optimize_schedule',
    'summarize_utilization', 'list_schedule_gaps', 'summarize_customers',
    'analyze_appointments', 'resolve_conflicts', 'reassign_cancelled',
  ];
  if (readOnly.includes(action)) return false;

  if (providerCount > 1 || stepCount > 3) return false;
  return true;
}

/** ai-i4: combine heuristic auto-execute with LLM confidence thresholds */
export function resolveAutoExecute(params: {
  action: string;
  stepCount: number;
  providerCount: number;
  confidence?: number;
  thresholds?: { low: number; high: number };
}): boolean {
  if (params.confidence != null && params.thresholds) {
    if (params.confidence < params.thresholds.low) return false;
    if (params.confidence < params.thresholds.high) return false;
  }
  return shouldAutoExecute(params.action, params.stepCount, params.providerCount);
}
