import { matchCustomerOwnedBooking } from './ai-cancel-my-booking.util.js';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import {
  buildBookingManageUrl,
  ensureBookingManageToken,
} from '../../common/utils/booking-manage-token.util.js';
import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import {
  buildGuestManageLinkAmbiguousSummary,
  buildManageLinkResendSummary,
  lookupUpcomingBookingsByGuestContact,
  parseGetManageLinkFromPrompt,
  normalizeGuestContactPhone,
  shouldResendManageLinkNotification,
  type GetManageLinkDelivery,
  type ParsedGetManageLink,
} from './ai-get-manage-link.util.js';

export interface GetManageLinkLogicDeps extends SelfServiceBookingLogicDeps {
  notificationsService: Pick<NotificationsService, 'sendBookingConfirmation'>;
}

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
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
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

async function resolveOwnedBooking(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  customerId: string,
  params: Record<string, unknown>,
): Promise<Booking | null> {
  const bookings = await deps.bookingRepo.find({
    where: { businessId, customerId },
    relations: { service: true, employee: true, customer: true },
    order: { startTime: 'ASC' },
  });
  const matched = matchCustomerOwnedBooking(bookings, params, '', 'UTC', {
    allowFirstWhenUnspecified: true,
  });
  return matched.booking;
}

async function finalizeManageLinkResult(
  deps: GetManageLinkLogicDeps,
  businessId: string,
  slug: string,
  booking: Booking,
  parsed: NonNullable<ReturnType<typeof parseGetManageLinkFromPrompt>>,
): Promise<CommandResult> {
  const token = await ensureBookingManageToken(deps.bookingRepo, booking.id);
  const frontendUrl =
    deps.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  const manageUrl = buildBookingManageUrl(frontendUrl, slug, booking.id, token);

  let resent = false;
  if (shouldResendManageLinkNotification(parsed.delivery)) {
    await deps.notificationsService.sendBookingConfirmation(booking.id);
    resent = true;
  }

  const summary = buildManageLinkResendSummary({
    delivery: parsed.delivery,
    email: parsed.email,
    phone: parsed.phone,
    resent,
    manageUrl,
  });

  return success('get_manage_link', summary, {
    bookingId: booking.id,
    manageUrl,
    manageToken: token,
    guestLookup: parsed.guestLookup,
    delivery: parsed.delivery,
    email: parsed.email ?? null,
    phone: parsed.phone ?? null,
    resent,
    serviceName: booking.service?.name ?? null,
    startTime: booking.startTime.toISOString(),
  });
}

function resolveParsedManageLink(
  textPrompt: string,
  params: Record<string, any>,
): ParsedGetManageLink | null {
  const parsed = parseGetManageLinkFromPrompt(textPrompt, params);
  if (parsed) return parsed;
  if (!params.guestLookup) return null;

  const email =
    typeof params.email === 'string'
      ? params.email.trim().toLowerCase()
      : undefined;
  const phone =
    typeof params.phone === 'string'
      ? normalizeGuestContactPhone(params.phone)
      : undefined;
  const bookingId =
    (params.bookingId as string | undefined) ??
    (params.sessionBookingId as string | undefined);

  return {
    guestLookup: true,
    delivery: (params.delivery as GetManageLinkDelivery | undefined) ?? 'auto',
    ...(bookingId ? { bookingId } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}

export async function handleGetManageLinkLogic(
  deps: GetManageLinkLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = resolveParsedManageLink(textPrompt, params);
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('get_manage_link', 'Business not found.');

  const customerId = resolveSessionCustomerId(params);
  let booking: Booking | null = null;

  if (params.bookingId) {
    booking = await deps.bookingRepo.findOne({
      where: {
        id: params.bookingId as string,
        businessId,
        ...(customerId ? { customerId } : {}),
      },
      relations: { service: true, employee: true, customer: true },
    });
  } else if (customerId) {
    booking = await resolveOwnedBooking(deps, businessId, customerId, params);
  } else if (parsed?.guestLookup && (parsed.email || parsed.phone)) {
    const matches = await lookupUpcomingBookingsByGuestContact(
      deps.bookingRepo,
      businessId,
      { email: parsed.email, phone: parsed.phone },
    );
    if (matches.length > 1) {
      return failure(
        'get_manage_link',
        buildGuestManageLinkAmbiguousSummary(matches),
        {
          clarify: true,
          missing: ['bookingId'],
          candidates: matches.map((row) => ({
            bookingId: row.id,
            serviceName: row.service?.name ?? null,
            startTime: row.startTime.toISOString(),
          })),
        },
      );
    }
    booking = matches[0] ?? null;
  }

  if (!booking) {
    if (parsed?.guestLookup && (parsed.email || parsed.phone)) {
      return failure(
        'get_manage_link',
        'No upcoming booking found for that email or phone.',
        {
          clarify: true,
          missing: ['bookingId'],
          email: parsed.email ?? null,
          phone: parsed.phone ?? null,
        },
      );
    }
    return failure(
      'get_manage_link',
      parsed?.guestLookup
        ? 'Provide the email or phone you used when booking so we can resend your manage link.'
        : 'Specify which booking you need a manage link for.',
      {
        clarify: true,
        missing: parsed?.guestLookup ? ['email', 'phone'] : ['bookingId'],
      },
    );
  }

  if (!parsed) {
    return finalizeManageLinkResult(deps, businessId, slug, booking, {
      guestLookup: false,
      delivery: 'link_only',
      bookingId: booking.id,
    });
  }

  return finalizeManageLinkResult(deps, businessId, slug, booking, parsed);
}
