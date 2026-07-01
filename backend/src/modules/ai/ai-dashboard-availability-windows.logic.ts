/** Dashboard check_availability OR window grouping (ai-cmd-ext-1.3 / avail-1.5 parity). */

import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import { getDateKeyInTimezone } from '../../common/utils/timezone.util.js';
import {
  formatTimeOfDayLabel,
  type TimeOfDayWindow,
} from './ai-operations.util.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import {
  resolvePublicAvailabilityWindows,
  type ResolvedPublicAvailabilityWindow,
} from './ai-orchestration.helpers.js';

export function enrichDashboardCheckAvailabilityParams(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  return enrichDiscoveryParamsFromPrompt(params, prompt);
}

export function shouldGroupDashboardAvailabilityByWindow(
  windows: readonly ResolvedPublicAvailabilityWindow[],
  params: Record<string, unknown>,
): boolean {
  if (windows.length > 1) return true;
  return (
    Array.isArray(params.availabilityWindows) &&
    params.availabilityWindows.length > 1
  );
}

export function buildDashboardAvailabilityWindowLabel(
  window: ResolvedPublicAvailabilityWindow,
  timeZone: string,
  todayDateKey: string,
): string {
  const dateKey = window.dateKeys[0];
  if (!dateKey) {
    return window.timeOfDay
      ? formatTimeOfDayLabel(window.timeOfDay)
      : 'Availability window';
  }

  const displayDay = formatDateDisplay(dateKey);
  const isToday = dateKey === todayDateKey;
  const isTomorrow =
    dateKey ===
    (() => {
      const d = new Date(`${todayDateKey}T12:00:00`);
      d.setUTCDate(d.getUTCDate() + 1);
      return d.toISOString().slice(0, 10);
    })();

  let dayLabel = displayDay;
  if (isToday) dayLabel = 'Today';
  else if (isTomorrow) dayLabel = 'Tomorrow';

  if (window.timeOfDay) {
    return `${dayLabel} ${formatTimeOfDayLabel(window.timeOfDay)}`;
  }
  return dayLabel;
}

export function resolveDashboardCheckAvailabilityWindows(
  params: Record<string, unknown>,
  prompt: string | undefined,
  timeZone: string,
): ResolvedPublicAvailabilityWindow[] {
  const enriched = enrichDashboardCheckAvailabilityParams(params, prompt);
  return resolvePublicAvailabilityWindows(enriched, prompt, timeZone);
}

export function buildSingleWindowCheckParams(
  params: Record<string, unknown>,
  window: ResolvedPublicAvailabilityWindow,
): Record<string, unknown> {
  const dateKey = window.dateKeys[0];
  const next: Record<string, unknown> = {
    ...params,
    availabilityWindows: undefined,
  };
  if (dateKey) next.date = dateKey;
  if (window.timeOfDay) next.timeOfDay = window.timeOfDay;
  return next;
}

export function dashboardAvailabilityTodayKey(timeZone: string): string {
  return getDateKeyInTimezone(new Date(), timeZone);
}
