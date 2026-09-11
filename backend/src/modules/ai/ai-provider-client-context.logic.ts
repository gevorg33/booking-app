import { In, MoreThanOrEqual, Not } from 'typeorm';
import type { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import type { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  formatProviderClientHistoryText,
  formatProviderClientSummaryText,
  formatProviderClientStaffNotesText,
  formatProviderClientIntakeText,
  formatProviderPackageVisitContextText,
  formatProviderMultiServiceTimelineText,
  formatProviderBookingPaymentBreakdownText,
  formatProviderDepositBalanceDueText,
  formatProviderRetailCartText,
  formatProviderCancelPolicyForClientText,
  formatProviderGiftCardRedemptionText,
  formatProviderTourGroupText,
  extractCustomerNameFromClientPrompt,
  resolveClientNoteBody,
} from './ai-provider-client-context.util.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { extractTourBookingMetadata } from '../../common/utils/tour-service.util.js';

export interface ProviderClientContextLogicDeps {
  bookingRepo: Repository<Booking>;
  providerMobile: ProviderMobileService;
  giftCardRepo: Repository<GiftCard>;
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

export async function handleListClientStaffNotesLogic(
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
    return { ...resolved.error, action: 'list_client_staff_notes' };
  }

  const notes = await deps.providerMobile.listBookingCustomerStaffNotes(
    businessId,
    userId,
    resolved.bookingId,
  );

  return success(
    'list_client_staff_notes',
    formatProviderClientStaffNotesText(resolved.customerName, notes),
    {
      bookingId: resolved.bookingId,
      notes: notes.notes,
      canCreate: notes.canCreate,
    },
  );
}

export async function handleExplainClientIntakeLogic(
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
    return { ...resolved.error, action: 'explain_client_intake' };
  }

  const summary = await deps.providerMobile.getBookingPreVisitIntakeSummary(
    businessId,
    userId,
    resolved.bookingId,
  );

  return success(
    'explain_client_intake',
    formatProviderClientIntakeText(summary),
    {
      bookingId: resolved.bookingId,
      intake: summary,
    },
  );
}

export async function handleExplainPackageVisitContextLogic(
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
    return { ...resolved.error, action: 'explain_package_visit_context' };
  }

  const detail = await deps.providerMobile.getBookingDetail(
    businessId,
    userId,
    resolved.bookingId,
  );
  const pkg = detail.checkoutContext.package;

  return success(
    'explain_package_visit_context',
    formatProviderPackageVisitContextText(resolved.customerName, pkg),
    { bookingId: resolved.bookingId, package: pkg },
  );
}

export async function handleExplainMultiServiceTimelineLogic(
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
    return { ...resolved.error, action: 'explain_multi_service_timeline' };
  }

  const detail = await deps.providerMobile.getBookingDetail(
    businessId,
    userId,
    resolved.bookingId,
  );
  const multi = detail.checkoutContext.multiService;

  return success(
    'explain_multi_service_timeline',
    formatProviderMultiServiceTimelineText(resolved.customerName, multi),
    { bookingId: resolved.bookingId, multiService: multi },
  );
}

export async function handleExplainBookingPaymentBreakdownLogic(
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
    return { ...resolved.error, action: 'explain_booking_payment_breakdown' };
  }

  const detail = await deps.providerMobile.getBookingDetail(
    businessId,
    userId,
    resolved.bookingId,
  );

  return success(
    'explain_booking_payment_breakdown',
    formatProviderBookingPaymentBreakdownText(
      resolved.customerName,
      detail.paymentStatus,
      detail.paymentSummary,
    ),
    { bookingId: resolved.bookingId, paymentSummary: detail.paymentSummary },
  );
}

