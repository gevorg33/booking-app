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
  rebookSource?: 'account' | 'widget';
}

export type RebookLaunchSource = 'account' | 'widget' | 'deep_link';

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
  if (query.rebookSource) {
    url.searchParams.set('rebookSource', query.rebookSource);
  }
  return absolute ? url.toString() : `${url.pathname}${url.search}`;
}

/** Shift past rebook dates to today while preserving preferred time-of-day. */
export function normalizeRebookPrefill(input: {
  date: string;
  slot: string;
  now?: Date;
}): { date: string; slot: string } {
  const now = input.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  const slotDay = input.slot?.slice(0, 10) ?? input.date;
  if (slotDay >= today) {
    return { date: input.date.slice(0, 10), slot: input.slot };
  }
  const timePart = input.slot.includes('T') ? input.slot.slice(11) : '';
  return {
    date: today,
    slot: timePart ? `${today}T${timePart}` : input.slot,
  };
}

export function buildRebookBookServicePath(
  slug: string,
  booking: Pick<PublicCustomerBookingItem, 'id' | 'serviceId' | 'startTime' | 'employeeId'>,
  options?: { source?: 'account' | 'widget' },
): string {
  const query: RebookQueryParams = {
    ...deriveRebookQueryParams(booking),
    rebookSource: options?.source,
  };
  const base = buildBookServicePath(slug, booking.serviceId, {
    employeeId: booking.employeeId,
  });
  return appendRebookQueryParams(base, query);
}

export function buildRebookBookServicePushUrl(
  slug: string,
  booking: Pick<PublicCustomerBookingItem, 'id' | 'serviceId' | 'startTime' | 'employeeId'>,
  options?: { source?: 'widget' },
): string {
  const query: RebookQueryParams = {
    ...deriveRebookQueryParams(booking),
    rebookSource: options?.source ?? 'widget',
  };
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
  const query: RebookQueryParams = {
    ...deriveRebookQueryParams(booking),
    rebookSource: 'account',
  };
  return {
    booking,
    path: buildRebookBookServicePath(slug, booking, { source: 'account' }),
    pushUrl: buildRebookBookServicePushUrl(slug, booking, { source: 'widget' }),
    query,
  };
}

export function readRebookLaunchContext(search: string): {
  isRebook: boolean;
  bookingId?: string;
  source: RebookLaunchSource;
} {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const isRebook = params.get('rebook') === '1';
  const rebookSource = params.get('rebookSource')?.trim();
  const source: RebookLaunchSource =
    rebookSource === 'widget'
      ? 'widget'
      : rebookSource === 'account'
        ? 'account'
        : 'deep_link';
  return {
    isRebook,
    bookingId: params.get('rebookBookingId')?.trim() || undefined,
    source,
  };
}
