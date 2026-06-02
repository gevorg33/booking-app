function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep-merge partial settings patches without dropping unrelated keys (e.g. branding). */
export function mergeBusinessSettings(
  existing: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const base: Record<string, unknown> = { ...(existing ?? {}) };
  if (!patch) return base;

  for (const [key, patchValue] of Object.entries(patch)) {
    const existingValue = base[key];
    if (isPlainObject(patchValue) && isPlainObject(existingValue)) {
      base[key] = mergeBusinessSettings(existingValue, patchValue);
    } else {
      base[key] = patchValue;
    }
  }

  return base;
}
