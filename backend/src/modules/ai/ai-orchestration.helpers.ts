import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { parseDateInput, toIsoDay, formatDateDisplay } from '../../common/utils/date-format.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';

export interface DateRange {
  start: string;
  end: string;
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
    const svc = fuzzyMatchByName(catalog, name);
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

/** Parse relative dates and ranges from prompt + params into ISO day range. */
export function resolveDateRange(
  params: { date?: string | null; dateFrom?: string | null; dateTo?: string | null },
  prompt?: string,
): DateRange | null {
  if (params.dateFrom && params.dateTo) {
    return { start: toIsoDay(params.dateFrom), end: toIsoDay(params.dateTo) };
  }

  const lower = (prompt ?? '').toLowerCase();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const addDays = (base: Date, n: number) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + n);
    return d;
  };

  const weekRange = (offsetWeeks = 0) => {
    const start = new Date(today);
    const day = start.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setUTCDate(start.getUTCDate() + mondayOffset + offsetWeeks * 7);
    const end = addDays(start, 6);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  if (/\blast week\b/i.test(lower)) return weekRange(-1);
  if (/\bthis week\b/i.test(lower)) return weekRange(0);
  if (/\bnext week\b/i.test(lower)) return weekRange(1);

  if (/\bthis month\b/i.test(lower) || /\bcurrent month\b/i.test(lower)) {
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }

  if (/\blast month\b/i.test(lower)) {
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }

  const weekdayMap: Record<string, number> = {
    sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3, thursday: 4, thu: 4, thurs: 4,
    friday: 5, fri: 5, saturday: 6, sat: 6,
  };
  const nextDayMatch = lower.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/);
  if (nextDayMatch) {
    const target = weekdayMap[nextDayMatch[1]];
    const cur = today.getUTCDay();
    let delta = (target - cur + 7) % 7;
    if (delta === 0) delta = 7;
    const d = addDays(today, delta);
    const iso = d.toISOString().split('T')[0];
    return { start: iso, end: iso };
  }

  if (/\btoday\b/i.test(lower) || /\btonight\b/i.test(lower)) {
    const iso = today.toISOString().split('T')[0];
    return { start: iso, end: iso };
  }
  if (/\btomorrow\b/i.test(lower)) {
    const iso = addDays(today, 1).toISOString().split('T')[0];
    return { start: iso, end: iso };
  }
  if (/\byesterday\b/i.test(lower)) {
    const iso = addDays(today, -1).toISOString().split('T')[0];
    return { start: iso, end: iso };
  }

  if (params.date) {
    const iso = toIsoDay(params.date);
    return { start: iso, end: iso };
  }

  return null;
}

/** Extract single date hint from prompt for params.date (display format). */
export function extractSingleDateFromPrompt(prompt: string): string | null {
  const range = resolveDateRange({}, prompt);
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
    return {
      timeFrom: normalizeTime24(`${match[1]}:${match[2] ?? '00'}`),
      timeTo: normalizeTime24(`${match[3]}:${match[4] ?? '00'}`),
    };
  }

  return defaults;
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
    'lookup_customer', 'list_employees', 'list_templates', 'optimize_schedule',
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
