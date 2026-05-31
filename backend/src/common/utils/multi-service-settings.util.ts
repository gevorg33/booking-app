export type MultiServiceSchedulingMode = 'same_visit' | 'per_service';

export interface MultiServiceSettings {
  enabled: boolean;
  maxServiceCount: number;
  maxDurationMinutes: number;
  turnoverBufferMinutes: number;
  schedulingMode: MultiServiceSchedulingMode;
  incompatiblePairs: Array<[string, string]>;
}

export const DEFAULT_MULTI_SERVICE_SETTINGS: MultiServiceSettings = {
  enabled: false,
  maxServiceCount: 5,
  maxDurationMinutes: 180,
  turnoverBufferMinutes: 5,
  schedulingMode: 'same_visit',
  incompatiblePairs: [],
};

export function resolveMultiServiceSettings(
  settings: Record<string, unknown> | null | undefined,
): MultiServiceSettings {
  const publicBooking = (settings?.publicBooking as Record<string, unknown> | undefined) ?? {};
  const raw = (publicBooking.multiService as Record<string, unknown> | undefined) ?? {};

  const maxServiceCount = parsePositiveInt(raw.maxServiceCount, DEFAULT_MULTI_SERVICE_SETTINGS.maxServiceCount);
  const maxDurationMinutes = parsePositiveInt(
    raw.maxDurationMinutes,
    DEFAULT_MULTI_SERVICE_SETTINGS.maxDurationMinutes,
  );
  const turnoverBufferMinutes = parseNonNegativeInt(
    raw.turnoverBufferMinutes,
    DEFAULT_MULTI_SERVICE_SETTINGS.turnoverBufferMinutes,
  );

  const schedulingMode =
    raw.schedulingMode === 'per_service' ? 'per_service' : 'same_visit';

  return {
    enabled: raw.enabled === true,
    maxServiceCount,
    maxDurationMinutes,
    turnoverBufferMinutes,
    schedulingMode,
    incompatiblePairs: normalizeIncompatiblePairs(raw.incompatiblePairs),
  };
}

export function mergeMultiServiceSettingsPatch(
  current: MultiServiceSettings,
  patch: Partial<MultiServiceSettings>,
): MultiServiceSettings {
  return {
    enabled: patch.enabled ?? current.enabled,
    maxServiceCount: patch.maxServiceCount ?? current.maxServiceCount,
    maxDurationMinutes: patch.maxDurationMinutes ?? current.maxDurationMinutes,
    turnoverBufferMinutes: patch.turnoverBufferMinutes ?? current.turnoverBufferMinutes,
    schedulingMode: patch.schedulingMode ?? current.schedulingMode,
    incompatiblePairs: patch.incompatiblePairs ?? current.incompatiblePairs,
  };
}

export function applyMultiServiceSettingsToBusinessSettings(
  settings: Record<string, unknown>,
  multiService: MultiServiceSettings,
): Record<string, unknown> {
  const publicBooking = { ...((settings.publicBooking as Record<string, unknown>) ?? {}) };
  publicBooking.multiService = multiService;
  return { ...settings, publicBooking };
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function parseNonNegativeInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function normalizeIncompatiblePairs(value: unknown): Array<[string, string]> {
  if (!Array.isArray(value)) return [];
  const pairs: Array<[string, string]> = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const a = String(entry[0] ?? '').trim();
    const b = String(entry[1] ?? '').trim();
    if (!a || !b || a === b) continue;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (pairs.some(([x, y]) => (x < y ? `${x}|${y}` : `${y}|${x}`) === key)) continue;
    pairs.push(a < b ? [a, b] : [b, a]);
  }
  return pairs;
}
