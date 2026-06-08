/** n99-3.5 — link app analytics anonId to customer records for concierge nudges. */

export const CUSTOMER_ANALYTICS_ANON_METADATA_KEY = 'appAnalyticsAnonId';

export function readCustomerAnalyticsAnonId(
  metadata?: Record<string, unknown> | null,
): string | null {
  const raw = metadata?.[CUSTOMER_ANALYTICS_ANON_METADATA_KEY];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

export function mergeCustomerAnalyticsAnonMetadata(
  metadata: Record<string, unknown> | null | undefined,
  analyticsAnonId?: string | null,
): Record<string, unknown> {
  const next = { ...(metadata ?? {}) };
  const anon = analyticsAnonId?.trim();
  if (anon) next[CUSTOMER_ANALYTICS_ANON_METADATA_KEY] = anon;
  return next;
}
