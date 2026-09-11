import {
  addDaysToDateKey,
  resolveTimezone,
} from '../../common/utils/timezone.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import { toIsoDay } from '../../common/utils/date-format.util.js';

export const SCHEDULING_INTENTS = [
  'swap_schedules',
  'rebalance_capacity',
  'holiday_mode',
  'onboard_provider_schedule',
] as const;

export type SchedulingIntent = (typeof SCHEDULING_INTENTS)[number];

export interface SerializedSchedulePeriod {
  startTime: string;
  endTime: string;
  type: string;
  serviceIds?: string[];
  placeholderLabel?: string;
}

/** ai-s2 — detect smart block propagation prompts. */
export function isSmartBlockPropagationPrompt(prompt: string): boolean {
  return (
    (/block\s+.*(?:lunch|break)/i.test(prompt) &&
      (/repeat|every week|\d+\s*weeks?/i.test(prompt) ||
        /for everyone|all providers|all staff/i.test(prompt))) ||
    /skip\s+holidays?/i.test(prompt)
  );
}

/** ai-s3 — swap schedules between two providers. */
export function isScheduleSwapPrompt(prompt: string): boolean {
  return (
    /swap\s+.+(?:schedule|shift|hours)/i.test(prompt) ||
    /switch\s+.+(?:schedule|friday)/i.test(prompt)
  );
}

/** ai-s4 — move capacity between providers. */
export function isCapacityRebalancePrompt(prompt: string): boolean {
  return (
    /move\s+\d+\s+.+(?:slot|appointment)/i.test(prompt) ||
    /rebalance/i.test(prompt) ||
    /transfer\s+\d+\s+/i.test(prompt)
  );
}

/** ai-s5 — holiday closure + optional extended hours. */
export function isHolidayModePrompt(prompt: string): boolean {
  return (
    (/\bclose\b/i.test(prompt) &&
      (/\b(?:dec|december)\b/i.test(prompt) ||
        /\d{1,2}[-–/]\d{1,2}/.test(prompt) ||
        /for all|all providers/i.test(prompt))) ||
    /holiday\s+mode/i.test(prompt) ||
    (/close/i.test(prompt) && /extend/i.test(prompt))
  );
}

/** ai-s6 — new hire week setup from template + service assignment. */
export function isOnboardProviderPrompt(prompt: string): boolean {
  return (
    /(?:set\s+up|onboard|first\s+week).+(?:template|weekday)/i.test(prompt) ||
    /new\s+hire/i.test(prompt) ||
    (/assign/i.test(prompt) && /first\s+week/i.test(prompt))
  );
}

export function rescueSchedulingIntent(
  prompt: string,
  action: string,
  params: Record<string, unknown>,
): { action: string; params: Record<string, unknown> } | null {
  if (action !== 'unknown' && action !== 'block_schedule') {
    if (isScheduleSwapPrompt(prompt) && action !== 'swap_schedules') {
      return { action: 'swap_schedules', params };
    }
    if (isCapacityRebalancePrompt(prompt) && action !== 'rebalance_capacity') {
      return { action: 'rebalance_capacity', params };
    }
    if (isHolidayModePrompt(prompt) && action !== 'holiday_mode') {
      return { action: 'holiday_mode', params };
    }
    if (
      isOnboardProviderPrompt(prompt) &&
      action !== 'onboard_provider_schedule'
    ) {
      return { action: 'onboard_provider_schedule', params };
    }
    return null;
  }

  if (isScheduleSwapPrompt(prompt)) return { action: 'swap_schedules', params };
  if (isCapacityRebalancePrompt(prompt))
    return { action: 'rebalance_capacity', params };
  if (isHolidayModePrompt(prompt)) return { action: 'holiday_mode', params };
  if (isOnboardProviderPrompt(prompt))
    return { action: 'onboard_provider_schedule', params };
  if (isSmartBlockPropagationPrompt(prompt) || action === 'block_schedule') {
    return {
      action: 'block_schedule',
      params: enhanceSmartBlockParams(prompt, params),
    };
  }
  return null;
}

