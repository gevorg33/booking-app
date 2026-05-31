export type MultiServiceSchedulingMode = 'same_visit' | 'per_service';

export interface MultiServicePublicSettings {
  enabled: boolean;
  maxServiceCount: number;
  maxDurationMinutes: number;
  schedulingMode: MultiServiceSchedulingMode;
}

export interface MultiServiceAdminSettings extends MultiServicePublicSettings {
  turnoverBufferMinutes: number;
  incompatiblePairs: Array<[string, string]>;
}

export const DEFAULT_MULTI_SERVICE_ADMIN_SETTINGS: MultiServiceAdminSettings = {
  enabled: false,
  maxServiceCount: 5,
  maxDurationMinutes: 180,
  turnoverBufferMinutes: 5,
  schedulingMode: 'same_visit',
  incompatiblePairs: [],
};

export function sumMultiServiceDuration(
  services: Array<{ durationMinutes: number; bufferMinutes?: number }>,
  turnoverBufferMinutes = 0,
): number {
  const base = services.reduce(
    (sum, svc) => sum + svc.durationMinutes + (svc.bufferMinutes ?? 0),
    0,
  );
  if (services.length <= 1) return base;
  return base + (services.length - 1) * turnoverBufferMinutes;
}

export function sumMultiServicePrice(
  services: Array<{ price: number }>,
): number {
  return Math.round(services.reduce((sum, svc) => sum + Number(svc.price), 0) * 100) / 100;
}

export function findIncompatiblePairLabels(
  selectedIds: string[],
  pairs: Array<[string, string]>,
  nameById: Record<string, string>,
): string[] {
  const selected = new Set(selectedIds);
  const warnings: string[] = [];
  for (const [a, b] of pairs) {
    if (selected.has(a) && selected.has(b)) {
      warnings.push(`${nameById[a] ?? a} cannot be combined with ${nameById[b] ?? b}`);
    }
  }
  return warnings;
}

export function multiServiceCartErrors(input: {
  selectedIds: string[];
  settings: MultiServicePublicSettings;
  totalDurationMinutes: number;
  incompatibleWarnings: string[];
}): string[] {
  const errors: string[] = [...input.incompatibleWarnings];
  if (input.selectedIds.length >= 2 && input.selectedIds.length > input.settings.maxServiceCount) {
    errors.push(`Select at most ${input.settings.maxServiceCount} services`);
  }
  if (
    input.selectedIds.length >= 2 &&
    input.totalDurationMinutes > input.settings.maxDurationMinutes
  ) {
    errors.push(
      `Total duration (${input.totalDurationMinutes} min) exceeds the ${input.settings.maxDurationMinutes} minute limit`,
    );
  }
  return errors;
}
