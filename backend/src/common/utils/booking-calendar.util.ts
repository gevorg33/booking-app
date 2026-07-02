import { buildTenantPublicUrl } from './tenant-public-url.util.js';

export type BookingCalendarFormat = 'google' | 'outlook' | 'ics' | 'all';

export interface BookingCalendarEventInput {
  bookingId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
}

export interface BookingCalendarLinks {
  googleCalendarUrl: string;
  outlookCalendarUrl: string;
  icsDownloadUrl: string;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function formatUtcForIcs(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

export function buildIcsEventContent(input: BookingCalendarEventInput): string {
  const uid = `booking-${input.bookingId}@optischedule`;
  const dtStamp = formatUtcForIcs(new Date());
  const dtStart = formatUtcForIcs(input.startTime);
  const dtEnd = formatUtcForIcs(input.endTime);
  const summary = escapeIcsText(input.title);
  const description = input.description ? escapeIcsText(input.description) : '';
  const location = input.location ? escapeIcsText(input.location) : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OptiSchedule//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    ...(description ? [`DESCRIPTION:${description}`] : []),
    ...(location ? [`LOCATION:${location}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function buildGoogleCalendarUrl(
  input: BookingCalendarEventInput,
): string {
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', input.title);
  url.searchParams.set(
    'dates',
    `${formatUtcForIcs(input.startTime)}/${formatUtcForIcs(input.endTime)}`,
  );
  if (input.description) url.searchParams.set('details', input.description);
  if (input.location) url.searchParams.set('location', input.location);
  return url.toString();
}

export function buildOutlookCalendarUrl(
  input: BookingCalendarEventInput,
): string {
  const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  url.searchParams.set('path', '/calendar/action/compose');
  url.searchParams.set('subject', input.title);
  url.searchParams.set('startdt', input.startTime.toISOString());
  url.searchParams.set('enddt', input.endTime.toISOString());
  if (input.description) url.searchParams.set('body', input.description);
  if (input.location) url.searchParams.set('location', input.location);
  return url.toString();
}

export function buildBookingIcsDownloadUrl(
  publicApiUrl: string,
  slug: string,
  bookingId: string,
  token: string,
): string {
  const base = publicApiUrl.replace(/\/$/, '');
  const params = new URLSearchParams({ bookingId, token });
  return `${base}/public/${slug.trim().toLowerCase()}/bookings/manage/calendar.ics?${params.toString()}`;
}

export function buildBookingCalendarEventInput(input: {
  bookingId: string;
  serviceName: string;
  providerName?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  startTime: Date;
  endTime: Date;
}): BookingCalendarEventInput {
  const providerSuffix = input.providerName
    ? ` with ${input.providerName}`
    : '';
  const title = `${input.serviceName}${providerSuffix}`.trim();
  const location =
    input.businessAddress && input.businessName
      ? `${input.businessName} — ${input.businessAddress}`
      : (input.businessAddress ?? input.businessName ?? null);
  const description = [
    input.businessName ? `Salon: ${input.businessName}` : null,
    input.providerName ? `Provider: ${input.providerName}` : null,
    `Booking ID: ${input.bookingId}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    bookingId: input.bookingId,
    title,
    description,
    location,
    startTime: input.startTime,
    endTime: input.endTime,
  };
}

export function buildBookingCalendarLinks(input: {
  event: BookingCalendarEventInput;
  publicApiUrl: string;
  slug: string;
  manageToken: string;
}): BookingCalendarLinks {
  return {
    googleCalendarUrl: buildGoogleCalendarUrl(input.event),
    outlookCalendarUrl: buildOutlookCalendarUrl(input.event),
    icsDownloadUrl: buildBookingIcsDownloadUrl(
      input.publicApiUrl,
      input.slug,
      input.event.bookingId,
      input.manageToken,
    ),
  };
}

export function buildBookingCalendarManagePageUrl(
  frontendUrl: string,
  slug: string,
  bookingId: string,
  token: string,
  rootDomain?: string,
): string {
  return buildTenantPublicUrl({
    slug,
    frontendUrl,
    rootDomain,
    pathSuffix: '/manage',
    query: { bookingId, token, addToCalendar: '1' },
  });
}