/** ai-s2 — enrich block_schedule params for multi-week propagation with optional holiday skip. */
export function enhanceSmartBlockParams(
  prompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...params };

  if (/everyone|all providers|all staff|all employees|for all/i.test(prompt)) {
    next.allProviders = true;
  }

  const weeksMatch = prompt.match(/(\d+)\s*weeks?/i);
  if (weeksMatch) {
    const weeks = Number(weeksMatch[1]);
    if (Number.isFinite(weeks) && weeks > 0) {
      next.weeksCount = weeks;
      next.repeatWeeksCount = weeks;
    }
  } else if (/repeat/i.test(prompt) && !next.weeksCount) {
    next.weeksCount = 4;
    next.repeatWeeksCount = 4;
  }

  if (/skip\s+holidays?/i.test(prompt)) {
    next.skipHolidays = true;
  }

  const lunchMatch = prompt.match(
    /(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?/,
  );
  if (lunchMatch) {
    const fromH = lunchMatch[1];
    const fromM = lunchMatch[2] ?? '00';
    const toH = lunchMatch[3];
    const toM = lunchMatch[4] ?? '00';
    next.timeFrom = normalizeTime24(`${fromH}:${fromM}`);
    next.timeTo = normalizeTime24(`${toH}:${toM}`);
    next.placeholder = next.placeholder ?? 'Lunch break';
  }

  return next;
}

export function parseIsoDatesList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === 'string' ? toIsoDay(entry) : null))
    .filter((entry): entry is string => Boolean(entry));
}

/** Expand recurring weekday dates across N weeks, optionally skipping holidays. */
export function expandPropagatedBlockDates(input: {
  startDate: string;
  weeksCount: number;
  weekdays: number[];
  holidayDates?: string[];
  skipHolidays?: boolean;
  timeZone?: string;
}): string[] {
  const timeZone = resolveTimezone(input.timeZone);
  const holidaySet = new Set(
    (input.holidayDates ?? []).map((d) => toIsoDay(d)),
  );
  const totalDays = Math.max(1, input.weeksCount) * 7;
  const dates: string[] = [];

  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = addDaysToDateKey(input.startDate, offset, timeZone);
    const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay();
    if (!input.weekdays.includes(weekday)) continue;
    if (input.skipHolidays && holidaySet.has(date)) continue;
    dates.push(date);
  }

  return dates;
}

export function buildPropagatedSingleBlocks(input: {
  employeeId: string;
  employeeName: string;
  dates: string[];
  timeFrom: string;
  timeTo: string;
  placeholder: string;
}) {
  return input.dates.map((date) => {
    const [sh, sm] = input.timeFrom.split(':').map(Number);
    const [eh, em] = input.timeTo.split(':').map(Number);
    const start = new Date(`${date}T00:00:00.000Z`);
    start.setUTCHours(sh, sm, 0, 0);
    const end = new Date(`${date}T00:00:00.000Z`);
    end.setUTCHours(eh, em, 0, 0);
    return {
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      isRepetitive: false,
      placeholder: input.placeholder,
      singleBlock: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    };
  });
}

export function shouldUsePropagatedSingleBlocks(
  params: Record<string, unknown>,
): boolean {
  return (
    params.skipHolidays === true || params.usePropagatedSingleBlocks === true
  );
}

export function parseSwapEmployeeNames(params: Record<string, unknown>): {
  employeeName?: string | null;
  swapWithEmployeeName?: string | null;
} {
  const names = Array.isArray(params.employeeNames)
    ? params.employeeNames
    : null;
  return {
    employeeName:
      (params.employeeName as string | null | undefined) ?? names?.[0] ?? null,
    swapWithEmployeeName:
      (params.swapWithEmployeeName as string | null | undefined) ??
      names?.[1] ??
      null,
  };
}

