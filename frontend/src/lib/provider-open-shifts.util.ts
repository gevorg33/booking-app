/** prov-exp-7.3 — dashboard toggle for provider open shifts / gap highlights. */

export interface ProviderOpenShiftsSettings {
  enabled: boolean;
}

export function readProviderOpenShiftsSettings(
  raw?: Record<string, unknown> | null,
): ProviderOpenShiftsSettings {
  const block = raw?.providerOpenShifts as Record<string, unknown> | undefined;
  return { enabled: block?.enabled === true };
}

export function normalizeProviderOpenShiftsSettings(
  settings: ProviderOpenShiftsSettings,
): ProviderOpenShiftsSettings {
  return { enabled: settings.enabled === true };
}
