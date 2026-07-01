import {
  BookingStatus,
  type Booking,
} from '../booking/entities/booking.entity.js';
import {
  formatDateDisplay,
  formatTimeRangeDisplay,
} from '../../common/utils/date-format.util.js';
import {
  buildBookingCalendarEventInput,
  buildBookingCalendarLinks,
  buildBookingCalendarManagePageUrl,
  type BookingCalendarFormat,
} from '../../common/utils/booking-calendar.util.js';
import { ensureBookingManageToken } from '../../common/utils/booking-manage-token.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  matchCustomerOwnedBooking,
  type CustomerOwnedBookingMatchInput,
} from './ai-cancel-my-booking.util.js';
import {
  buildRescheduleOwnedBookingMatchParams,
  enrichRescheduleMyBookingParamsFromPrompt,
} from './ai-reschedule-my-booking.util.js';
import {
  parseAddBookingToCalendarFromPrompt,
  type ParsedAddBookingToCalendar,
} from './ai-add-booking-to-calendar.util.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  return (
    (params.sessionCustomerId as string | undefined) ??
    (params.customerId as string | undefined)
  );
}

async function resolveBusinessSlug(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

async function resolveBookingForCalendar(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string,
  parsed: ParsedAddBookingToCalendar,
): Promise<{ booking: Booking | null; ambiguous: Booking[] }> {
  const customerId = resolveSessionCustomerId(params);
  const bookingId =
    parsed.bookingId ?? (params.bookingId as string | undefined) ?? undefined;

  if (bookingId) {
    const booking = await deps.bookingRepo.findOne({
      where: {
        id: bookingId,
        businessId,
        ...(customerId ? { customerId } : {}),
      },
      relations: { employee: true, service: true },
    });
    return { booking: booking ?? null, ambiguous: [] };
  }

  if (!customerId) {
    return { booking: null, ambiguous: [] };
  }

  const enrichedParams = enrichRescheduleMyBookingParamsFromPrompt(
    params,
    prompt,
    String(params._timeZone ?? 'UTC'),
  );
  const matchParams = buildRescheduleOwnedBookingMatchParams(enrichedParams);
  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      customerId,
      status: BookingStatus.CONFIRMED,
    },
    relations: { employee: true, service: true },
    order: { startTime: 'ASC' },
  });

  const matched = matchCustomerOwnedBooking(
    bookings as CustomerOwnedBookingMatchInput[],
    matchParams,
    '',
    String(params._timeZone ?? 'UTC'),
    { allowFirstWhenUnspecified: true },
  );
  return {
    booking: matched.booking as Booking | null,
    ambiguous: matched.ambiguous as Booking[],
  };
}

function pickCalendarLinks(
  links: ReturnType<typeof buildBookingCalendarLinks>,
  format: BookingCalendarFormat,
) {
  if (format === 'google') {
    return { googleCalendarUrl: links.googleCalendarUrl };
  }
  if (format === 'outlook') {
    return { outlookCalendarUrl: links.outlookCalendarUrl };
  }
  if (format === 'ics') {
    return { icsDownloadUrl: links.icsDownloadUrl };
  }
  return links;
}

function buildFormatSummary(
  format: BookingCalendarFormat,
  when: string,
  serviceName: string,
): string {
  if (format === 'google') {
    return `Open Google Calendar to add your ${serviceName} appointment on ${when}.`;
  }
  if (format === 'outlook') {
    return `Use the Outlook link to add your ${serviceName} appointment on ${when}.`;
  }
  if (format === 'ics') {
    return `Download the ICS file for your ${serviceName} appointment on ${when}.`;
  }
  return `Add your ${serviceName} appointment on ${when} to Google Calendar, Outlook, or download the ICS file.`;
}

export async function handleAddBookingToCalendarLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseAddBookingToCalendarFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'add_booking_to_calendar',
      'Ask to add your booking to calendar (e.g. "Add to my calendar" or "Send me an ICS").',
      { clarify: true, missing: ['format'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('add_booking_to_calendar', 'Business not found.');
  }

  const slug = business.slug ?? (await resolveBusinessSlug(deps, businessId));
  if (!slug) {
    return failure('add_booking_to_calendar', 'Business not found.');
  }

  const resolved = await resolveBookingForCalendar(
    deps,
    businessId,
    params,
    String(prompt ?? params._prompt ?? ''),
    parsed,
  );

  if (resolved.ambiguous.length > 1) {
    return failure(
      'add_booking_to_calendar',
      'You have more than one upcoming appointment. Name the service or date so I can build the right calendar link.',
      {
        clarify: true,
        missing: ['bookingId'],
        candidates: resolved.ambiguous.map((row) => ({
          bookingId: row.id,
          serviceName: row.service?.name,
          startTime: row.startTime.toISOString(),
        })),
      },
    );
  }

  if (!resolved.booking) {
    return failure(
      'add_booking_to_calendar',
      resolveSessionCustomerId(params)
        ? 'I could not find an upcoming booking to add to your calendar.'
        : 'Finish booking or sign in so I can add your appointment to calendar.',
      {
        clarify: true,
        missing: ['bookingId'],
        navigate: resolveSessionCustomerId(params)
          ? { path: 'account', query: { tab: 'bookings' } }
          : undefined,
      },
    );
  }

  const locale =
    typeof params.locale === 'string' ? params.locale.trim() : undefined;
  const serviceName = resolved.booking.service?.name ?? 'your appointment';
  const when = `${formatDateDisplay(resolved.booking.startTime, locale)} ${formatTimeRangeDisplay(resolved.booking.startTime, resolved.booking.endTime, locale)}`;
  const token = await ensureBookingManageToken(
    deps.bookingRepo,
    resolved.booking.id,
  );
  const frontendUrl =
    deps.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  const publicApiUrl =
    deps.configService.get<string>('PUBLIC_API_URL') || 'http://localhost:3001';
  const rootDomain = deps.configService.get<string>('ROOT_DOMAIN');

  const event = buildBookingCalendarEventInput({
    bookingId: resolved.booking.id,
    serviceName,
    providerName: resolved.booking.employee?.name ?? null,
    businessName: business.name ?? null,
    businessAddress: business.address ?? null,
    startTime: resolved.booking.startTime,
    endTime: resolved.booking.endTime,
  });
  const links = buildBookingCalendarLinks({
    event,
    publicApiUrl,
    slug,
    manageToken: token,
  });
  const selectedLinks = pickCalendarLinks(links, parsed.format);
  const manageUrl = buildBookingCalendarManagePageUrl(
    frontendUrl,
    slug,
    resolved.booking.id,
    token,
    rootDomain,
  );

  return success(
    'add_booking_to_calendar',
    buildFormatSummary(parsed.format, when, serviceName),
    {
      format: parsed.format,
      bookingId: resolved.booking.id,
      serviceName,
      startTime: resolved.booking.startTime.toISOString(),
      endTime: resolved.booking.endTime.toISOString(),
      ...selectedLinks,
      ...(parsed.format === 'all' ? links : {}),
      manageUrl,
      navigate: {
        path: 'account',
        query: {
          tab: 'bookings',
          bookingId: resolved.booking.id,
          addToCalendar: '1',
        },
      },
    },
  );
}
