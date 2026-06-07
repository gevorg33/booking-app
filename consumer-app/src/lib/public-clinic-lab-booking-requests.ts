export interface PublicClinicLabBookingRequest {
  orderId: string;
  displayNames: string | null;
  collectionServiceId: string;
  collectionServiceName: string;
  token: string;
  pushedAt: string;
  collectionBookingId: string | null;
  bookUrl: string;
}

export function normalizePublicClinicLabBookingRequestsPayload(
  payload: unknown,
): PublicClinicLabBookingRequest[] {
  if (Array.isArray(payload)) {
    return payload as PublicClinicLabBookingRequest[];
  }
  const data = (payload as { data?: unknown })?.data ?? payload;
  if (Array.isArray(data)) return data as PublicClinicLabBookingRequest[];
  const nested = (data as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as PublicClinicLabBookingRequest[]) : [];
}

/** In-app book path with clinic order token (mirrors public availability deep link). */
export function buildLabBookingRequestPath(
  slug: string,
  collectionServiceId: string,
  token: string,
): string {
  const params = new URLSearchParams({ clinicOrderToken: token });
  return `/s/${slug}/book/${collectionServiceId}?${params.toString()}`;
}