export async function handleExplainDepositBalanceDueLogic(
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
    return { ...resolved.error, action: 'explain_deposit_balance_due' };
  }

  const detail = await deps.providerMobile.getBookingDetail(
    businessId,
    userId,
    resolved.bookingId,
  );

  return success(
    'explain_deposit_balance_due',
    formatProviderDepositBalanceDueText(
      resolved.customerName,
      detail.paymentSummary,
    ),
    { bookingId: resolved.bookingId, paymentSummary: detail.paymentSummary },
  );
}

export async function handleExplainRetailCartLogic(
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
    return { ...resolved.error, action: 'explain_retail_cart' };
  }

  const detail = await deps.providerMobile.getBookingDetail(
    businessId,
    userId,
    resolved.bookingId,
  );

  return success(
    'explain_retail_cart',
    formatProviderRetailCartText(resolved.customerName, detail.paymentSummary),
    { bookingId: resolved.bookingId, paymentSummary: detail.paymentSummary },
  );
}

export async function handleExplainCancelPolicyForClientLogic(
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
    return { ...resolved.error, action: 'explain_cancel_policy_for_client' };
  }

  const view = await deps.providerMobile.explainCancelPolicyForBooking(
    businessId,
    userId,
    resolved.bookingId,
  );

  return success(
    'explain_cancel_policy_for_client',
    formatProviderCancelPolicyForClientText(
      view.customerName,
      view.settingsLines,
      view.depositLines,
      view.generalDepositLine,
    ),
    {
      bookingId: resolved.bookingId,
      bookingPolicy: view.bookingPolicy,
      depositContext: view.depositContext,
    },
  );
}

export async function handleExplainGiftCardRedemptionLogic(
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
    return { ...resolved.error, action: 'explain_gift_card_redemption' };
  }

  const detail = await deps.providerMobile.getBookingDetail(
    businessId,
    userId,
    resolved.bookingId,
  );
  const summary = detail.paymentSummary;

  let cardBalance: number | null = null;
  let cardCurrency: string | null = null;
  if (summary?.giftCardCode) {
    const card = await deps.giftCardRepo.findOne({
      where: { businessId, code: summary.giftCardCode },
    });
    if (card) {
      cardBalance = Number(card.balance);
      cardCurrency = card.currency;
    }
  }

  return success(
    'explain_gift_card_redemption',
    formatProviderGiftCardRedemptionText(
      resolved.customerName,
      summary,
      cardBalance,
      cardCurrency,
    ),
    {
      bookingId: resolved.bookingId,
      giftCardCode: summary?.giftCardCode ?? null,
      giftCardDiscount: summary?.giftCardDiscount ?? null,
      cardBalance,
    },
  );
}

export async function handleExplainTourGroupOnBookingLogic(
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
    return { ...resolved.error, action: 'explain_tour_group_on_booking' };
  }

  const booking = await deps.bookingRepo.findOne({
    where: { id: resolved.bookingId, businessId },
  });
  const tourMeta = extractTourBookingMetadata(booking?.metadata);

  return success(
    'explain_tour_group_on_booking',
    formatProviderTourGroupText(resolved.customerName, tourMeta),
    {
      bookingId: resolved.bookingId,
      paxCount: tourMeta.paxCount ?? null,
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
    case 'list_client_staff_notes':
      return handleListClientStaffNotesLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'explain_client_intake':
      return handleExplainClientIntakeLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'explain_package_visit_context':
      return handleExplainPackageVisitContextLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'explain_multi_service_timeline':
      return handleExplainMultiServiceTimelineLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'explain_booking_payment_breakdown':
      return handleExplainBookingPaymentBreakdownLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'explain_deposit_balance_due':
      return handleExplainDepositBalanceDueLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'explain_retail_cart':
      return handleExplainRetailCartLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'explain_cancel_policy_for_client':
      return handleExplainCancelPolicyForClientLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'explain_gift_card_redemption':
      return handleExplainGiftCardRedemptionLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'explain_tour_group_on_booking':
      return handleExplainTourGroupOnBookingLogic(
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
