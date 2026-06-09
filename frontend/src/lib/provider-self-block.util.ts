/** prov-exp-7.1 — dashboard toggle for provider self-service schedule blocks. */

export interface ProviderSelfBlockSettings {
  enabled: boolean;
}

export function readProviderSelfBlockSettings(
  raw?: Record<string, unknown> | null,
): ProviderSelfBlockSettings {
  const block = raw?.providerSelfBlock as Record<string, unknown> | undefined;
  return { enabled: block?.enabled === true };
}

export function normalizeProviderSelfBlockSettings(
  settings: ProviderSelfBlockSettings,
): ProviderSelfBlockSettings {
  return { enabled: settings.enabled === true };
}
