import type { ConfigService } from '@nestjs/config';
import type { PublicConsumerSupportService } from '../public-booking/public-consumer-support.service.js';
import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import { enrichCancelMyBookingParamsFromPrompt } from './ai-cancel-my-booking.util.js';
import {
  buildDefaultBookingProblemMessage,
  buildPublicBookingSupportUrl,
  buildReportBookingProblemAmbiguousSummary,
  buildReportBookingProblemNavigate,
  matchCustomerOwnedProblemBooking,
  parseReportBookingProblemFromPrompt,
} from './ai-report-booking-problem.util.js';

export interface ReportBookingProblemLogicDeps extends SelfServiceBookingLogicDeps {
  publicConsumerSupportService: Pick<
    PublicConsumerSupportService,
    'createPostBookingSupportTicket'
  >;
  configService: ConfigService;
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
  deps: ReportBookingProblemLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

function resolvePublicWebOrigin(configService: ConfigService): string {
  return (
    configService.get<string>('app.publicWebOrigin') ??
    configService.get<string>('PUBLIC_WEB_ORIGIN') ??
    ''
  );
}

export async function handleReportBookingProblemLogic(
  deps: ReportBookingProblemLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseReportBookingProblemFromPrompt(textPrompt, params);
  if (!parsed) {
    return failure(
      'report_booking_problem',
      'Describe the booking problem (e.g. "Something went wrong with my visit").',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'report_booking_problem',
      'Sign in to report a problem with your booking.',
      { clarify: true },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('report_booking_problem', 'Business not found.');

  const enrichedParams = enrichCancelMyBookingParamsFromPrompt(
    params,
    textPrompt,
  );
  const listed = await deps.publicCustomerAuthService.listBookings(
    slug,
    customerId,
  );

  if (!listed.bookings.length) {
    return failure(
      'report_booking_problem',
      'No bookings found to report a problem for.',
      { clarify: true },
    );
  }

  const matchParams: Record<string, unknown> = {
    ...(enrichedParams.bookingId
      ? { bookingId: enrichedParams.bookingId }
      : {}),
    ...(parsed.bookingId ? { bookingId: parsed.bookingId } : {}),
    ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
    ...(parsed.date ? { date: parsed.date } : {}),
  };

  const matched = matchCustomerOwnedProblemBooking(
    listed.bookings,
    matchParams,
    textPrompt,
    parsed.aspect,
    String(params._timeZone ?? 'UTC'),
  );

  if (matched.ambiguous.length > 1) {
    return failure(
      'report_booking_problem',
      buildReportBookingProblemAmbiguousSummary(matched.ambiguous),
      {
        clarify: true,
        missing: ['bookingId'],
        candidates: matched.ambiguous.map((row) => ({
          bookingId: row.id,
          serviceName: row.serviceName,
          startTime: row.startTime,
        })),
      },
    );
  }

  const booking = matched.booking;
  if (!booking) {
    return failure(
      'report_booking_problem',
      'No matching booking found to report a problem for.',
      { clarify: true },
    );
  }

  const message = buildDefaultBookingProblemMessage(
    booking.serviceName,
    parsed.aspect,
    parsed.message,
  );
  const supportUrl = buildPublicBookingSupportUrl(
    slug,
    booking.id,
    resolvePublicWebOrigin(deps.configService),
  );

  try {
    const ticket =
      await deps.publicConsumerSupportService.createPostBookingSupportTicket(
        slug,
        customerId,
        {
          bookingId: booking.id,
          message,
        },
      );

    return success(
      'report_booking_problem',
      `Support ticket #${ticket.ticketId} submitted — we'll follow up about your ${booking.serviceName} visit.`,
      {
        bookingId: booking.id,
        ticketId: ticket.ticketId,
        aspect: parsed.aspect,
        handoff: 'zendesk_ticket',
        serviceName: booking.serviceName,
      },
    );
  } catch (err: any) {
    const needsEmail =
      typeof err?.message === 'string' &&
      /email on your profile/i.test(err.message);

    if (supportUrl) {
      return success(
        'report_booking_problem',
        needsEmail
          ? `Add an email to your profile to open tickets automatically. For now, use the support form for your ${booking.serviceName} visit.`
          : `Open the support form for your ${booking.serviceName} visit and we'll help from there.`,
        {
          bookingId: booking.id,
          aspect: parsed.aspect,
          handoff: 'support_web',
          supportUrl,
          navigate: buildReportBookingProblemNavigate(booking.id),
          message,
        },
      );
    }

    return failure(
      'report_booking_problem',
      err?.message ?? 'Could not report the booking problem.',
      { bookingId: booking.id },
    );
  }
}