export function parseRebalanceSlotCount(
  params: Record<string, unknown>,
  prompt: string,
): number {
  if (typeof params.slotCount === 'number' && params.slotCount > 0)
    return params.slotCount;
  const match =
    prompt.match(/move\s+(\d+)\s+/i) ?? prompt.match(/transfer\s+(\d+)\s+/i);
  if (match) {
    const count = Number(match[1]);
    if (Number.isFinite(count) && count > 0) return count;
  }
  return 1;
}

/**
 * e2e-bug.528 — a closure range is closure dates.
 *
 * `holiday_mode` reads `closeDates` / `holidayDates`, both enumerated lists.
 * But the command describes itself as *"Close the business for a **period**"*,
 * and its own failure message tells the user *"Specify closure dates (e.g. Dec
 * 24-26)"* — a range. So a user who says exactly what they were asked for, and
 * whose phrasing the classifier renders as `dateFrom`/`dateTo`, was asked to
 * restate dates they had already given. The command's documentation and its
 * error message both promised this; only the parser did not.
 *
 * **Additive, and only consulted when the list is empty**: an enumerated
 * `closeDates` still wins outright, so acceptance can widen and never narrow —
 * the same constraint the D5 slices used, and the reason widening is safe here
 * rather than the way e2e-bug.362 happened.
 *
 * Bounded on purpose. This is a T3 command that blocks all booking, so a
 * mis-parsed year ("2026" read as a date) must not close a decade: a range
 * longer than `MAX_CLOSURE_RANGE_DAYS` is refused entirely rather than
 * truncated, because a silently shortened closure is a business open on a day
 * it believes it is closed.
 */
const MAX_CLOSURE_RANGE_DAYS = 366;

export function expandClosureDateRange(
  params: Record<string, unknown>,
): string[] {
  const from =
    typeof params.dateFrom === 'string' ? toIsoDay(params.dateFrom) : null;
  const to = typeof params.dateTo === 'string' ? toIsoDay(params.dateTo) : null;
  // Both ends required: a lone `dateFrom` is what the completion validator
  // already refuses (§306), because "closed from Dec 24" names no end.
  if (!from || !to || to < from) return [];

  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    if (dates.length > MAX_CLOSURE_RANGE_DAYS) return [];
    // 'UTC' because both ends are already `YYYY-MM-DD` date keys: this walks
    // calendar days, it does not convert an instant, so the zone cannot shift
    // the result. Reusing the shared helper rather than writing a third date
    // walk is the point of e2e-bug.367.
    cursor = addDaysToDateKey(cursor, 1, 'UTC');
  }
  return dates;
}

export function parseHolidayModeDates(params: Record<string, unknown>): {
  closeDates: string[];
  extendDate?: string;
  extendTimeFrom?: string;
  extendTimeTo?: string;
} {
  const enumerated = parseIsoDatesList(
    params.closeDates ?? params.holidayDates,
  );
  // e2e-bug.528 — fall back to an explicit range only when nothing was listed.
  const closeDates = enumerated.length
    ? enumerated
    : expandClosureDateRange(params);
  const extendDate =
    typeof params.extendDate === 'string'
      ? toIsoDay(params.extendDate)
      : undefined;
  return {
    closeDates,
    extendDate,
    extendTimeFrom:
      typeof params.extendTimeFrom === 'string'
        ? normalizeTime24(params.extendTimeFrom)
        : undefined,
    extendTimeTo:
      typeof params.extendTimeTo === 'string'
        ? normalizeTime24(params.extendTimeTo)
        : undefined,
  };
}

export function buildHolidayClosureBlockPayloads(input: {
  employees: Array<{ id: string; name: string }>;
  closeDates: string[];
  placeholder?: string;
}) {
  const placeholder = input.placeholder ?? 'Holiday closure';
  const blocks: Array<{
    employeeId: string;
    employeeName: string;
    isRepetitive: boolean;
    placeholder: string;
    singleBlock: { startTime: string; endTime: string };
  }> = [];

  for (const employee of input.employees) {
    for (const date of input.closeDates) {
      blocks.push({
        employeeId: employee.id,
        employeeName: employee.name,
        isRepetitive: false,
        placeholder,
        singleBlock: {
          startTime: `${date}T00:00:00.000Z`,
          endTime: `${date}T23:59:59.999Z`,
        },
      });
    }
  }
  return blocks;
}

