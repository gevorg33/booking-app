export type MultiServiceSchedulingMode = 'same_visit' | 'per_service';
export type IncompatiblePairMode = 'service' | 'category';

/** Sentinel for services with no category when using category incompatible pairs. */
export const UNCATEGORIZED_CATEGORY_KEY = '__uncategorized__';

export interface MultiServiceSettings {
  enabled: boolean;
  maxServiceCount: number;
  maxDurationMinutes: number;
  turnoverBufferMinutes: number;
  schedulingMode: MultiServiceSchedulingMode;
  incompatiblePairMode: IncompatiblePairMode;
  incompatiblePairs: Array<[string, string]>;
  incompatibleCategoryPairs: Array<[string, string]>;
}

export const DEFAULT_MULTI_SERVICE_SETTINGS: MultiServiceSettings = {
  enabled: false,
  maxServiceCount: 5,
  maxDurationMinutes: 180,
  turnoverBufferMinutes: 5,
  schedulingMode: 'same_visit',
  incompatiblePairMode: 'service',
  incompatiblePairs: [],
  incompatibleCategoryPairs: [],
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

  const incompatiblePairMode =
    raw.incompatiblePairMode === 'category' ? 'category' : 'service';

  return {
    enabled: raw.enabled === true,
    maxServiceCount,
    maxDurationMinutes,
    turnoverBufferMinutes,
    schedulingMode,
    incompatiblePairMode,
    incompatiblePairs: normalizeIncompatiblePairs(raw.incompatiblePairs),
    incompatibleCategoryPairs: normalizeIncompatiblePairs(raw.incompatibleCategoryPairs),
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
    incompatiblePairMode: patch.incompatiblePairMode ?? current.incompatiblePairMode,
    incompatiblePairs: patch.incompatiblePairs ?? current.incompatiblePairs,
    incompatibleCategoryPairs:
      patch.incompatibleCategoryPairs ?? current.incompatibleCategoryPairs,
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
