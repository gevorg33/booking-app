import { formatNearestSlotStartTimeLabel } from '../../common/i18n/locale-date.util.js';
import type { AppLocale } from '../../common/i18n/messages.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import type { TimeOfDayWindow } from './ai-operations.util.js';

export type NoSlotMessageScenario = 'no_providers' | 'no_nearest_slot';

export interface NoSlotMessageInput {
  serviceName: string;
  dateKey?: string | null;
  timeOfDay?: TimeOfDayWindow | string | null;
  notBeforeTime?: string | null;
  scenario: NoSlotMessageScenario;
}

const TIME_OF_DAY_LABELS: Record<TimeOfDayWindow, string> = {
  morning: 'the morning (before 12:00)',
  afternoon: 'the afternoon (12:00–17:00)',
  evening: 'the evening (after 17:00)',
};

const ALTERNATE_WINDOWS: Record<TimeOfDayWindow, TimeOfDayWindow[]> = {
  morning: ['afternoon', 'evening'],
  afternoon: ['morning', 'evening'],
  evening: ['morning', 'afternoon'],
};

function normalizeTimeOfDay(
  value: string | null | undefined,
): TimeOfDayWindow | null {
  if (value === 'morning' || value === 'afternoon' || value === 'evening') {
    return value;
  }
  return null;
}

function formatDayPhrase(dateKey?: string | null): string {
  if (!dateKey) return 'the requested day';
  return formatDateDisplay(dateKey);
}

function formatWindowPhrase(
  timeOfDay: TimeOfDayWindow | null,
  notBeforeTime?: string | null,
): string | null {
  if (timeOfDay) return TIME_OF_DAY_LABELS[timeOfDay];
  if (notBeforeTime) return `after ${notBeforeTime}`;
  return null;
}

/** Actionable alternatives when a time window has no availability. */
export function buildNoSlotSuggestions(
  timeOfDay?: TimeOfDayWindow | string | null,
): string[] {
  const window = normalizeTimeOfDay(
    typeof timeOfDay === 'string' ? timeOfDay : null,
  );
  if (!window) {
    return [
      'Try another time of day (morning, afternoon, or evening).',
      'Try a different date.',
    ];
  }

  const alts = ALTERNATE_WINDOWS[window].map(
    (part) => TIME_OF_DAY_LABELS[part],
  );
  return [
    `Try ${alts[0]} or ${alts[1]} the same day.`,
    'Or pick another date.',
  ];
}

function joinSuggestions(suggestions: string[]): string {
  return suggestions.join(' ');
}

/** NL summary when provider check returns nobody free. */
export function buildNoProvidersAvailableMessage(
  input: Omit<NoSlotMessageInput, 'scenario'>,
): string {
  const day = formatDayPhrase(input.dateKey);
  const window = formatWindowPhrase(
    normalizeTimeOfDay(input.timeOfDay),
    input.notBeforeTime,
  );
  const suggestions = joinSuggestions(buildNoSlotSuggestions(input.timeOfDay));

  if (window) {
    return `No providers are free for ${input.serviceName} on ${day} during ${window}. ${suggestions}`;
  }
  return `No providers are free for ${input.serviceName} on ${day}. ${suggestions}`;
}

function resolveAppLocale(value: unknown): AppLocale {
  if (value === 'hy' || value === 'ru' || value === 'en') return value;
  return 'en';
}

/** NL summary when a nearest slot is found and ready to book. */
export function buildNearestSlotBookedMessage(input: {
  startTime: string;
  employeeName: string;
  locale?: unknown;
}): string {
  const label = formatNearestSlotStartTimeLabel(
    input.startTime,
    resolveAppLocale(input.locale),
  );
  return `Nearest slot: ${label} with ${input.employeeName}.`;
}

/** NL summary when the soonest opening is found (read-only). */
export function buildSoonestAppointmentFoundMessage(input: {
  startTime: string;
  employeeName: string;
  serviceName?: string;
  locale?: unknown;
}): string {
  const label = formatNearestSlotStartTimeLabel(
    input.startTime,
    resolveAppLocale(input.locale),
  );
  const servicePhrase = input.serviceName ? ` for ${input.serviceName}` : '';
  return `Soonest opening${servicePhrase}: ${label} with ${input.employeeName}.`;
}

/** NL summary when nearest/first-available booking finds no open slot. */
export function buildNoNearestSlotMessage(
  input: Omit<NoSlotMessageInput, 'scenario'>,
): string {
  const day = formatDayPhrase(input.dateKey);
  const window = formatWindowPhrase(
    normalizeTimeOfDay(input.timeOfDay),
    input.notBeforeTime,
  );
  const suggestions = joinSuggestions(buildNoSlotSuggestions(input.timeOfDay));

  if (window) {
    return `No bookable slot for ${input.serviceName} on ${day} during ${window}. ${suggestions}`;
  }
  return `No bookable slot for ${input.serviceName} on ${day}. ${suggestions}`;
}

export function buildNoSlotAvailabilityMessage(
  input: NoSlotMessageInput,
): string {
  if (input.scenario === 'no_providers') {
    return buildNoProvidersAvailableMessage(input);
  }
  return buildNoNearestSlotMessage(input);
}
