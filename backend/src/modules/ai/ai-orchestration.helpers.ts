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
  applyRelativeDateFromPrompt,
} from '../../common/utils/date-format.util.js';
import {
  normalizeTime24,
  timeToMinutes,
} from '../../common/utils/time-format.util.js';
import {
  addDaysToDateKey,
  resolveTimezone,
} from '../../common/utils/timezone.util.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import {
  normalizeAvailabilityWindows,
  type AvailabilityWindow,
} from './ai-flexible-availability.util.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface DateRange {
  start: string;
  end: string;
}

const MONTH_NAME_MAP: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function inferYearForMonthDay(
  day: number,
  month: number,
  timeZone: string,
): number {
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

  const dayMonth = lower.match(
    /^(\d{1,2})(?:st|nd|rd|th)?(?:\s+of\s+|\s+)([a-z]+)(?:\s+(\d{4}))?$/,
  );
  if (dayMonth) {
    const month = MONTH_NAME_MAP[dayMonth[2]];
    if (!month) return null;
    const day = parseInt(dayMonth[1], 10);
    const year = dayMonth[3]
      ? parseInt(dayMonth[3], 10)
      : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const monthDay = lower.match(
    /^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?$/,
  );
  if (monthDay) {
    const month = MONTH_NAME_MAP[monthDay[1]];
    if (!month) return null;
    const day = parseInt(monthDay[2], 10);
    const year = monthDay[3]
      ? parseInt(monthDay[3], 10)
      : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const slash = trimmed.match(/^(\d{1,2})[/_](\d{1,2})(?:[/_](\d{2,4}))?$/);
  if (slash) {
    const day = parseInt(slash[1], 10);
    const month = parseInt(slash[2], 10);
    let year = slash[3]
      ? parseInt(slash[3], 10)
      : inferYearForMonthDay(day, month, timeZone);
    if (year < 100) year += 2000;
    return buildIsoDay(year, month, day);
  }

  return null;
}

/** Parse explicit date ranges from natural language (e.g. "June 2-June 10", "from 02/06 to 10/06"). */
export function extractDateRangeFromPrompt(
  prompt: string,
  timeZone = 'UTC',
): DateRange | null {
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
    if (
      endMonth < startMonth ||
      (endMonth === startMonth && endDay < startDay)
    ) {
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

/** Single calendar day from prompt (e.g. "on June 5th", "05/06/2026") — not ranges. */
export function extractSingleIsoDayFromPrompt(
  prompt: string,
  timeZone = 'UTC',
): string | null {
  const range = extractDateRangeFromPrompt(prompt, timeZone);
  if (range) {
    return range.start === range.end ? range.start : null;
  }

  const lower = prompt.toLowerCase();
  const monthDayRe =
    /\b(?:(?:on|for)\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?\b/;
  const monthDayMatch = lower.match(monthDayRe);
  if (monthDayMatch) {
    const month = MONTH_NAME_MAP[monthDayMatch[1]];
    const day = parseInt(monthDayMatch[2], 10);
    const year = monthDayMatch[3]
      ? parseInt(monthDayMatch[3], 10)
      : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const dayMonthRe =
    /\b(\d{1,2})(?:st|nd|rd|th)?(?:\s+of\s+|\s+)(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+(\d{4}))?\b/;
  const dayMonthMatch = lower.match(dayMonthRe);
  if (dayMonthMatch) {
    const month = MONTH_NAME_MAP[dayMonthMatch[2]];
    const day = parseInt(dayMonthMatch[1], 10);
    const year = dayMonthMatch[3]
      ? parseInt(dayMonthMatch[3], 10)
      : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const numeric = prompt.match(/\b(\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?)\b/);
  if (numeric) {
    return parseMonthDayToken(numeric[1], timeZone);
  }

  const tz = resolveTimezone(timeZone);
  const todayKey = getTodayDateKey(tz);
  const today = dayjs.tz(todayKey, tz);
  const weekdayMap: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    tues: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    thurs: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };
  const nextDayMatch = lower.match(
    /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/,
  );
  if (nextDayMatch) {
    const target = weekdayMap[nextDayMatch[1]];
    const cur = today.day();
    let delta = (target - cur + 7) % 7;
    if (delta === 0) delta = 7;
    return today.add(delta, 'day').format('YYYY-MM-DD');
  }

  const bareDayMatch = lower.match(
    /\b(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/,
  );
  if (bareDayMatch) {
    const target = weekdayMap[bareDayMatch[1]];
    const cur = today.day();
    const delta = (target - cur + 7) % 7;
    return today.add(delta, 'day').format('YYYY-MM-DD');
  }

  return null;
}

/**
 * When the prompt names one explicit day, override session date ranges (e.g. stale "this week").
 */
export function applyPromptDateOverride(
  params: Record<string, any>,
  prompt?: string,
  timeZone = 'UTC',
): void {
  if (!prompt?.trim()) return;

  applyRelativeDateFromPrompt(params, prompt, timeZone);

  const singleIso = extractSingleIsoDayFromPrompt(prompt, timeZone);
  if (singleIso) {
    const display = formatDateDisplay(singleIso);
    params.date = display;
    params.dateFrom = display;
    params.dateTo = display;
    return;
  }

  const range = extractDateRangeFromPrompt(prompt, timeZone);
  if (range) {
    params.dateFrom = formatDateDisplay(range.start);
    params.dateTo = formatDateDisplay(range.end);
    if (range.start === range.end) {
      params.date = formatDateDisplay(range.start);
    }
  }
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

export function fuzzyMatchByName<T extends { name: string }>(
  items: T[],
  name: string,
): T | undefined {
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
        .some(
          (part) =>
            part === lower || part.startsWith(lower) || lower.startsWith(part),
        ),
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

  const exactNorm = items.find(
    (item) => normalizeServiceLookup(item.name) === normalized,
  );
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

const SERVICE_ROLE_WORDS =
  /\b(?:specialists?|therapists?|providers?|stylists?|masseurs?|doctors?|professionals?)\b/gi;
const SERVICE_QUALITY_WORDS =
  /\b(?:best|top|highest(?:\s+-?\s*rated)?|highly\s+rated|recommended?)\b/gi;

/** Remove role/quality words so "massage specialist" → "massage". */
export function stripServiceRoleNoise(query: string): string {
  return query
    .replace(SERVICE_ROLE_WORDS, ' ')
    .replace(SERVICE_QUALITY_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match one or many catalog services from a customer query.
 * Broad tokens like "massage" return every service whose name contains that token.
 */
export function matchServicesByQuery<T extends { id: string; name: string }>(
  items: T[],
  query: string,
): T[] {
  const cleaned = stripServiceRoleNoise(query);
  if (!cleaned) return [];

  const normalizedQuery = normalizeServiceLookup(cleaned);
  if (normalizedQuery.length < 3) return [];

  const tokenMatches = items.filter((item) =>
    normalizeServiceLookup(item.name).includes(normalizedQuery),
  );

  const queryWords = cleaned
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const isSingleBroadToken = queryWords.length === 1;

  if (tokenMatches.length > 1 && isSingleBroadToken) {
    return [...tokenMatches].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (queryWords.length > 1 && tokenMatches.length > 1) {
    const wordMatches = tokenMatches.filter((item) => {
      const norm = normalizeServiceLookup(item.name);
      return queryWords.every((word) =>
        norm.includes(normalizeServiceLookup(word)),
      );
    });
    if (wordMatches.length > 1) {
      return [...wordMatches].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  const exact = fuzzyMatchServiceByName(items, cleaned);
  if (exact) return [exact];

  if (tokenMatches.length > 0) {
    return [...tokenMatches].sort((a, b) => a.name.localeCompare(b.name));
  }

  return [];
}

/** Extract service(s) from top-rated / recommend specialist prompts. */
export function extractRecommendServicesFromPrompt<
  T extends { id: string; name: string },
>(prompt: string, services: T[]): T[] {
  const patterns = [
    /\b(?:who\s+is\s+)?(?:the\s+)?(?:best|top|highest(?:\s+-?\s*rated)?)\s+(.+?)(?:\s+specialists?|\s+therapists?|\?|$)/i,
    /\b(?:suggest|recommend)\s+(?:\w+\s+){0,4}(?:specialists?|therapists?)\s+(?:for|for\s+a)?\s+(.+?)(?:\?|$)/i,
    /\b(?:best|top|highest(?:\s+-?\s*rated)?)\s+(.+?)\s*$/i,
    /\b(?:specialists?|therapists?)\s+(?:for|for\s+a)\s+(.+?)(?:\?|$)/i,
  ];

  for (const re of patterns) {
    const match = prompt.match(re);
    if (match?.[1]) {
      const found = matchServicesByQuery(services, match[1].trim());
      if (found.length) return found;
    }
  }

  const single = fuzzyMatchServiceByName(
    services,
    stripServiceRoleNoise(prompt),
  );
  if (single) {
    const broad = matchServicesByQuery(services, single.name);
    return broad.length ? broad : [single];
  }

  return matchServicesByQuery(services, prompt);
}

export function inferServiceGroupLabel(
  services: Array<{ name: string }>,
  query?: string,
): string {
  if (services.length === 1) return services[0].name;

  const cleaned = query ? stripServiceRoleNoise(query) : '';
  const normalizedQuery = cleaned ? normalizeServiceLookup(cleaned) : '';
  if (
    normalizedQuery.length >= 4 &&
    services.every((s) =>
      normalizeServiceLookup(s.name).includes(normalizedQuery),
    )
  ) {
    return `${cleaned} services`;
  }

  return `${services.length} services`;
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

type CatalogServiceRow = {
  id: string;
  name: string;
  category?: { name: string } | null;
};

function matchServicesByCatalogCategoryName<T extends CatalogServiceRow>(
  catalog: T[],
  query: string,
): T[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];
  return catalog.filter((item) => item.category?.name?.toLowerCase() === lower);
}

/**
 * Match catalog service types from list/check/recommend params.
 * `serviceCategory` is a keyword on service TYPE NAMES (e.g. "massage" → Swedish massage),
 * not a requirement for a ServiceCategory entity named "Massage".
 * Falls back to exact catalog category name only when no service name matches exist.
 */
export function resolveServicesFromCatalogParams<
  T extends CatalogServiceRow,
>(
  catalog: T[],
  params: {
    serviceCategory?: string | null;
    serviceName?: string | null;
    serviceNames?: string[] | null;
  },
): T[] {
  if (Array.isArray(params.serviceNames) && params.serviceNames.length) {
    const matched: T[] = [];
    const seen = new Set<string>();
    for (const name of params.serviceNames) {
      if (typeof name !== 'string') continue;
      const svc = fuzzyMatchServiceByName(catalog, name);
      if (svc && !seen.has(svc.id)) {
        seen.add(svc.id);
        matched.push(svc);
      }
    }
    if (matched.length) return matched;
  }

  const keyword = params.serviceCategory ?? params.serviceName;
  if (keyword) {
    const byServiceTypeName = matchServicesByQuery(catalog, String(keyword));
    if (byServiceTypeName.length > 0) return byServiceTypeName;
    return matchServicesByCatalogCategoryName(catalog, String(keyword));
  }

  return [];
}

/** Extract a service-type keyword from "what kinds of massage do you have?" prompts. */
export function extractServiceTypeKeywordFromListPrompt(
  prompt: string,
): string | null {
  const patterns = [
    /\b(?:what|which)\s+(?:kind|type|sort)s?\s+of\s+([a-z][\w\s-]{1,30}?)(?:\s+do\s+you|\s+you\s+(?:have|offer)|\?|$)/i,
    /\b(?:what|which)\s+([a-z][\w\s-]{1,30}?)\s+(?:service\s+)?types?\s+(?:do\s+you\s+)?(?:have|offer)/i,
    /\b(?:what|which)\s+([a-z][\w\s-]{1,30}?)\s+(?:services?|options?)\s+(?:do\s+you\s+)?(?:have|offer)/i,
    /\blist\s+(?:all\s+)?([a-z][\w\s-]{1,30}?)\s+(?:service\s+)?types?\b/i,
  ];

  for (const re of patterns) {
    const match = prompt.match(re);
    const raw = match?.[1]?.trim();
    if (!raw) continue;
    const cleaned = stripServiceRoleNoise(
      raw.replace(/\s+(services?|types?)$/i, '').trim(),
    );
    if (cleaned.length >= 3) return cleaned;
  }

  return null;
}

export function enrichListServicesParamsFromPrompt(
  prompt: string,
  params: {
    serviceCategory?: string | null;
    serviceName?: string | null;
    serviceNames?: string[] | null;
  },
): {
  serviceCategory?: string | null;
  serviceName?: string | null;
  serviceNames?: string[] | null;
} {
  const hasFilter = !!(
    params.serviceCategory ||
    params.serviceName ||
    (Array.isArray(params.serviceNames) && params.serviceNames.length)
  );
  if (hasFilter) return params;

  const keyword = extractServiceTypeKeywordFromListPrompt(prompt);
  if (!keyword) return params;
  return { ...params, serviceCategory: keyword };
}

/** Only persist service filters that resolve against the live catalog (public assistant session). */
export function resolvePublicAssistantSessionServiceFields(
  params: {
    serviceName?: string | null;
    serviceCategory?: string | null;
  },
  catalog: Array<{ id: string; name: string }>,
): { serviceName: string | null; serviceCategory: string | null } {
  const serviceName = params.serviceName?.trim() || null;
  const serviceCategory = params.serviceCategory?.trim() || null;

  if (serviceName) {
    const match = fuzzyMatchServiceByName(catalog, serviceName);
    if (match) {
      return { serviceName: match.name, serviceCategory: null };
    }
    if (
      serviceCategory &&
      resolveServicesFromCatalogParams(catalog, { serviceCategory }).length > 0
    ) {
      return { serviceName: null, serviceCategory };
    }
    return { serviceName: null, serviceCategory: null };
  }

  if (
    serviceCategory &&
    resolveServicesFromCatalogParams(catalog, { serviceCategory }).length > 0
  ) {
    return { serviceName: null, serviceCategory };
  }

  return { serviceName: null, serviceCategory: null };
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

export function getEmployeeServices(
  employee: Employee,
  catalog: Service[],
): Service[] {
  if (employee.serviceIds?.length) {
    const allowed = new Set(employee.serviceIds);
    return catalog.filter((s) => allowed.has(s.id));
  }
  return catalog;
}

/** Services explicitly assigned on the employee profile (empty when none assigned). */
export function getEmployeeAssignedServices(
  employee: Employee,
  catalog: Service[],
): Service[] {
  if (!employee.serviceIds?.length) {
    return [];
  }
  const allowed = new Set(employee.serviceIds);
  return catalog.filter((s) => allowed.has(s.id));
}

/** Attach only services assigned to the provider on service_block periods. */
export function resolveDirectSchedulePeriodServiceIds(
  period: { type?: string; serviceIds?: string[] | null },
  employeeServiceIds: string[] | null | undefined,
): string[] {
  if (period.type === 'unavailable_block') return [];

  const periodIds = [...new Set((period.serviceIds ?? []).filter(Boolean))];
  const assigned = [...new Set((employeeServiceIds ?? []).filter(Boolean))];

  if (assigned.length === 0) return periodIds;
  if (periodIds.length === 0) return assigned;

  const allowed = new Set(assigned);
  const filtered = periodIds.filter((id) => allowed.has(id));
  return filtered.length > 0 ? filtered : assigned;
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
  const ownServicesPrompt = prompt
    ? isProviderOwnServicesPrompt(prompt)
    : false;
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
  const tz = resolveTimezone(timeZone ?? params._timeZone ?? 'UTC');
  const promptSingle = extractSingleIsoDayFromPrompt(prompt ?? '', tz);
  if (promptSingle) {
    return { start: promptSingle, end: promptSingle };
  }

  if (params.dateFrom && params.dateTo) {
    return {
      start: toIsoDay(params.dateFrom, tz),
      end: toIsoDay(params.dateTo, tz),
    };
  }

  const promptRange = extractDateRangeFromPrompt(prompt ?? '', tz);
  if (promptRange) return promptRange;

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

  const namedMonth = lower.match(
    /\b(?:on|in|for|during)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/,
  );
  if (namedMonth) {
    const month = MONTH_NAME_MAP[namedMonth[1]];
    const year = inferYearForMonthDay(1, month, tz);
    const monthStart = dayjs.tz(
      `${year}-${String(month).padStart(2, '0')}-01`,
      tz,
    );
    return {
      start: monthStart.startOf('month').format('YYYY-MM-DD'),
      end: monthStart.endOf('month').format('YYYY-MM-DD'),
    };
  }

  const weekdayMap: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    tues: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    thurs: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };
  const nextDayMatch = lower.match(
    /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/,
  );
  if (nextDayMatch) {
    const target = weekdayMap[nextDayMatch[1]];
    const cur = today.day();
    let delta = (target - cur + 7) % 7;
    if (delta === 0) delta = 7;
    const iso = today.add(delta, 'day').format('YYYY-MM-DD');
    return { start: iso, end: iso };
  }

  const bareDayMatch = lower.match(
    /\b(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/,
  );
  if (bareDayMatch) {
    const target = weekdayMap[bareDayMatch[1]];
    const cur = today.day();
    const delta = (target - cur + 7) % 7;
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

  if (/\ball[\s-]?(?:time|times)\b/i.test(lower)) {
    return {
      start: today.subtract(10, 'year').format('YYYY-MM-DD'),
      end: todayKey,
    };
  }

  if (params.date) {
    const iso = toIsoDay(params.date, tz);
    return { start: iso, end: iso };
  }

  return null;
}

/** Extract single date hint from prompt for params.date (display format). */
export function extractSingleDateFromPrompt(
  prompt: string,
  timeZone = 'UTC',
): string | null {
  const iso = extractSingleIsoDayFromPrompt(prompt, timeZone);
  return iso ? formatDateDisplay(iso) : null;
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

/** Expand params + prompt into ISO day keys; prompt ranges beat a lone params.date from the LLM. */
export function resolveScheduleDates(
  params: Record<string, any>,
  prompt?: string,
): string[] {
  const timeZone = params._timeZone ?? 'UTC';
  const promptSingle = extractSingleIsoDayFromPrompt(prompt ?? '', timeZone);
  if (promptSingle) {
    return [promptSingle];
  }

  const promptRange = extractDateRangeFromPrompt(prompt ?? '', timeZone);
  if (promptRange) {
    return enumerateDaysInRange(promptRange).map(
      (d) => d.toISOString().split('T')[0],
    );
  }
  if (params.dateFrom && params.dateTo) {
    const range = resolveDateRange(params, prompt, timeZone);
    if (range) {
      return enumerateDaysInRange(range).map(
        (d) => d.toISOString().split('T')[0],
      );
    }
  }
  const range = resolveDateRange(params, prompt, timeZone);
  if (range) {
    return enumerateDaysInRange(range).map(
      (d) => d.toISOString().split('T')[0],
    );
  }
  if (params.date) {
    return [toIsoDay(params.date, timeZone)];
  }
  return [];
}

/** ISO day keys for direct schedule workflow steps (single day, list, or range). */
export function resolveDirectScheduleDateKeys(
  params: Record<string, unknown>,
): string[] {
  const listed = params.dates;
  if (Array.isArray(listed) && listed.length > 0) {
    return listed.map((d) => String(d).trim()).filter(Boolean);
  }

  const range = params.dateRange as DateRange | undefined;
  if (range?.start && range?.end) {
    return enumerateDaysInRange(range).map(
      (d) => d.toISOString().split('T')[0],
    );
  }

  if (params.dateFrom && params.dateTo) {
    return enumerateDaysInRange({
      start: String(params.dateFrom),
      end: String(params.dateTo),
    }).map((d) => d.toISOString().split('T')[0]);
  }

  if (params.date) {
    const iso = toIsoDay(String(params.date));
    return iso ? [iso] : [];
  }

  return [];
}

export function parseWeekdaysFromParams(
  params: { applyDays?: number[] | null; weekdays?: string[] | null },
  prompt?: string,
): number[] {
  if (params.applyDays?.length) return params.applyDays;

  const text = [...(params.weekdays ?? []), prompt ?? '']
    .join(' ')
    .toLowerCase();

  const map: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    tues: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    thur: 4,
    thurs: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
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

/** Earliest bookable time from phrasing like "after 16:00" or "from 16:00 onwards". */
export function parseEarliestBookingTimeFromPrompt(
  prompt: string,
): string | null {
  const after = prompt.match(/\bafter\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (after) return normalizeTime24(`${after[1]}:${after[2] ?? '00'}`);

  const fromOnwards = prompt.match(
    /\bfrom\s+(\d{1,2})(?::(\d{2}))?\s+onwards\b/i,
  );
  if (fromOnwards)
    return normalizeTime24(`${fromOnwards[1]}:${fromOnwards[2] ?? '00'}`);

  return null;
}

export function bookingOverlapsTimeWindow(
  booking: { startTime: Date; endTime: Date },
  isoDay: string,
  timeFrom: string,
  timeTo: string,
): boolean {
  const windowStart = new Date(
    buildUtcStartTimeFromDayAndTime(isoDay, timeFrom),
  );
  const windowEnd = new Date(buildUtcStartTimeFromDayAndTime(isoDay, timeTo));
  const start =
    booking.startTime instanceof Date
      ? booking.startTime
      : new Date(booking.startTime);
  const end =
    booking.endTime instanceof Date
      ? booking.endTime
      : new Date(booking.endTime);
  return start < windowEnd && end > windowStart;
}

/** Narrow bookings to an explicit timeSlot or timeFrom–timeTo window (overlap, not start-only). */
export function filterBookingsByTimeConstraints<
  T extends { startTime: Date; endTime: Date },
>(
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
      return bookingOverlapsTimeWindow(
        b,
        isoDay,
        window.timeFrom,
        window.timeTo,
      );
    });
  }

  if (params.timeSlot) {
    const slot = normalizeTime24(params.timeSlot);
    return bookings.filter((b) => formatTimeDisplay(b.startTime) === slot);
  }

  return bookings;
}

export function isScheduleTemplateCreationPrompt(prompt?: string): boolean {
  return /\bcreate\b[\s\S]{0,80}\b(?:schedule\s+)?template\b/i.test(
    prompt ?? '',
  );
}

/** cleanup / clear / wipe / reset provider schedule (not appointments). */
export function isClearSchedulePrompt(prompt?: string): boolean {
  const lower = (prompt ?? '').toLowerCase();
  if (!/\bschedule\b/.test(lower)) return false;
  if (
    /\b(from calendar|appointment|booking)s?\b/.test(lower) &&
    !/\bschedule\b/.test(lower)
  ) {
    return false;
  }
  return (
    /\b(clean\s*up|clear|reset|wipe)\b/.test(lower) ||
    (/\bremove\b/.test(lower) &&
      !/\b(from calendar|appointment|booking)/.test(lower))
  );
}

export function isFullDayBlock(
  params: { blockFullDay?: boolean | null },
  prompt?: string,
): boolean {
  if (params.blockFullDay) return true;
  const lower = (prompt ?? '').toLowerCase();
  return (
    lower.includes('full day') ||
    lower.includes('entire day') ||
    lower.includes('whole day') ||
    lower.includes('block the day') ||
    !!lower.match(
      /block\s+\d{1,2}[/_]\d{1,2}[/_]\d{4}\s*(entirely|completely)?/,
    )
  );
}

export type EmployeeNameRef = Pick<Employee, 'id' | 'name'>;

function employeeMentionedInPrompt(
  prompt: string,
  employee: EmployeeNameRef,
): boolean {
  const lower = prompt.toLowerCase();
  if (lower.includes(employee.name.toLowerCase())) return true;

  const parts = employee.name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0].toLowerCase();
    const last = parts[parts.length - 1].toLowerCase();
    if (
      first.length >= 3 &&
      last.length >= 4 &&
      new RegExp(`\\b${first}\\b`).test(lower) &&
      new RegExp(`\\b${last}\\b`).test(lower)
    ) {
      return true;
    }
  }

  const first = parts[0]?.toLowerCase();
  return !!(
    first &&
    first.length >= 3 &&
    new RegExp(`\\b${first}\\b`).test(lower)
  );
}

/** All providers named in the prompt (e.g. "Mary and Jujo"). Longest names matched first. */
export function matchEmployeesInPrompt<T extends EmployeeNameRef>(
  prompt: string,
  employees: T[],
): T[] {
  const sorted = [...employees].sort((a, b) => b.name.length - a.name.length);
  const matched: T[] = [];
  const seen = new Set<string>();

  for (const employee of sorted) {
    if (!employeeMentionedInPrompt(prompt, employee)) continue;
    if (seen.has(employee.id)) continue;
    seen.add(employee.id);
    matched.push(employee);
  }

  return matched;
}

/** Longest-name-first match so "Karo Mazmanyan" wins over partial overlaps. */
export function promptMentionsSpecificEmployee<T extends EmployeeNameRef>(
  prompt: string,
  employees: T[],
): T | undefined {
  return matchEmployeesInPrompt(prompt, employees)[0];
}

/** True only when the user explicitly targets the whole team — not "clear all schedules for Karo". */
export function isTeamWideProviderScopePrompt(prompt: string): boolean {
  return (
    /\b(?:all|every)\s+(?:the\s+)?(?:employees?|providers?|staff|team|specialists?)\b/i.test(
      prompt,
    ) || /\ball providers\b|\beveryone\b|\bwhole team\b/i.test(prompt)
  );
}

export function resolveAllProvidersScope(
  prompt: string,
  params: {
    allProviders?: boolean | null;
    employeeName?: string | null;
    employeeNames?: string[] | null;
  },
  employees: Employee[] = [],
): boolean {
  if (isTeamWideProviderScopePrompt(prompt)) return true;

  const mentioned = promptMentionsSpecificEmployee(prompt, employees);
  if (mentioned) return false;

  if (params.employeeName || params.employeeNames?.length) return false;

  return params.allProviders === true;
}

/** Pin scope to named provider(s); clears stale session allProviders. */
export function sanitizeProviderScopeFromPrompt(
  prompt: string,
  params: Record<string, any>,
  employees: Employee[],
): void {
  const mentioned = matchEmployeesInPrompt(prompt, employees);
  if (mentioned.length > 1) {
    params.employeeNames = mentioned.map((e) => e.name);
    params.employeeName = null;
    params.allProviders = false;
    delete params.employeeIds;
    return;
  }
  if (mentioned.length === 1) {
    params.employeeName = mentioned[0].name;
    params.allProviders = false;
    delete params.employeeNames;
    delete params.employeeIds;
    return;
  }

  params.allProviders = resolveAllProvidersScope(prompt, params, employees);
  if (params.allProviders) {
    params.employeeName = null;
    delete params.employeeIds;
  }
}

function resolveUnavailableLabel(
  text: string,
  from: string,
  to: string,
  matchText: string,
): string {
  if (/lunch/i.test(matchText)) return 'Lunch';
  const lower = text.toLowerCase();
  if (
    /\blunch\b/.test(lower) &&
    lower.includes(`${from.split(':')[0]}-${to.split(':')[0]}`)
  ) {
    return 'Lunch';
  }
  return 'Unavailable';
}

/** Parse lunch/break/unavailable windows from natural language (e.g. "12-13 unavailable"). */
export function extractUnavailableBlocksFromPrompt(
  text: string,
): Array<{ from: string; to: string; label: string }> {
  const unavailableBlocks: Array<{ from: string; to: string; label: string }> =
    [];

  const patterns = [
    /\b(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(?:unavailable|off|blocked|break)\b/gi,
    /\b(?:unavailable|off|blocked|lunch|break)\s+(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\b/gi,
    /\b(?:make|mark)\s+(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s+(?:unavailable|off|blocked|break)\b/gi,
  ];

  for (const re of patterns) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const from = normalizeTime24(`${match[1]}:${match[2] ?? '00'}`);
      const to = normalizeTime24(`${match[3]}:${match[4] ?? '00'}`);
      if (timeToMinutes(to) > timeToMinutes(from)) {
        const label = resolveUnavailableLabel(text, from, to, match[0]);
        const duplicate = unavailableBlocks.some(
          (b) => b.from === from && b.to === to,
        );
        if (!duplicate) unavailableBlocks.push({ from, to, label });
      }
    }
  }

  if (
    unavailableBlocks.length === 0 &&
    /\b12\s*[-–]\s*13\b/.test(text) &&
    /unavailable|lunch|break/i.test(text)
  ) {
    unavailableBlocks.push({ from: '12:00', to: '13:00', label: 'Lunch' });
  }

  return unavailableBlocks.sort(
    (a, b) => timeToMinutes(a.from) - timeToMinutes(b.from),
  );
}

function normalizeSchedulePeriod(
  period: Record<string, any>,
): Record<string, any> {
  return {
    ...period,
    startTime: normalizeTime24(String(period.startTime)),
    endTime: normalizeTime24(String(period.endTime)),
    type: period.type ?? 'service_block',
    placeholderLabel: period.placeholderLabel ?? period.label,
  };
}

function hasUnavailableCoverage(
  periods: Array<Record<string, any>>,
  block: { from: string; to: string },
): boolean {
  const bStart = timeToMinutes(block.from);
  const bEnd = timeToMinutes(block.to);
  return periods.some((p) => {
    if (p.type !== 'unavailable_block') return false;
    const pStart = timeToMinutes(String(p.startTime));
    const pEnd = timeToMinutes(String(p.endTime));
    return pStart <= bStart && pEnd >= bEnd;
  });
}

/** Split overlapping service blocks and insert explicit unavailable periods. */
export function applyUnavailableBlocksToPeriods(
  periods: Array<Record<string, any>>,
  unavailableBlocks: Array<{ from: string; to: string; label: string }>,
): Array<Record<string, any>> {
  if (!unavailableBlocks.length) {
    return periods.map(normalizeSchedulePeriod);
  }

  let result = periods.map(normalizeSchedulePeriod);

  for (const block of unavailableBlocks) {
    const bStart = timeToMinutes(block.from);
    const bEnd = timeToMinutes(block.to);
    const next: Array<Record<string, any>> = [];

    for (const period of result) {
      if (period.type === 'unavailable_block') {
        next.push(period);
        continue;
      }

      const pStart = timeToMinutes(String(period.startTime));
      const pEnd = timeToMinutes(String(period.endTime));

      if (pEnd <= bStart || pStart >= bEnd) {
        next.push(period);
        continue;
      }

      if (pStart < bStart) {
        next.push({ ...period, endTime: block.from });
      }
      next.push({
        startTime: block.from,
        endTime: block.to,
        type: 'unavailable_block',
        placeholderLabel: block.label,
      });
      if (pEnd > bEnd) {
        next.push({ ...period, startTime: block.to });
      }
    }

    result = next.filter(
      (p) =>
        timeToMinutes(String(p.endTime)) > timeToMinutes(String(p.startTime)),
    );
  }

  for (const block of unavailableBlocks) {
    if (hasUnavailableCoverage(result, block)) continue;

    const bStart = timeToMinutes(block.from);
    const bEnd = timeToMinutes(block.to);
    const endsAtGapStart = result.some(
      (p) => timeToMinutes(String(p.endTime)) === bStart,
    );
    const startsAtGapEnd = result.some(
      (p) => timeToMinutes(String(p.startTime)) === bEnd,
    );

    if (endsAtGapStart && startsAtGapEnd) {
      result.push({
        startTime: block.from,
        endTime: block.to,
        type: 'unavailable_block',
        placeholderLabel: block.label,
      });
    }
  }

  return result.sort(
    (a, b) =>
      timeToMinutes(String(a.startTime)) - timeToMinutes(String(b.startTime)),
  );
}

/** Build service/unavailable periods from phrases like "9-19, 12-13 unavailable". */
export function inferDirectSchedulePeriods(
  params: Record<string, any>,
  prompt?: string,
): Array<Record<string, any>> {
  const text = prompt ?? '';
  const unavailableBlocks = extractUnavailableBlocksFromPrompt(text);

  if (Array.isArray(params.periods) && params.periods.length > 0) {
    return applyUnavailableBlocksToPeriods(params.periods, unavailableBlocks);
  }

  const window = parseTimeWindow(params, text, {
    timeFrom: '09:00',
    timeTo: '19:00',
  });

  if (unavailableBlocks.length === 0) {
    return [
      {
        startTime: window.timeFrom,
        endTime: window.timeTo,
        type: 'service_block',
      },
    ];
  }

  const periods: Array<Record<string, any>> = [];
  let cursor = window.timeFrom;

  for (const block of unavailableBlocks) {
    if (timeToMinutes(block.from) > timeToMinutes(cursor)) {
      periods.push({
        startTime: cursor,
        endTime: block.from,
        type: 'service_block',
      });
    }
    periods.push({
      startTime: block.from,
      endTime: block.to,
      type: 'unavailable_block',
      placeholderLabel: block.label,
    });
    cursor = block.to;
  }

  if (timeToMinutes(window.timeTo) > timeToMinutes(cursor)) {
    periods.push({
      startTime: cursor,
      endTime: window.timeTo,
      type: 'service_block',
    });
  }

  return periods;
}

export const PUBLIC_AVAILABILITY_SCAN_DAYS = 14;

export function hasExplicitWeekdayInAvailabilityPrompt(
  params: { weekdays?: string[] | null; applyDays?: number[] | null },
  prompt?: string,
): boolean {
  if (params.weekdays?.length || params.applyDays?.length) return true;
  return /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|weekdays?|weekend)\b/i.test(
    prompt ?? '',
  );
}

export type ResolvedPublicAvailabilityWindow = {
  dateKeys: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  timeSlot?: string | null;
};

function resolveRelativeAvailabilityDateKey(
  date: string,
  timeZone: string,
): string | null {
  const tz = resolveTimezone(timeZone);
  const lower = date.trim().toLowerCase();
  if (lower === 'tomorrow') {
    return addDaysToDateKey(getTodayDateKey(tz), 1, tz);
  }
  if (lower === 'today' || lower === 'tonight') {
    return getTodayDateKey(tz);
  }
  return null;
}

/** Resolve ISO day keys for one availability window without merging OR alternatives (avail-1.4). */
export function resolveDateKeysForAvailabilityWindow(
  window: AvailabilityWindow,
  timeZone: string,
  scanDays: number = PUBLIC_AVAILABILITY_SCAN_DAYS,
): string[] {
  const tz = resolveTimezone(timeZone);
  const todayKey = getTodayDateKey(tz);
  const dropPast = (keys: string[]) => keys.filter((d) => d >= todayKey);

  if (window.weekdays?.length) {
    const weekdays = parseWeekdaysFromParams(
      { weekdays: window.weekdays },
      undefined,
    );
    const result: string[] = [];
    for (let offset = 0; offset < scanDays; offset++) {
      const dateKey = addDaysToDateKey(todayKey, offset, tz);
      if (weekdays.includes(dayjs.tz(dateKey, tz).day())) {
        result.push(dateKey);
      }
    }
    return dropPast(result);
  }

  if (window.date) {
    const relative = resolveRelativeAvailabilityDateKey(window.date, tz);
    if (relative) return dropPast([relative]);
    return dropPast([toIsoDay(window.date, tz)]);
  }

  if (
    window.timeOfDay ||
    window.timeFrom ||
    window.timeTo ||
    window.timeSlot
  ) {
    const result: string[] = [];
    for (let offset = 0; offset < scanDays; offset++) {
      result.push(addDaysToDateKey(todayKey, offset, tz));
    }
    return dropPast(result);
  }

  return [];
}

function resolveLegacyPublicAvailabilityDateKeys(
  params: Record<string, any>,
  prompt: string | undefined,
  timeZone: string,
  options: { defaultScanDays?: number } = {},
): string[] {
  const tz = resolveTimezone(timeZone);
  const scanDays = options.defaultScanDays ?? PUBLIC_AVAILABILITY_SCAN_DAYS;
  const enriched: Record<string, any> = { ...params, _timeZone: tz };
  enrichDateRangeFromPrompt(enriched, prompt ?? '', tz);
  applyRelativeDateFromPrompt(enriched, prompt ?? '', tz);

  const weekdays = parseWeekdaysFromParams(enriched, prompt);
  const hasWeekdayFilter = hasExplicitWeekdayInAvailabilityPrompt(
    enriched,
    prompt,
  );
  const todayKey = getTodayDateKey(tz);

  const dropPast = (keys: string[]) => keys.filter((d) => d >= todayKey);

  if (hasWeekdayFilter) {
    const result: string[] = [];
    for (let offset = 0; offset < scanDays; offset++) {
      const dateKey = addDaysToDateKey(todayKey, offset, tz);
      if (weekdays.includes(dayjs.tz(dateKey, tz).day())) {
        result.push(dateKey);
      }
    }
    if (result.length > 0) return result;
  }

  const promptOnlyDates = resolveScheduleDates({ _timeZone: tz }, prompt);
  if (promptOnlyDates.length > 0) {
    return dropPast(promptOnlyDates).slice(0, scanDays);
  }

  if (enriched.dateFrom && enriched.dateTo) {
    const range = resolveDateRange(
      { dateFrom: enriched.dateFrom, dateTo: enriched.dateTo, _timeZone: tz },
      prompt,
      tz,
    );
    if (range) {
      return dropPast(
        enumerateDaysInRange(range).map((d) => d.toISOString().split('T')[0]),
      ).slice(0, scanDays);
    }
  }

  if (enriched.date) {
    return dropPast([toIsoDay(enriched.date, tz)]);
  }

  return [];
}

function toResolvedPublicAvailabilityWindow(
  window: AvailabilityWindow,
  dateKeys: string[],
): ResolvedPublicAvailabilityWindow {
  return {
    dateKeys,
    timeOfDay: window.timeOfDay ?? null,
    timeFrom: window.timeFrom ?? null,
    timeTo: window.timeTo ?? null,
    timeSlot: window.timeSlot ?? null,
  };
}

/** Resolve availability windows with per-window date keys + timeOfDay pairing (avail-1.4). */
export function resolvePublicAvailabilityWindows(
  params: Record<string, any>,
  prompt: string | undefined,
  timeZone: string,
  options: { defaultScanDays?: number } = {},
): ResolvedPublicAvailabilityWindow[] {
  const scanDays = options.defaultScanDays ?? PUBLIC_AVAILABILITY_SCAN_DAYS;
  const hasExplicitWindows = Array.isArray(params.availabilityWindows)
    && params.availabilityWindows.length > 0;
  const normalizedWindows = normalizeAvailabilityWindows(params);

  if (hasExplicitWindows && normalizedWindows.length > 0) {
    return normalizedWindows
      .map((window) =>
        toResolvedPublicAvailabilityWindow(
          window,
          resolveDateKeysForAvailabilityWindow(window, timeZone, scanDays),
        ),
      )
      .filter((window) => window.dateKeys.length > 0);
  }

  if (
    normalizedWindows.length === 1 &&
    (normalizedWindows[0]?.weekdays?.length ||
      normalizedWindows[0]?.date ||
      normalizedWindows[0]?.timeOfDay)
  ) {
    const window = normalizedWindows[0]!;
    const dateKeys = resolveDateKeysForAvailabilityWindow(
      window,
      timeZone,
      scanDays,
    );
    if (dateKeys.length > 0) {
      return [toResolvedPublicAvailabilityWindow(window, dateKeys)];
    }
  }

  const legacyDateKeys = resolveLegacyPublicAvailabilityDateKeys(
    params,
    prompt,
    timeZone,
    options,
  );
  if (legacyDateKeys.length === 0) return [];

  return [
    {
      dateKeys: legacyDateKeys,
      timeOfDay: params.timeOfDay ?? null,
      timeFrom: params.timeFrom ?? null,
      timeTo: params.timeTo ?? null,
      timeSlot: params.timeSlot ?? null,
    },
  ];
}

/** Resolve ISO day keys for public customer availability (weekday names, ranges, single dates). */
export function resolvePublicAvailabilityDateKeys(
  params: Record<string, any>,
  prompt: string | undefined,
  timeZone: string,
  options: { defaultScanDays?: number } = {},
): string[] {
  return [
    ...new Set(
      resolvePublicAvailabilityWindows(params, prompt, timeZone, options).flatMap(
        (window) => window.dateKeys,
      ),
    ),
  ];
}

/** Drop session date when the user names weekdays or relative days in an availability question. */
export function applyAvailabilityDateFromPrompt(
  params: Record<string, any>,
  prompt?: string,
  timeZone = 'UTC',
): void {
  if (!prompt?.trim()) return;

  const clearedStaleSessionDate = hasExplicitWeekdayInAvailabilityPrompt(
    params,
    prompt,
  );
  if (clearedStaleSessionDate) {
    delete params.date;
    delete params.dateFrom;
    delete params.dateTo;
  }

  if (!clearedStaleSessionDate) {
    applyPromptDateOverride(params, prompt, timeZone);
  }
}

export function shouldAutoExecute(
  action: string,
  stepCount: number,
  providerCount: number,
): boolean {
  const readOnly = [
    'list_bookings',
    'show_appointments',
    'check_availability',
    'summarize_day',
    'summarize_bookings',
    'list_services',
    'analyze_services',
    'summarize_staff',
    'lookup_customer',
    'summarize_waitlist',
    'lookup_service_assignment',
    'list_employees',
    'list_templates',
    'optimize_schedule',
    'summarize_utilization',
    'list_schedule_gaps',
    'summarize_customers',
    'analyze_appointments',
    'resolve_conflicts',
    'reassign_cancelled',
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
  return shouldAutoExecute(
    params.action,
    params.stepCount,
    params.providerCount,
  );
}
