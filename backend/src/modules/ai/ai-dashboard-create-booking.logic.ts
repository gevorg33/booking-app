/** Dashboard create_booking budget/rank + OR-window first-available (ai-cmd-ext-1.4). */

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import { resolveDiscoverConstrainedService } from './ai-budget-list-services.logic.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { type ServiceCatalogPriceEntry } from './ai-service-catalog-rank.util.js';
import {
  buildNearestAvailabilityWindowQueries,
  type NearestAvailabilityWindowQuery,
} from './ai-nearest-slot-resolver.util.js';
import {
  filterSlotsByTimeOfDay,
  type TimeOfDayWindow,
} from './ai-operations.util.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export type DashboardCatalogService = ServiceCatalogPriceEntry & {
  id: string;
  name: string;
};

export type DashboardOpenSlot = { start: string; end: string };

export type DashboardFirstAvailablePick = {
  employeeId: string;
  employeeName: string;
  timeSlot: string;
  isoDay: string;
  sortKey: number;
  windowIndex?: number;
};

export function enrichDashboardCreateBookingParams(
  params: Record<string, unknown>,
  prompt?: string,
): Record<string, unknown> {
  return enrichDiscoveryParamsFromPrompt(params, prompt);
}

export function resolveDashboardCreateBookingService<T extends DashboardCatalogService>(
  catalog: readonly T[],
  params: Record<string, unknown>,
  resolveByName?: (name: string) => T | undefined,
): { service: T | null; noMatchSummary: string | null } {
  return resolveDiscoverConstrainedService(catalog, params, resolveByName);
}

export function computeDashboardSlotSortKey(
  isoDay: string,
  timeSlot: string,
  timeZone: string,
): number {
  return dayjs.tz(`${isoDay}T${timeSlot}:00`, timeZone).valueOf();
}

export function pickEarliestDashboardSlot(
  candidates: readonly DashboardFirstAvailablePick[],
): DashboardFirstAvailablePick | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) =>
    current.sortKey < best.sortKey ? current : best,
  );
}

export function findEarliestSlotOnDayForProviders(args: {
  isoDay: string;
  timeZone: string;
  timeOfDay: TimeOfDayWindow | null;
  notBeforeTime: string | null;
  providers: Array<{
    id: string;
    name: string;
    hasServiceBlock: boolean;
    openSlots: readonly DashboardOpenSlot[];
  }>;
  isSlotBookable: (
    isoDay: string,
    start: string,
    timeZone: string,
    notBefore: string | null,
  ) => boolean;
}): DashboardFirstAvailablePick | null {
  let best: DashboardFirstAvailablePick | null = null;

  for (const provider of args.providers) {
    if (!provider.hasServiceBlock || provider.openSlots.length === 0) continue;

    let slots = [...provider.openSlots];
    if (args.timeOfDay) {
      slots = filterSlotsByTimeOfDay(slots, args.timeOfDay);
    }

    for (const slot of slots) {
      if (
        !args.isSlotBookable(
          args.isoDay,
          slot.start,
          args.timeZone,
          args.notBeforeTime,
        )
      ) {
        continue;
      }

      const sortKey = computeDashboardSlotSortKey(
        args.isoDay,
        slot.start,
        args.timeZone,
      );
      if (!best || sortKey < best.sortKey) {
        best = {
          employeeId: provider.id,
          employeeName: provider.name,
          timeSlot: slot.start,
          isoDay: args.isoDay,
          sortKey,
        };
      }
    }
  }

  return best;
}

export async function findDashboardFirstAvailableAcrossWindows(
  windows: readonly NearestAvailabilityWindowQuery[],
  findOnDay: (args: {
    isoDay: string;
    timeOfDay: TimeOfDayWindow | null;
    notBeforeTime: string | null;
  }) => Promise<DashboardFirstAvailablePick | null>,
): Promise<DashboardFirstAvailablePick | null> {
  const candidates: DashboardFirstAvailablePick[] = [];

  for (let windowIndex = 0; windowIndex < windows.length; windowIndex++) {
    const window = windows[windowIndex]!;
    for (const isoDay of window.dateKeys) {
      const pick = await findOnDay({
        isoDay,
        timeOfDay: window.timeOfDay,
        notBeforeTime: window.notBeforeTime ?? null,
      });
      if (pick) {
        candidates.push({ ...pick, windowIndex });
      }
    }
  }

  return pickEarliestDashboardSlot(candidates);
}

export function buildDashboardFirstAvailableWindowQueries(
  params: Record<string, unknown>,
  prompt: string | undefined,
  timeZone: string,
): NearestAvailabilityWindowQuery[] {
  return buildNearestAvailabilityWindowQueries(params, prompt ?? '', timeZone);
}

export function shouldScanExplicitAvailabilityWindows(
  params: Record<string, unknown>,
  windowQueries: readonly NearestAvailabilityWindowQuery[],
): boolean {
  if (
    Array.isArray(params.availabilityWindows) &&
    params.availabilityWindows.length > 0
  ) {
    return true;
  }
  return windowQueries.some((window) => window.dateKeys.length > 0);
}