export function buildExtendHoursPeriods(timeFrom: string, timeTo: string) {
  return [
    {
      startTime: timeFrom,
      endTime: timeTo,
      type: 'service_block',
      serviceIds: [],
    },
  ];
}

export function serializePeriodsForSwap(
  periods: Array<{
    startTime: Date;
    endTime: Date;
    type: string;
    serviceIds?: string[] | null;
    placeholderLabel?: string | null;
  }>,
): SerializedSchedulePeriod[] {
  return periods.map((period) => ({
    startTime: `${String(period.startTime.getUTCHours()).padStart(2, '0')}:${String(period.startTime.getUTCMinutes()).padStart(2, '0')}`,
    endTime: `${String(period.endTime.getUTCHours()).padStart(2, '0')}:${String(period.endTime.getUTCMinutes()).padStart(2, '0')}`,
    type: period.type,
    serviceIds: period.serviceIds ?? [],
    placeholderLabel: period.placeholderLabel ?? undefined,
  }));
}

export function buildOnboardProviderSummary(input: {
  employeeName: string;
  templateName?: string;
  serviceNames?: string[];
}): string {
  const services = input.serviceNames?.length
    ? ` and assign ${input.serviceNames.join(', ')}`
    : '';
  const template = input.templateName
    ? ` from ${input.templateName} template`
    : '';
  return `Set up ${input.employeeName}'s first week${template}${services}.`;
}

export interface BlockScheduleBlockPayload {
  employeeId: string;
  employeeName: string;
  isRepetitive: boolean;
  placeholder: string;
  singleBlock?: { startTime: string; endTime: string };
  repetitiveBlock?: Record<string, unknown>;
}

export function resolveHolidayDatesFromBusinessSettings(
  settings: Record<string, unknown> | null | undefined,
): string[] {
  if (!settings) return [];
  const schedule = settings.schedule;
  const fromSchedule =
    schedule && typeof schedule === 'object'
      ? parseIsoDatesList((schedule as Record<string, unknown>).holidayDates)
      : [];
  if (fromSchedule.length) return fromSchedule;
  return parseIsoDatesList(settings.holidays ?? settings.holidayDates);
}

/**
 * e2e-bug.136 — match a block_schedules row to an ISO day.
 * Repetitive blocks use startDay/endDay; single blocks use singleStartTime day.
 */
export function scheduleBlockMatchesIsoDay(
  block: {
    startDay?: string | null;
    endDay?: string | null;
    singleStartTime?: Date | string | null;
    singleEndTime?: Date | string | null;
  },
  isoDay: string,
): boolean {
  if (block.startDay) {
    if (block.startDay === isoDay) return true;
    const end = block.endDay || block.startDay;
    return block.startDay <= isoDay && end >= isoDay;
  }
  if (block.singleStartTime) {
    const start = new Date(block.singleStartTime);
    if (Number.isNaN(start.getTime())) return false;
    const startDay = start.toISOString().slice(0, 10);
    if (!block.singleEndTime) return startDay === isoDay;
    const end = new Date(block.singleEndTime);
    if (Number.isNaN(end.getTime())) return startDay === isoDay;
    const endDay = end.toISOString().slice(0, 10);
    return startDay <= isoDay && endDay >= isoDay;
  }
  return false;
}

