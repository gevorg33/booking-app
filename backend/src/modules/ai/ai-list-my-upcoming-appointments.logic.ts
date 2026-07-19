import { BookingStatus } from '../booking/entities/booking.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import {
  filterUpcomingBookingsForScope,
  parseListMyUpcomingAppointmentsFromPrompt,
} from './ai-list-my-upcoming-appointments.util.js';

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

function buildScopeSummary(
  scope: 'next' | 'this_week' | 'all_upcoming',
  count: number,
): string {
  if (count === 0) {
    if (scope === 'next') return 'You have no upcoming appointments.';
    if (scope === 'this_week') return 'You have no appointments this week.';
    return 'You have no upcoming appointments.';
  }
  if (scope === 'next') return 'Here is your next upcoming appointment.';
  if (scope === 'this_week') {
    return `You have ${count} appointment(s) this week.`;
  }
  return `You have ${count} upcoming appointment(s).`;
}

export async function handleListMyUpcomingAppointmentsLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const parsed = parseListMyUpcomingAppointmentsFromPrompt(
    prompt || String(params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'list_my_upcoming_appointments',
      'Ask about upcoming appointments (e.g. "What\'s my next appointment?").',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'list_my_upcoming_appointments',
      'Sign in to view your upcoming appointments.',
      { clarify: true },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) {
    return failure('list_my_upcoming_appointments', 'Business not found.');
  }

  const timeZone = String(params._timeZone ?? 'UTC');
  const { bookings } = await deps.publicCustomerAuthService.listBookings(
    slug,
    customerId,
  );

  const filtered = filterUpcomingBookingsForScope(
    bookings.filter((b) => b.status === BookingStatus.CONFIRMED),
    parsed.scope,
    prompt,
    timeZone,
  );

  const lines = filtered
    .slice(0, 5)
    .map(
      (b) =>
        `• ${b.serviceName} with ${b.employeeName} — ${b.startTime.slice(0, 16)}` +
        (b.canCancel || b.canReschedule ? '' : ' (policy restricted)'),
    );

  return success(
    'list_my_upcoming_appointments',
    buildScopeSummary(parsed.scope, filtered.length),
    {
      scope: parsed.scope,
      bookings: filtered,
      upcomingCount: filtered.length,
      summaryLines: lines,
      // e2e-bug.52 — align with my_appointments / list_my_appointments (tab=bookings)
      navigate: { path: 'account', query: { tab: 'bookings' } },
    },
  );
}
