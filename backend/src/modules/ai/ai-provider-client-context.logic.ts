import { In, MoreThanOrEqual, Not } from 'typeorm';
import type { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import type { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  formatProviderClientHistoryText,
  formatProviderClientSummaryText,
  extractCustomerNameFromClientPrompt,
  resolveClientNoteBody,
} from './ai-provider-client-context.util.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';

export interface ProviderClientContextLogicDeps {
  bookingRepo: Repository<Booking>;
  providerMobile: ProviderMobileService;
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

async function resolveBookingIdForClientIntent(
  deps: ProviderClientContextLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<
  { bookingId: string; customerName: string } | { error: CommandResult }
> {
  const explicitBookingId =
    (typeof params.bookingId === 'string' && params.bookingId.trim()) ||
    (typeof context?.bookingId === 'string' && context.bookingId.trim()) ||
    null;

  if (explicitBookingId) {
    try {
      const booking = await deps.providerMobile.getBookingDetail(
        businessId,
        userId,
        explicitBookingId,
      );
      return {
        bookingId: explicitBookingId,
        customerName: booking.customer?.name ?? 'Client',
      };
    } catch {
      return {
        error: failure(
          'summarize_client',
          'Could not find that appointment. Open the booking and try again.',
          { clarify: true },
        ),
      };
    }
  }

  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()) ||
    extractCustomerNameFromClientPrompt(prompt ?? '') ||
    null;

  if (!customerName) {
    return {
      error: failure(
        'summarize_client',
        'Open an appointment or name the client (e.g. "Summarize Jane Doe").',
        { clarify: true, missing: ['bookingId', 'customerName'] },
      ),
    };
  }

  const access = await deps.providerMobile.resolveMobileAccess(
    businessId,
    userId,
  );
  const employeeId = deps.providerMobile.getScopedEmployeeId(access);
  const today = getTodayDateKey();
  const dayStart = new Date(`${today}T00:00:00.000Z`);

  let bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      ...(employeeId ? { employeeId } : {}),
      startTime: MoreThanOrEqual(dayStart),
      status: Not(In([BookingStatus.CANCELLED])),
    },
    relations: { customer: true },
    order: { startTime: 'ASC' },
    take: 50,
  });

  const lower = customerName.toLowerCase();
  bookings = bookings.filter((row) =>
    row.customer?.name?.toLowerCase().includes(lower),
  );

  const booking = bookings[0];
  if (!booking) {
    return {
      error: failure(
        'summarize_client',
        `No upcoming appointment found for "${customerName}". Open their booking from the schedule.`,
        { clarify: true, customerName },
      ),
    };
  }

  return {
    bookingId: booking.id,
    customerName: booking.customer?.name ?? customerName,
  };
}

export async function handleSummarizeClientLogic(
  deps: ProviderClientContextLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const resolved = await resolveBookingIdForClientIntent(
    deps,
    businessId,
    userId,
    params,
    prompt,
    context,
  );
  if ('error' in resolved) {
    return { ...resolved.error, action: 'summarize_client' };
  }

  const contextView = await deps.providerMobile.getBookingCustomerContext(
    businessId,
    userId,
    resolved.bookingId,
  );

  return success(
    'summarize_client',
    formatProviderClientSummaryText(contextView),
    {
      bookingId: resolved.bookingId,
      customerId: contextView.customerId,
      context: contextView,
    },
  );
}

export async function handleShowClientHistoryLogic(
  deps: ProviderClientContextLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const resolved = await resolveBookingIdForClientIntent(
    deps,
    businessId,
    userId,
    params,
    prompt,
    context,
  );
  if ('error' in resolved) {
    return { ...resolved.error, action: 'show_client_history' };
  }

  const contextView = await deps.providerMobile.getBookingCustomerContext(
    businessId,
    userId,
    resolved.bookingId,
  );

  return success(
    'show_client_history',
    formatProviderClientHistoryText(
      contextView.name,
      contextView.recentCompletedVisits,
    ),
    {
      bookingId: resolved.bookingId,
      customerId: contextView.customerId,
      visits: contextView.recentCompletedVisits,
    },
  );
}

export async function handleAddClientNoteLogic(
  deps: ProviderClientContextLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const noteBody = resolveClientNoteBody(params, prompt ?? '');
  if (!noteBody) {
    return failure(
      'add_client_note',
      'What should the staff note say? Example: "Add note: allergic to latex".',
      { clarify: true, missing: ['clientNote'] },
    );
  }

  const resolved = await resolveBookingIdForClientIntent(
    deps,
    businessId,
    userId,
    params,
    prompt,
    context,
  );
  if ('error' in resolved) {
    return { ...resolved.error, action: 'add_client_note' };
  }

  const created = await deps.providerMobile.createBookingCustomerStaffNote(
    businessId,
    userId,
    resolved.bookingId,
    { body: noteBody },
  );

  return success(
    'add_client_note',
    `Staff note saved for ${resolved.customerName}.`,
    {
      bookingId: resolved.bookingId,
      note: created.note,
      maxLength: created.maxLength,
    },
  );
}

export async function dispatchProviderClientContextIntent(
  deps: ProviderClientContextLogicDeps,
  businessId: string,
  userId: string,
  action: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult | null> {
  switch (action) {
    case 'summarize_client':
      return handleSummarizeClientLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'show_client_history':
      return handleShowClientHistoryLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'add_client_note':
      return handleAddClientNoteLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    default:
      return null;
  }
}
