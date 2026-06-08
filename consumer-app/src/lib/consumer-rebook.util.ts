/** adopt-6.4 — one-tap rebook with last service, provider, and time. */

import {
  buildBookServicePath,
  buildConsumerBookServicePushUrl,
} from './deep-link.js';
import { pickLastCompletedBooking } from './home-screen-widget.util.js';
import type { PublicCustomerBookingItem } from './types.js';

export interface RebookQueryParams {
  date: string;
  slot: string;
  employeeId?: string;
  rebookBookingId?: string;
  rebook: '1';
}

export interface AccountRebookTarget {
  booking: PublicCustomerBookingItem;
  path: string;
  pushUrl: string;
  query: RebookQueryParams;
}

export function deriveRebookQueryParams(
  booking: Pick<PublicCustomerBookingItem, 'id' | 'startTime' | 'employeeId'>,
): RebookQueryParams {
  return {
    date: booking.startTime.slice(0, 10),
    slot: booking.startTime,
    employeeId: booking.employeeId?.trim() || undefined,
    rebookBookingId: booking.id,
    rebook: '1',
  };
}

export function appendRebookQueryParams(
  basePathOrUrl: string,
  query: RebookQueryParams,
): string {
  const absolute = basePathOrUrl.includes('://');
  const url = new URL(absolute ? basePathOrUrl : `https://local.invalid${basePathOrUrl}`);
  url.searchParams.set('date', query.date);
  url.searchParams.set('slot', query.slot);
  url.searchParams.set('rebook', query.rebook);
  if (query.employeeId) url.searchParams.set('employeeId', query.employeeId);
  if (query.rebookBookingId) {
    url.searchParams.set('rebookBookingId', query.rebookBookingId);
  }
  return absolute ? url.toString() : `${url.pathname}${url.search}`;
}

export function buildRebookBookServicePath(
  slug: string,
  booking: Pick<PublicCustomerBookingItem, 'id' | 'serviceId' | 'startTime' | 'employeeId'>,
): string {
  const query = deriveRebookQueryParams(booking);
  const base = buildBookServicePath(slug, booking.serviceId, {
    employeeId: booking.employeeId,
  });
  return appendRebookQueryParams(base, query);
}

export function buildRebookBookServicePushUrl(
  slug: string,
  booking: Pick<PublicCustomerBookingItem, 'id' | 'serviceId' | 'startTime' | 'employeeId'>,
): string {
  const query = deriveRebookQueryParams(booking);
  const base = buildConsumerBookServicePushUrl(slug, booking.serviceId, {
    employeeId: booking.employeeId,
  });
  return appendRebookQueryParams(base, query);
}

export function resolveAccountRebookTarget(
  bookings: PublicCustomerBookingItem[],
  slug: string,
): AccountRebookTarget | null {
  const booking = pickLastCompletedBooking(bookings);
  if (!booking) return null;
  const query = deriveRebookQueryParams(booking);
  return {
    booking,
    path: buildRebookBookServicePath(slug, booking),
    pushUrl: buildRebookBookServicePushUrl(slug, booking),
    query,
  };
}

export function readRebookLaunchContext(search: string): {
  isRebook: boolean;
  bookingId?: string;
  source: 'widget' | 'deep_link';
} {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const isRebook = params.get('rebook') === '1';
  return {
    isRebook,
    bookingId: params.get('rebookBookingId')?.trim() || undefined,
    source: params.get('rebookSource') === 'widget' ? 'widget' : 'deep_link',
  };
}