/** Build block payloads — supports ai-s2 propagated single blocks when skipHolidays is set. */
export function buildBlockScheduleBlockPayloads(input: {
  targets: Array<{ id: string; name: string }>;
  params: Record<string, unknown>;
  range: { start: string; end: string } | null;
  fullDay: boolean;
  window: { timeFrom: string; timeTo: string };
  applyDays: number[];
  placeholder: string;
  singleDate: string | null;
  holidayDates?: string[];
}): BlockScheduleBlockPayload[] {
  const {
    targets,
    params,
    range,
    fullDay,
    window,
    applyDays,
    placeholder,
    singleDate,
  } = input;
  const isRepetitive =
    !!range && range.start !== range.end && !fullDay && applyDays.length < 7;
  const weekdays = applyDays.length ? applyDays : [1, 2, 3, 4, 5];
  const weeksCount = Number(params.weeksCount ?? params.repeatWeeksCount ?? 1);

  if (
    shouldUsePropagatedSingleBlocks(params) &&
    (isRepetitive || weeksCount > 1) &&
    (range?.start || singleDate)
  ) {
    const startDate = range?.start ?? singleDate!;
    const dates = expandPropagatedBlockDates({
      startDate,
      weeksCount: Math.max(weeksCount, isRepetitive ? weeksCount : 1),
      weekdays,
      holidayDates: input.holidayDates,
      skipHolidays: params.skipHolidays === true,
    });
    return targets.flatMap((employee) =>
      buildPropagatedSingleBlocks({
        employeeId: employee.id,
        employeeName: employee.name,
        dates,
        timeFrom: window.timeFrom,
        timeTo: window.timeTo,
        placeholder,
      }),
    );
  }

  return targets.map((employee) => {
    if (fullDay && singleDate) {
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        isRepetitive: false,
        placeholder,
        singleBlock: {
          startTime: `${singleDate}T00:00:00.000Z`,
          endTime: `${singleDate}T23:59:59.000Z`,
        },
      };
    }

    if (isRepetitive && range) {
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        isRepetitive: true,
        placeholder,
        repetitiveBlock: {
          startDay: range.start,
          endDay: range.end,
          startTime: normalizeTime24(window.timeFrom),
          endTime: normalizeTime24(window.timeTo),
          weeksCount,
          isActiveOnMonday: applyDays.includes(1),
          isActiveOnTuesday: applyDays.includes(2),
          isActiveOnWednesday: applyDays.includes(3),
          isActiveOnThursday: applyDays.includes(4),
          isActiveOnFriday: applyDays.includes(5),
          isActiveOnSaturday: applyDays.includes(6),
          isActiveOnSunday: applyDays.includes(0),
        },
      };
    }

    const iso = singleDate!;
    const [sh, sm] = window.timeFrom.split(':').map(Number);
    const [eh, em] = window.timeTo.split(':').map(Number);
    const start = new Date(iso);
    start.setUTCHours(sh, sm, 0, 0);
    const end = new Date(iso);
    end.setUTCHours(eh, em, 0, 0);

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      isRepetitive: false,
      placeholder,
      singleBlock: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    };
  });
}

export function resolveRebalanceTargetDate(
  params: Record<string, unknown>,
  scheduleDates: string[],
): string | null {
  return (
    scheduleDates[0] ?? (params.date ? toIsoDay(String(params.date)) : null)
  );
}

export function mapSchedulingOrchestrationResult(result: {
  success: boolean;
  action: string;
  summary: string;
  details?: Record<string, unknown>;
  taskId?: string;
  requiresApproval?: boolean;
}) {
  return {
    success: result.success,
    action: result.action,
    summary: result.summary,
    details: {
      ...(result.details ?? {}),
      taskId: result.taskId,
      requiresApproval: result.requiresApproval,
    },
  };
}

export function selectBookingsToRebalance<
  T extends {
    id: string;
    employeeId: string;
    serviceId: string;
    startTime: Date;
  },
>(
  bookings: T[],
  slotCount: number,
  sourceEmployeeId: string,
  serviceId?: string,
): T[] {
  const eligible = bookings
    .filter((b) => b.employeeId === sourceEmployeeId)
    .filter((b) => !serviceId || b.serviceId === serviceId)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  return eligible.slice(0, Math.max(1, slotCount));
}
