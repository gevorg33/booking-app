import api from '@/lib/api';

/** Unwrap Nest/API envelope `{ data: T }` or return payload as-is. */
export function unwrapBusinessApiPayload<T extends Record<string, unknown>>(
  response: unknown,
): T {
  if (!response || typeof response !== 'object') {
    return {} as T;
  }
  const wrapped = response as { data?: unknown };
  if (wrapped.data && typeof wrapped.data === 'object') {
    return wrapped.data as T;
  }
  return response as T;
}

/** Load latest business.settings from API (avoids stale React Query cache on save). */
export async function fetchBusinessSettings(
  businessId: string,
): Promise<Record<string, unknown>> {
  const { data } = await api.get(`/businesses/${businessId}`);
  const record = unwrapBusinessApiPayload<{ settings?: Record<string, unknown> }>(data);
  return record.settings ?? {};
}
