import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { Repository } from 'typeorm';
import type {
  EntityReader,
} from './ai-logic-repo.types.js';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { parseRebookLastAppointmentFromPrompt } from './ai-rebook-last-appointment.util.js';
import { resolveBusinessSlugFromParamsOrId } from './ai-resolve-business-slug.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  buildConsumerRebookAccountPath,
  deriveConsumerRebookQueryParams,
} from '../../common/utils/consumer-rebook.util.js';

export interface RebookLastAppointmentLogicDeps {
  publicCustomerAuthService: Pick<PublicCustomerAuthService, 'listBookings'>;
  businessRepo: EntityReader<Business>;
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

function pickLastCompletedBooking<
  T extends { status: string; startTime: string | Date },
>(bookings: T[]): T | null {
  return (
    bookings
      .filter((b) => String(b.status).toLowerCase() === BookingStatus.COMPLETED)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      )[0] ?? null
  );
}

export async function handleRebookLastAppointmentLogic(
  deps: RebookLastAppointmentLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  if (!parseRebookLastAppointmentFromPrompt(textPrompt)) {
    return failure(
      'rebook_last_appointment',
      'Ask to rebook or repeat your last completed visit.',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'rebook_last_appointment',
      'Sign in to rebook your last visit.',
      { clarify: true },
    );
  }

  // e2e-bug.82 — resolve slug from businessId when classifier omits params.slug.
  const slug = await resolveBusinessSlugFromParamsOrId(
    deps.businessRepo,
    businessId,
    params,
  );
  if (!slug) return failure('rebook_last_appointment', 'Business not found.');

  const { bookings } = await deps.publicCustomerAuthService.listBookings(
    slug,
    customerId,
  );
  const last = pickLastCompletedBooking(bookings);
  if (!last) {
    return failure(
      'rebook_last_appointment',
      'No completed visits found to rebook yet.',
    );
  }

  const rebookQuery = deriveConsumerRebookQueryParams({
    bookingId: last.id,
    startTime: last.startTime,
    employeeId: last.employeeId,
  });
  const path = buildConsumerRebookAccountPath({
    slug,
    serviceId: last.serviceId,
    bookingId: last.id,
    startTime: last.startTime,
    employeeId: last.employeeId,
  });

  return success(
    'rebook_last_appointment',
    `Rebooking ${last.serviceName} with ${last.employeeName} at your last visit time.`,
    {
      bookingId: last.id,
      serviceId: last.serviceId,
      employeeId: last.employeeId,
      startTime: last.startTime,
      navigate: {
        path: 'checkout',
        query: {
          serviceId: last.serviceId,
          startTime: last.startTime,
          employeeId: last.employeeId,
          date: rebookQuery.date,
          slot: rebookQuery.slot,
          rebook: '1',
          rebookBookingId: last.id,
          rebookSource: 'account',
        },
      },
      path,
      rebookQuery,
    },
  );
}
