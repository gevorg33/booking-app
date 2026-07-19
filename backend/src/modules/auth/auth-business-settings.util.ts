/**
 * Safe settings slice for auth login/register/switch/me responses.
 * e2e-bug.61 — dashboard lab pages gate on `business.settings.businessType`;
 * never return integrations/secrets from full `Business.settings`.
 */
export function buildAuthBusinessSettings(
  settings?: Record<string, unknown> | null,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const businessType = settings?.businessType;
  if (typeof businessType === 'string' && businessType.trim()) {
    out.businessType = businessType.trim();
  }
  return out;
}
