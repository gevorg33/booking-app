/** adopt-4.7 — home-screen widget snapshot (next appointment + quick rebook). */

import type { ConsumerCopy } from './copy.js';
import { formatCopy } from './copy.js';
import {
  buildConsumerAccountPushUrl,
  buildConsumerSalonPushUrl,
} from './deep-link.js';
import { buildRebookBookServicePushUrl } from './consumer-rebook.util.js';
import type { PublicCustomerBookingItem } from './types.js';

export const HOME_SCREEN_WIDGET_SNAPSHOT_VERSION = 1 as const;
export const HOME_SCREEN_WIDGET_STORAGE_KEY = 'home_screen_widget_snapshot';

const UPCOMING_STATUSES = new Set(['confirmed', 'pending']);
const REBOOK_STATUSES = new Set(['completed']);

export interface HomeScreenWidgetSection {
  title: string;
  serviceName: string;
  subtitle: string;
  deepLinkUrl: string;
}

export interface HomeScreenWidgetSnapshot {
  version: typeof HOME_SCREEN_WIDGET_SNAPSHOT_VERSION;
  updatedAt: string;
  slug: string;
  businessName: string;
  authed: boolean;
  nextAppointment: HomeScreenWidgetSection | null;
  quickRebook: HomeScreenWidgetSection | null;
  signedOut: {
    title: string;
    subtitle: string;
    deepLinkUrl: string;
  } | null;
}

export function pickNextUpcomingBooking(
  bookings: PublicCustomerBookingItem[],
  now: Date = new Date(),
): PublicCustomerBookingItem | null {
  const nowMs = now.getTime();
  const upcoming = bookings
    .filter(
      (booking) =>
        UPCOMING_STATUSES.has(booking.status.toLowerCase()) &&
        new Date(booking.startTime).getTime() > nowMs,
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  return upcoming[0] ?? null;
}

export function pickLastCompletedBooking(
  bookings: PublicCustomerBookingItem[],
): PublicCustomerBookingItem | null {
  const completed = bookings
    .filter((booking) => REBOOK_STATUSES.has(booking.status.toLowerCase()))
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  return completed[0] ?? null;
}

export function buildHomeScreenWidgetSnapshot(input: {
  slug: string;
  businessName: string;
  authed: boolean;
  bookings: PublicCustomerBookingItem[];
  copy: ConsumerCopy;
  formatDate: (iso: string) => string;
  formatTime: (iso: string) => string;
  now?: Date;
}): HomeScreenWidgetSnapshot {
  const now = input.now ?? new Date();
  const slug = input.slug.trim().toLowerCase();
  const emptySalonLink = buildConsumerSalonPushUrl(slug);

  if (!input.authed) {
    return {
      version: HOME_SCREEN_WIDGET_SNAPSHOT_VERSION,
      updatedAt: now.toISOString(),
      slug,
      businessName: input.businessName,
      authed: false,
      nextAppointment: null,
      quickRebook: null,
      signedOut: {
        title: input.copy.widgetSignedOutTitle,
        subtitle: input.copy.widgetSignedOutSubtitle,
        deepLinkUrl: emptySalonLink,
      },
    };
  }

  const next = pickNextUpcomingBooking(input.bookings, now);
  const rebook = pickLastCompletedBooking(input.bookings);

  const nextAppointment = next
    ? {
        title: input.copy.widgetNextAppointmentTitle,
        serviceName: next.serviceName,
        subtitle: formatCopy(input.copy.widgetNextAppointmentSubtitle, {
          date: input.formatDate(next.startTime),
          time: input.formatTime(next.startTime),
          provider: next.employeeName,
        }),
        deepLinkUrl: buildConsumerAccountPushUrl(slug),
      }
    : null;

  const quickRebook = rebook
    ? {
        title: input.copy.widgetQuickRebookTitle,
        serviceName: rebook.serviceName,
        subtitle: formatCopy(input.copy.widgetQuickRebookSubtitle, {
          provider: rebook.employeeName,
          time: input.formatTime(rebook.startTime),
        }),
        deepLinkUrl: appendRebookSourceWidget(
          buildRebookBookServicePushUrl(input.slug, rebook),
        ),
      }
    : null;

  return {
    version: HOME_SCREEN_WIDGET_SNAPSHOT_VERSION,
    updatedAt: now.toISOString(),
    slug,
    businessName: input.businessName,
    authed: true,
    nextAppointment,
    quickRebook,
    signedOut: null,
  };
}

function appendRebookSourceWidget(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set('rebookSource', 'widget');
  return parsed.toString();
}

export function serializeHomeScreenWidgetSnapshot(
  snapshot: HomeScreenWidgetSnapshot,
): string {
  return JSON.stringify(snapshot);
}

export function parseHomeScreenWidgetSnapshot(
  raw: string | null | undefined,
): HomeScreenWidgetSnapshot | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as HomeScreenWidgetSnapshot;
    if (parsed?.version !== HOME_SCREEN_WIDGET_SNAPSHOT_VERSION) return null;
    if (!parsed.slug?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}
