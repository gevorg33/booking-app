/**
 * e2e-bug.50 — derive public weekly opening hours from schedule templates
 * (SERVICE_BLOCK periods and legacy workingHours), not AI settings defaults.
 */

export const PUBLIC_OPENING_HOUR_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type PublicOpeningHourDay = (typeof PUBLIC_OPENING_HOUR_DAYS)[number];

export type PublicOpeningHourRange = { open: string; close: string };

export type PublicOpeningHoursDay = {
  day: PublicOpeningHourDay;
  closed: boolean;
  ranges: PublicOpeningHourRange[];
};

export type PublicOpeningHours = {
  days: PublicOpeningHoursDay[];
  summaryLines: string[];
};

export type PublicOpeningHoursTemplatePeriodInput = {
  type?: string;
  startTime?: string;
  endTime?: string;
  isActiveOnMonday?: boolean;
  isActiveOnTuesday?: boolean;
  isActiveOnWednesday?: boolean;
  isActiveOnThursday?: boolean;
  isActiveOnFriday?: boolean;
  isActiveOnSaturday?: boolean;
  isActiveOnSunday?: boolean;
};

export type PublicOpeningHoursTemplateInput = {
  isActive?: boolean;
  isDeleted?: boolean;
  dayOfWeek?: number | null;
  workingHours?: Array<{ startTime?: string; endTime?: string }> | null;
  periods?: PublicOpeningHoursTemplatePeriodInput[] | null;
};

const DAY_ABBR: Record<PublicOpeningHourDay, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const PERIOD_DAY_FLAGS: Array<{
  day: PublicOpeningHourDay;
  flag: keyof PublicOpeningHoursTemplatePeriodInput;
}> = [
  { day: 'monday', flag: 'isActiveOnMonday' },
  { day: 'tuesday', flag: 'isActiveOnTuesday' },
  { day: 'wednesday', flag: 'isActiveOnWednesday' },
  { day: 'thursday', flag: 'isActiveOnThursday' },
  { day: 'friday', flag: 'isActiveOnFriday' },
  { day: 'saturday', flag: 'isActiveOnSaturday' },
  { day: 'sunday', flag: 'isActiveOnSunday' },
];

function normalizeHhMm(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function rangeKey(ranges: PublicOpeningHourRange[]): string {
  if (ranges.length === 0) return 'closed';
  return ranges.map((r) => `${r.open}-${r.close}`).join(',');
}

function formatRangesLabel(ranges: PublicOpeningHourRange[]): string {
  if (ranges.length === 0) return 'Closed';
  return ranges.map((r) => `${r.open}–${r.close}`).join(', ');
}

function mergeRanges(ranges: PublicOpeningHourRange[]): PublicOpeningHourRange[] {
  if (ranges.length <= 1) return ranges.slice();
  const sorted = [...ranges].sort((a, b) => a.open.localeCompare(b.open));
  const merged: PublicOpeningHourRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (!last || range.open > last.close) {
      merged.push({ ...range });
      continue;
    }
    if (range.close > last.close) last.close = range.close;
  }
  return merged;
}

function emptyWeek(): Record<PublicOpeningHourDay, PublicOpeningHourRange[]> {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

function addRange(
  week: Record<PublicOpeningHourDay, PublicOpeningHourRange[]>,
  day: PublicOpeningHourDay,
  open: string,
  close: string,
) {
  if (open >= close) return;
  week[day].push({ open, close });
}

function collectFromPeriods(
  week: Record<PublicOpeningHourDay, PublicOpeningHourRange[]>,
  periods: PublicOpeningHoursTemplatePeriodInput[],
) {
  for (const period of periods) {
    if (period.type && period.type !== 'service_block') continue;
    const open = normalizeHhMm(period.startTime);
    const close = normalizeHhMm(period.endTime);
    if (!open || !close) continue;
    for (const { day, flag } of PERIOD_DAY_FLAGS) {
      if (period[flag] === true) addRange(week, day, open, close);
    }
  }
}

function collectFromLegacyWorkingHours(
  week: Record<PublicOpeningHourDay, PublicOpeningHourRange[]>,
  template: PublicOpeningHoursTemplateInput,
) {
  if (template.dayOfWeek == null || !Array.isArray(template.workingHours)) return;
  const day = PUBLIC_OPENING_HOUR_DAYS[template.dayOfWeek];
  if (!day) return;
  for (const slot of template.workingHours) {
    const open = normalizeHhMm(slot?.startTime);
    const close = normalizeHhMm(slot?.endTime);
    if (!open || !close) continue;
    addRange(week, day, open, close);
  }
}

/** Collapse consecutive days with identical ranges into Mon–Fri style lines. */
export function buildOpeningHoursSummaryLines(
  days: PublicOpeningHoursDay[],
): string[] {
  const lines: string[] = [];
  let i = 0;
  while (i < days.length) {
    const start = days[i]!;
    const key = rangeKey(start.ranges);
    let j = i + 1;
    while (j < days.length && rangeKey(days[j]!.ranges) === key) j += 1;
    const end = days[j - 1]!;
    const dayLabel =
      start.day === end.day
        ? DAY_ABBR[start.day]
        : `${DAY_ABBR[start.day]}–${DAY_ABBR[end.day]}`;
    lines.push(`${dayLabel} ${formatRangesLabel(start.ranges)}`);
    i = j;
  }
  return lines;
}

export function buildPublicOpeningHoursFromTemplates(
  templates: readonly PublicOpeningHoursTemplateInput[] | null | undefined,
): PublicOpeningHours | undefined {
  if (!templates?.length) return undefined;

  const week = emptyWeek();
  let sawAnySource = false;

  for (const template of templates) {
    if (template.isDeleted === true) continue;
    if (template.isActive === false) continue;

    const periods = Array.isArray(template.periods) ? template.periods : [];
    if (periods.length > 0) {
      collectFromPeriods(week, periods);
      sawAnySource = true;
      continue;
    }
    if (template.dayOfWeek != null && Array.isArray(template.workingHours)) {
      collectFromLegacyWorkingHours(week, template);
      sawAnySource = true;
    }
  }

  if (!sawAnySource) return undefined;

  const days: PublicOpeningHoursDay[] = PUBLIC_OPENING_HOUR_DAYS.map((day) => {
    const ranges = mergeRanges(week[day]);
    return { day, closed: ranges.length === 0, ranges };
  });

  // Omit entirely when every day is closed (no real open hours to show).
  if (days.every((d) => d.closed)) return undefined;

  return {
    days,
    summaryLines: buildOpeningHoursSummaryLines(days),
  };
}
