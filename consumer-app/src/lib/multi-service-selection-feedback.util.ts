import { getDisabledMultiServiceIds } from './multi-service-booking.js';
import type { MultiServiceAdminSettings } from './multi-service-booking.js';

export type BlockedMultiServiceAddReason =
  | 'max_count'
  | 'duration'
  | 'incompatible';

type ServiceRow = {
  id: string;
  category?: { id: string } | null;
  durationMinutes?: number;
  bufferMinutes?: number;
};

/**
 * e2e-bug.24 — why adding this service is blocked (for tap feedback on disabled rows).
 * Prefer max_count when the whole cart is at the ceiling; otherwise duration vs incompatible.
 */
export function resolveBlockedMultiServiceAddReason(input: {
  serviceId: string;
  selectedIds: string[];
  services: ServiceRow[];
  settings: Pick<
    MultiServiceAdminSettings,
    | 'incompatiblePairMode'
    | 'incompatiblePairs'
    | 'incompatibleCategoryPairs'
    | 'maxServiceCount'
    | 'maxDurationMinutes'
    | 'turnoverBufferMinutes'
  >;
}): BlockedMultiServiceAddReason | null {
  const { serviceId, selectedIds, services, settings } = input;
  if (selectedIds.includes(serviceId)) return null;

  const disabled = getDisabledMultiServiceIds({
    services,
    selectedIds,
    settings,
  });
  if (!disabled.has(serviceId)) return null;

  if (selectedIds.length >= settings.maxServiceCount) {
    return 'max_count';
  }

  // Isolate duration: would this id alone be disabled if incompatibility were empty?
  const durationOnly = getDisabledMultiServiceIds({
    services,
    selectedIds,
    settings: {
      ...settings,
      incompatiblePairs: [],
      incompatibleCategoryPairs: [],
    },
  });
  if (durationOnly.has(serviceId)) {
    return 'duration';
  }

  return 'incompatible';
}
