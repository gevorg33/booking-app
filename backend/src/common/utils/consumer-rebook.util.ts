/** adopt-6.4 — consumer rebook deep links with service, provider, and time. */

import { buildConsumerBookServicePushUrl } from './consumer-booking-push-link.util.js';

export interface ConsumerRebookQueryParams {
  date: string;
  slot: string;
  employeeId?: string;
  rebookBookingId?: string;
  rebook: '1';
}

export function deriveConsumerRebookQueryParams(input: {
  bookingId: string;
  startTime: Date | string;
  employeeId?: string | null;
}): ConsumerRebookQueryParams {
  const startTime =
    input.startTime instanceof Date ? input.startTime.toISOString() : input.startTime;
  return {
    date: startTime.slice(0, 10),
    slot: startTime,
    employeeId: input.employeeId?.trim() || undefined,
    rebookBookingId: input.bookingId,
    rebook: '1',
  };
}

export function appendConsumerRebookQueryParams(
  baseUrl: string,
  query: ConsumerRebookQueryParams,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('date', query.date);
  url.searchParams.set('slot', query.slot);
  url.searchParams.set('rebook', query.rebook);
  if (query.employeeId) url.searchParams.set('employeeId', query.employeeId);
  if (query.rebookBookingId) {
    url.searchParams.set('rebookBookingId', query.rebookBookingId);
  }
  return url.toString();
}

export function buildConsumerRebookPushUrl(input: {
  slug: string;
  serviceId: string;
  bookingId: string;
  startTime: Date | string;
  employeeId?: string | null;
}): string {
  const base = buildConsumerBookServicePushUrl(input.slug, input.serviceId);
  const query = deriveConsumerRebookQueryParams(input);
  return appendConsumerRebookQueryParams(base, query);
}

export function buildConsumerRebookAccountPath(input: {
  slug: string;
  serviceId: string;
  bookingId: string;
  startTime: Date | string;
  employeeId?: string | null;
}): string {
  const query = deriveConsumerRebookQueryParams(input);
  const params = new URLSearchParams({
    date: query.date,
    slot: query.slot,
    rebook: query.rebook,
  });
  if (query.employeeId) params.set('employeeId', query.employeeId);
  if (query.rebookBookingId) params.set('rebookBookingId', query.rebookBookingId);
  return `/s/${input.slug.trim()}/book/${input.serviceId.trim()}?${params.toString()}`;
}
