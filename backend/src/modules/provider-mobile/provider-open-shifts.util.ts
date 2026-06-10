/** prov-exp-7.3 — open schedule gaps (>30m) on provider calendar with waitlist AI. */

import { normalizeTime24, timeToMinutes } from '../../common/utils/time-format.util.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import type { TimeInterval } from '../schedule/helpers/schedule-gap.helpers.js';

export interface ProviderOpenShiftsSettings {
  enabled: boolean;
}

export interface ProviderScheduleGapView {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export const PROVIDER_OPEN_SHIFTS_MIN_GAP_MINUTES = 31;

export const PROVIDER_OPEN_SHIFTS_DEFAULT_WINDOW = {
  timeFrom: '09:00',
  timeTo: '19:00',
} as const;

export const PROVIDER_OPEN_SHIFTS_WAITLIST_SUGGESTION_LIMIT = 3;

export function readProviderOpenShiftsSettings(
  raw?: Record<string, unknown> | null,
): ProviderOpenShiftsSettings {
  const block = raw?.providerOpenShifts as Record<string, unknown> | undefined;
  return { enabled: block?.enabled === true };
}

export function isProviderOpenShiftsEnabled(
  settings: ProviderOpenShiftsSettings,
): boolean {
  return settings.enabled;
}

export function normalizeProviderOpenShiftsSettings(
  settings: ProviderOpenShiftsSettings,
): ProviderOpenShiftsSettings {
  return { enabled: settings.enabled === true };
}

export function normalizeScheduleDateKey(value: string): string | null {
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

export function gapDurationMinutes(startTime: string, endTime: string): number {
  const start = timeToMinutes(normalizeTime24(startTime));
  const end = timeToMinutes(normalizeTime24(endTime));
  return Math.max(0, end - start);
}

export function mapScheduleGapsForOpenShifts(
  gaps: Array<{ startTime: string; endTime: string }>,
): ProviderScheduleGapView[] {
  return gaps.map((gap) => ({
    startTime: gap.startTime,
    endTime: gap.endTime,
    durationMinutes: gapDurationMinutes(gap.startTime, gap.endTime),
  }));
}

export function findOpenShiftsInWindow(
  targetDate: Date,
  occupied: TimeInterval[],
  options?: {
    timeFrom?: string;
    timeTo?: string;
    minGapMinutes?: number;
  },
): ProviderScheduleGapView[] {
  const window = {
    timeFrom: options?.timeFrom ?? PROVIDER_OPEN_SHIFTS_DEFAULT_WINDOW.timeFrom,
    timeTo: options?.timeTo ?? PROVIDER_OPEN_SHIFTS_DEFAULT_WINDOW.timeTo,
  };
  const minGapMinutes =
    options?.minGapMinutes ?? PROVIDER_OPEN_SHIFTS_MIN_GAP_MINUTES;
  return mapScheduleGapsForOpenShifts(
    findScheduleGapsInWindow(
      targetDate,
      window.timeFrom,
      window.timeTo,
      occupied,
      minGapMinutes,
    ),
  );
}

export function buildFillGapAiPrompt(
  dateKey: string,
  gap: Pick<ProviderScheduleGapView, 'startTime' | 'endTime'>,
): string {
  return `Fill this gap on ${dateKey} from ${gap.startTime} to ${gap.endTime} — suggest waitlist customers who could book it.`;
}

export function isFillGapPrompt(prompt: string): boolean {
  return /fill\s+(?:this\s+)?gap|suggest\s+waitlist.*gap|waitlist.*fill.*gap/i.test(
    prompt,
  );
}

export function extractGapWindowFromPrompt(prompt: string): {
  timeFrom: string | null;
  timeTo: string | null;
} {
  const range = prompt.match(
    /(\d{1,2}:\d{2})\s*(?:to|–|-)\s*(\d{1,2}:\d{2})/i,
  );
  if (!range) {
    return { timeFrom: null, timeTo: null };
  }
  return {
    timeFrom: normalizeTime24(range[1]),
    timeTo: normalizeTime24(range[2]),
  };
}

export function formatWaitlistGapSuggestionSummary(input: {
  dateLabel: string;
  gap: Pick<ProviderScheduleGapView, 'startTime' | 'endTime'>;
  waitlistNames: string[];
}): string {
  const window = `${input.gap.startTime}–${input.gap.endTime}`;
  if (input.waitlistNames.length === 0) {
    return `No waitlist customers found to fill the ${window} gap on ${input.dateLabel}. Tag customers with "waitlist" in CRM.`;
  }
  const names = input.waitlistNames.slice(
    0,
    PROVIDER_OPEN_SHIFTS_WAITLIST_SUGGESTION_LIMIT,
  );
  const suffix =
    input.waitlistNames.length > names.length
      ? ` (+${input.waitlistNames.length - names.length} more on waitlist)`
      : '';
  return `Waitlist candidates for your ${window} gap on ${input.dateLabel}: ${names.join(', ')}${suffix}. Contact them to offer this slot.`;
}
