import { randomBytes } from 'crypto';

export const CLINIC_ORDER_BOOKING_REQUEST_TOKEN_METADATA_KEY =
  'clinicOrderToken';
export const CLINIC_STAFF_ORDER_LINK_METADATA_KEY = 'clinicStaffOrderId';

export interface ClinicLabBookingRequestView {
  orderId: string;
  displayNames: string | null;
  collectionServiceId: string;
  collectionServiceName: string;
  token: string;
  pushedAt: string;
  collectionBookingId: string | null;
  bookUrl: string;
}

export interface ClinicLabOrderBookingActionView {
  orderId: string;
  displayNames: string | null;
  status: string;
  customerId: string | null;
  bookingId: string | null;
  collectionBookingId: string | null;
  collectionServiceId: string | null;
  bookingRequestPushedAt: string | null;
  canPush: boolean;
  canStaffBook: boolean;
  supportedCollectionServices: Array<{ id: string; name: string }>;
}

export function generateClinicLabBookingRequestToken(): string {
  return randomBytes(24).toString('hex');
}

export function isClinicLabBookingRequestPending(order: {
  bookingRequestPushedAt?: Date | string | null;
  collectionBookingId?: string | null;
  status: string;
}): boolean {
  if (order.status === 'Cancelled' || order.status === 'Completed')
    return false;
  if (!order.bookingRequestPushedAt) return false;
  return !order.collectionBookingId;
}

export function canPushClinicLabBookingRequest(order: {
  collectionBookingId?: string | null;
  status: string;
  collectionServiceId?: string | null;
}): boolean {
  if (order.status === 'Cancelled' || order.status === 'Completed')
    return false;
  if (order.collectionBookingId) return false;
  return true;
}

export function canStaffBookCollectionForOrder(order: {
  collectionBookingId?: string | null;
  status: string;
  customerId?: string | null;
}): boolean {
  if (order.status === 'Cancelled' || order.status === 'Completed')
    return false;
  if (order.collectionBookingId) return false;
  if (!order.customerId) return false;
  return true;
}

export function buildClinicStaffOrderLinkMetadata(
  orderId: string,
): Record<string, unknown> {
  return { [CLINIC_STAFF_ORDER_LINK_METADATA_KEY]: orderId };
}

export function readClinicStaffOrderIdFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const value = metadata?.[CLINIC_STAFF_ORDER_LINK_METADATA_KEY];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function shouldSkipAutoLabOrderForBookingMetadata(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return (
    !!readClinicOrderBookingTokenFromMetadata(metadata) ||
    !!readClinicStaffOrderIdFromMetadata(metadata)
  );
}

export function buildClinicLabBookingRequestBookUrl(
  frontendUrl: string,
  slug: string,
  collectionServiceId: string,
  token: string,
): string {
  const base = frontendUrl.replace(/\/$/, '');
  const params = new URLSearchParams({
    serviceId: collectionServiceId,
    clinicOrderToken: token,
  });
  return `${base}/book/${slug}/any/availability?${params.toString()}`;
}

export function buildClinicLabBookingRequestAccountUrl(
  frontendUrl: string,
  slug: string,
): string {
  const base = frontendUrl.replace(/\/$/, '');
  return `${base}/book/${slug}/account?section=lab-requests`;
}

export function buildClinicOrderBookingMetadata(
  token: string,
): Record<string, unknown> {
  return { [CLINIC_ORDER_BOOKING_REQUEST_TOKEN_METADATA_KEY]: token };
}

export function readClinicOrderBookingTokenFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const value = metadata?.[CLINIC_ORDER_BOOKING_REQUEST_TOKEN_METADATA_KEY];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
