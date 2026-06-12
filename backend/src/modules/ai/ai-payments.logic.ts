import { Between, Not, Repository } from 'typeorm';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { GiftCardsService } from '../gift-cards/gift-cards.service.js';
import type { GiftCardPurchaseService } from '../gift-cards/gift-card-purchase.service.js';
import type { GiftCardOrderService } from '../gift-cards/gift-card-order.service.js';
import type { GiftCardRefundService } from '../gift-cards/gift-card-refund.service.js';
import type { PublicBookingService } from '../public-booking/public-booking.service.js';
import type { AccountingIntegrationService } from '../integrations/accounting/accounting-integration.service.js';
import type { CommissionsService } from '../commissions/commissions.service.js';
import type { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import {
  applyPublicPaymentSettingsToBusinessSettings,
  resolvePublicPaymentSettings,
} from '../../common/utils/customer-self-service.util.js';
import { getBusinessStripeIntegration } from '../billing/stripe-integration.types.js';
import {
  applyAvailabilityDateFromPrompt,
  hasExplicitWeekdayInAvailabilityPrompt,
  resolveDateRange,
  resolvePublicAvailabilityWindows,
} from './ai-orchestration.helpers.js';
import {
  decomposePaymentsCompoundPrompt,
  extractAmountFromPrompt,
  extractGiftCardCodeFromPrompt,
  notBeforeTimeFromWindow,
  parseCashPaymentsToggle,
  resolveAvailabilityDateKey,
  type PaymentsCompoundStep,
} from './ai-payments.util.js';
import { resolveTimezone } from '../../common/utils/timezone.util.js';
import {
  buildNearestSlotBookedMessage,
  buildNoNearestSlotMessage,
} from './ai-booking-slot-messages.util.js';
import {
  attachCheckProvidersHandoff,
  mergeCheckProvidersHandoffIntoContext,
  pickCheckProvidersHandoff,
} from './ai-check-book-handoff.util.js';
import {
  applyChosenAvailabilityWindowToParams,
  buildNearestAvailabilityWindowQueries,
  buildNearestBookableSlotQuery,
} from './ai-nearest-slot-resolver.util.js';
import {
  buildDashboardAvailabilityWindowLabel,
  dashboardAvailabilityTodayKey,
  shouldGroupDashboardAvailabilityByWindow,
} from './ai-dashboard-availability-windows.logic.js';
import { buildCheckProvidersSummary } from './ai-provider-availability.util.js';
import { parseTimeOfDayWindow } from './ai-operations.util.js';
import { parseMultilingualTimeOfDayWindow } from './ai-check-and-book-multilingual.util.js';
import { pickSharedBookingContextSlice } from './ai-compound-booking-context.util.js';
import {
  resolveBudgetMaxPrice,
} from './ai-budget-service-discovery.util.js';
import {
  resolveBudgetConstrainedService,
  resolveDiscoverConstrainedService,
} from './ai-budget-list-services.logic.js';
import { resolveServicesFromCatalogParams } from './ai-orchestration.helpers.js';
import { applyPromptMentionedServiceOverrideToParams } from './ai-booking-param-hints.util.js';

export interface PaymentsLogicDeps {
  giftCardsService: GiftCardsService;
  giftCardPurchaseService: GiftCardPurchaseService;
  giftCardOrderService: GiftCardOrderService;
  giftCardRefundService: GiftCardRefundService;
  publicBookingService: PublicBookingService;
  accountingIntegrationService: AccountingIntegrationService;
  commissionsService: CommissionsService;
  subscriptionsService: ServiceSubscriptionsService;
  bookingRepo: Repository<Booking>;
  businessRepo: Repository<Business>;
  serviceRepo: Repository<Service>;
  giftCardRepo: Repository<GiftCard>;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function resolveByName<T extends { name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

async function resolveBusinessSlug(
  deps: PaymentsLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

async function resolveService(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<Service | undefined> {
  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });

  const catalog = services.map((service) => ({
    id: service.id,
    name: service.name,
    price: Number(service.price),
    durationMinutes: service.durationMinutes,
  }));

  const hasBudgetFilter =
    resolveBudgetMaxPrice(params.maxPrice) != null ||
    params.serviceCategory ||
    params.serviceId;

  if (hasBudgetFilter) {
    const { service } = resolveBudgetConstrainedService(catalog, {
      serviceId: params.serviceId as string | undefined,
      serviceName: params.serviceName as string | undefined,
      serviceCategory: params.serviceCategory as string | undefined,
      maxPrice: params.maxPrice,
    });
    if (service) {
      return services.find((entry) => entry.id === service.id);
    }
    if (resolveBudgetMaxPrice(params.maxPrice) != null) {
      return undefined;
    }
  }

  if (params.serviceId) {
    const found = services.find((entry) => entry.id === params.serviceId);
    return found || undefined;
  }
  const name = (params.serviceName as string | undefined)?.trim();
  if (name) return resolveByName(services, name);
  if (params.serviceCategory) {
    const matched = resolveServicesFromCatalogParams(catalog, params);
    const first = matched[0];
    return first ? services.find((entry) => entry.id === first.id) : undefined;
  }
  return undefined;
}

function isOnlinePaymentsEnabled(
  settings: Record<string, unknown> | null | undefined,
): boolean {
  return Boolean(getBusinessStripeIntegration(settings ?? {}).connectAccountId);
}

function parseSubscriptionRevenueRows(
  content: string,
): Array<{ date: string; amount: number; reference: string }> {
  const lines = content.split('\n').slice(1);
  const rows: Array<{ date: string; amount: number; reference: string }> = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',');
    if (parts.length < 7) continue;
    const incomeSubType = parts[2]?.replace(/^"|"$/g, '');
    if (incomeSubType !== 'subscription') continue;
    const parsedAmount = Number.parseFloat(parts[4]);
    rows.push({
      date: parts[0],
      amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
      reference: (parts[6] || '').replace(/^"|"$/g, ''),
    });
  }
  return rows;
}

export async function handleSummarizeUnpaidLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const range = resolveDateRange(params, '', params._timeZone ?? 'UTC') ?? {
    start: new Date().toISOString().slice(0, 10),
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  };
  const start = new Date(range.start);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setUTCHours(23, 59, 59, 999);

  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      paymentStatus: PaymentStatus.PENDING,
      status: Not(BookingStatus.CANCELLED),
      startTime: Between(start, end),
    },
    relations: { customer: true, service: true, employee: true },
    order: { startTime: 'ASC' },
    take: 100,
  });

  const totalDue = bookings.reduce(
    (sum, b) => sum + Number(b.service?.price ?? 0),
    0,
  );
  return success(
    'summarize_unpaid',
    bookings.length
      ? `${bookings.length} unpaid booking(s) — $${totalDue.toFixed(2)} outstanding.`
      : 'No unpaid bookings in this window.',
    {
      count: bookings.length,
      totalDue,
      bookings: bookings.map((b) => ({
        id: b.id,
        startTime: b.startTime,
        customerName: b.customer?.name,
        serviceName: b.service?.name,
        amount: Number(b.service?.price ?? 0),
        paymentStatus: b.paymentStatus,
      })),
    },
  );
}

export async function handleValidateGiftCardLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const code =
    (params.giftCardCode as string | undefined) ??
    extractGiftCardCodeFromPrompt(params._prompt ?? '');
  if (!code) {
    return failure(
      'validate_gift_card',
      'Specify the gift card code to validate.',
      {
        clarify: true,
        missing: ['giftCardCode'],
      },
    );
  }
  try {
    await deps.giftCardsService.validate(
      businessId,
      code,
      params.serviceId as string | undefined,
    );
    const balance = await deps.giftCardsService.getBalanceView(
      businessId,
      code,
    );
    return success(
      'validate_gift_card',
      `Gift card ${balance.code} is valid — balance $${balance.balance}.`,
      {
        balance,
      },
    );
  } catch (err: any) {
    return failure(
      'validate_gift_card',
      err?.message ?? 'Gift card validation failed.',
      { code },
    );
  }
}

export async function handleExportAccountingLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  try {
    const result = await deps.accountingIntegrationService.generateExport(
      businessId,
      params.from as string | undefined,
      params.to as string | undefined,
    );
    return success(
      'export_accounting',
      `Accounting export ready — ${result.rowCount} row(s) (${result.format}).`,
      { export: result },
    );
  } catch (err: any) {
    return failure(
      'export_accounting',
      err?.message ?? 'Accounting export failed.',
    );
  }
}

export async function handleExportCommissionsLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  try {
    const result = await deps.commissionsService.exportPayoutCsv(
      businessId,
      params.from as string | undefined,
      params.to as string | undefined,
      params.locationId as string | undefined,
    );
    return success(
      'export_commissions',
      `Commission payout export — ${result.rowCount} row(s).`,
      { export: result },
    );
  } catch (err: any) {
    return failure(
      'export_commissions',
      err?.message ?? 'Commission export failed.',
    );
  }
}

export async function handleExplainCheckoutTotalLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const service = await resolveService(deps, businessId, params);
  if (!service) {
    return failure(
      'explain_checkout_total',
      'Specify which service to price at checkout.',
      {
        clarify: true,
        missing: ['serviceName'],
      },
    );
  }

  const servicePrice = Number(service.price);
  let giftCardApplied = 0;
  let balanceView: unknown = null;
  const code =
    (params.giftCardCode as string | undefined) ??
    extractGiftCardCodeFromPrompt(params._prompt ?? '');
  if (code) {
    try {
      await deps.giftCardsService.validate(businessId, code, service.id);
      balanceView = await deps.giftCardsService.getBalanceView(
        businessId,
        code,
      );
      giftCardApplied = Math.min(
        servicePrice,
        Number((balanceView as any).balance ?? 0),
      );
    } catch {
      giftCardApplied = 0;
    }
  }

  const amountDue = Math.max(0, servicePrice - giftCardApplied);
  return success(
    'explain_checkout_total',
    `Service $${servicePrice.toFixed(2)}${giftCardApplied ? ` − gift card $${giftCardApplied.toFixed(2)}` : ''} = $${amountDue.toFixed(2)} due.`,
    {
      serviceId: service.id,
      serviceName: service.name,
      servicePrice,
      giftCardApplied,
      amountDue,
      giftCardBalance: balanceView,
    },
  );
}

export async function handleListSubscriptionRevenueLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const range = resolveDateRange(params, '', params._timeZone ?? 'UTC') ?? {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  };
  try {
    const exportResult = await deps.accountingIntegrationService.generateExport(
      businessId,
      range.start,
      range.end,
    );
    const rows = parseSubscriptionRevenueRows(exportResult.content);
    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    return success(
      'list_subscription_revenue',
      rows.length
        ? `${rows.length} subscription purchase(s) — $${total.toFixed(2)} revenue.`
        : 'No subscription revenue in this period.',
      { rows, total, count: rows.length, range },
    );
  } catch (err: any) {
    return failure(
      'list_subscription_revenue',
      err?.message ?? 'Could not list subscription revenue.',
      { range },
    );
  }
}

export async function handleConfigureCashPaymentsLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business)
    return failure('configure_cash_payments', 'Business not found.');

  let toggle: boolean | null;
  if (typeof params.acceptCashPayments === 'boolean') {
    toggle = params.acceptCashPayments;
  } else {
    toggle = parseCashPaymentsToggle(String(prompt || params._prompt || ''));
  }
  if (toggle === null) {
    return failure(
      'configure_cash_payments',
      'Specify whether to enable or disable cash payments (e.g. "Enable cash payments").',
      { clarify: true, missing: ['acceptCashPayments'] },
    );
  }

  business.settings = applyPublicPaymentSettingsToBusinessSettings(
    business.settings ?? {},
    {
      acceptCashPayments: toggle,
    },
  );
  await deps.businessRepo.save(business);

  return success(
    'configure_cash_payments',
    toggle
      ? 'Cash pay-at-venue enabled for public checkout.'
      : 'Cash payments disabled for public checkout.',
    { acceptCashPayments: toggle },
  );
}

export async function handleAdjustGiftCardBalanceLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const cardId = params.giftCardId as string | undefined;
  const code =
    (params.giftCardCode as string | undefined) ??
    extractGiftCardCodeFromPrompt(params._prompt ?? '');
  const delta = params.delta ?? params.amount;
  const newBalance = params.newBalance;

  const card = cardId
    ? await deps.giftCardRepo.findOne({ where: { id: cardId, businessId } })
    : code
      ? await deps.giftCardRepo.findOne({
          where: { businessId, code: code.trim().toUpperCase() },
        })
      : null;

  if (!card) {
    return failure(
      'adjust_gift_card_balance',
      'Specify gift card ID or code to adjust.',
      {
        clarify: true,
        missing: ['giftCardCode'],
      },
    );
  }
  if (card.cardType !== 'monetary') {
    return failure(
      'adjust_gift_card_balance',
      'Only monetary gift cards support balance adjustments.',
    );
  }

  const previous = Number(card.balance);
  let next = previous;
  if (newBalance != null && Number.isFinite(Number(newBalance))) {
    next = Number(newBalance);
  } else if (delta != null && Number.isFinite(Number(delta))) {
    next = previous + Number(delta);
  } else {
    return failure(
      'adjust_gift_card_balance',
      'Specify newBalance or delta amount.',
      {
        clarify: true,
        missing: ['amount'],
      },
    );
  }
  if (next < 0)
    return failure('adjust_gift_card_balance', 'Balance cannot be negative.');

  card.balance = next;
  await deps.giftCardRepo.save(card);

  const auditNote =
    (params.note as string | undefined) ?? 'AI balance adjustment';
  return success(
    'adjust_gift_card_balance',
    `Gift card balance updated: $${previous.toFixed(2)} → $${next.toFixed(2)}.`,
    {
      giftCardId: card.id,
      previous,
      balance: next,
      audit: {
        at: new Date().toISOString(),
        byUserId: userId,
        note: auditNote,
        previous,
        next,
      },
    },
  );
}

export async function handleExtendGiftCardExpiryLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const cardId = params.giftCardId as string | undefined;
  const code =
    (params.giftCardCode as string | undefined) ??
    extractGiftCardCodeFromPrompt(params._prompt ?? '');
  let resolvedId = cardId;
  if (!resolvedId && code) {
    const card = await deps.giftCardRepo.findOne({
      where: { businessId, code: code.trim().toUpperCase() },
    });
    resolvedId = card?.id;
  }
  if (!resolvedId) {
    return failure('extend_gift_card_expiry', 'Specify gift card ID or code.', {
      clarify: true,
      missing: ['giftCardCode'],
    });
  }

  try {
    const card = await deps.giftCardsService.updateExpiration(
      businessId,
      resolvedId,
      {
        extendMonths: params.extendMonths as number | undefined,
        extendDays: params.extendDays as number | undefined,
        expiresAt: params.expiresAt as string | null | undefined,
        note: (params.note as string | undefined) ?? 'Extended via AI command',
      },
      userId ?? 'system',
    );
    return success(
      'extend_gift_card_expiry',
      card.expiresAt
        ? `Gift card expiration extended to ${card.expiresAt.toISOString().slice(0, 10)}.`
        : 'Gift card expiration cleared.',
      { giftCardId: card.id, expiresAt: card.expiresAt },
    );
  } catch (err: any) {
    return failure(
      'extend_gift_card_expiry',
      err?.message ?? 'Could not extend gift card expiration.',
    );
  }
}

export async function handleRefundGiftCardOrderLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const cardId = params.giftCardId as string | undefined;
  const code =
    (params.giftCardCode as string | undefined) ??
    extractGiftCardCodeFromPrompt(params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business)
    return failure('refund_gift_card_order', 'Business not found.');

  const card = cardId
    ? await deps.giftCardRepo.findOne({ where: { id: cardId, businessId } })
    : code
      ? await deps.giftCardRepo.findOne({
          where: { businessId, code: code.trim().toUpperCase() },
        })
      : null;
  if (!card) {
    return failure(
      'refund_gift_card_order',
      'Specify gift card order ID or code to refund.',
      {
        clarify: true,
        missing: ['giftCardCode'],
      },
    );
  }

  const refundStatus = await deps.giftCardRefundService.refundPurchase(
    business,
    card,
  );
  return success(
    'refund_gift_card_order',
    `Gift card order refund status: ${refundStatus}.`,
    { giftCardId: card.id, refundStatus },
  );
}

export async function handleExplainPaymentStatusLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const bookingId = params.bookingId as string | undefined;
  if (!bookingId) {
    return failure(
      'explain_payment_status',
      'Specify which booking to explain.',
      {
        clarify: true,
        missing: ['bookingId'],
      },
    );
  }
  const booking = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
    relations: { customer: true, service: true },
  });
  if (!booking) return failure('explain_payment_status', 'Booking not found.');

  const isCash =
    booking.metadata?.payAtVenue === true ||
    booking.metadata?.paymentMethod === 'cash';
  let explanation: string;
  if (booking.paymentStatus === PaymentStatus.PAID) {
    explanation = booking.metadata?.paidVia
      ? `Paid via ${booking.metadata.paidVia}.`
      : 'Paid.';
  } else if (booking.paymentStatus === PaymentStatus.PENDING) {
    explanation = isCash
      ? 'Payment pending — customer will pay cash at visit.'
      : 'Payment pending — awaiting online checkout or manual collection.';
  } else {
    explanation = `Payment status: ${booking.paymentStatus}.`;
  }

  return success('explain_payment_status', explanation, {
    bookingId: booking.id,
    paymentStatus: booking.paymentStatus,
    isCash,
    amount: Number(booking.service?.price ?? 0),
    customerName: booking.customer?.name,
  });
}

export async function handleCollectCashConfirmLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const bookingId = params.bookingId as string | undefined;
  if (!bookingId) {
    return failure(
      'collect_cash_confirm',
      'Specify which booking received cash payment.',
      {
        clarify: true,
        missing: ['bookingId'],
      },
    );
  }
  const booking = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
  });
  if (!booking) return failure('collect_cash_confirm', 'Booking not found.');

  const isCash =
    booking.metadata?.payAtVenue === true ||
    booking.metadata?.paymentMethod === 'cash';
  if (!isCash && booking.paymentStatus !== PaymentStatus.PENDING) {
    return failure(
      'collect_cash_confirm',
      'This booking is not a cash-at-visit appointment.',
    );
  }

  booking.paymentStatus = PaymentStatus.PAID;
  booking.status = BookingStatus.COMPLETED;
  booking.metadata = {
    ...(booking.metadata ?? {}),
    paidVia: 'cash',
    paidAt: new Date().toISOString(),
    cashConfirmedByUserId: userId,
  };
  await deps.bookingRepo.save(booking);

  return success(
    'collect_cash_confirm',
    'Cash payment confirmed and booking marked paid.',
    {
      bookingId: booking.id,
    },
  );
}

export async function handleCheckProvidersForServiceLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure('check_providers_for_service', 'Business not found.');

  const service = await resolveService(deps, businessId, params);
  if (!service) {
    return failure(
      'check_providers_for_service',
      'Specify which service to check providers for.',
      {
        clarify: true,
        missing: ['serviceName'],
      },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const tz = resolveTimezone(business?.timezone);
  const queryParams = { ...params };
  if (hasExplicitWeekdayInAvailabilityPrompt(queryParams, prompt)) {
    applyAvailabilityDateFromPrompt(queryParams, prompt, tz);
  }
  const availabilityWindows = resolvePublicAvailabilityWindows(
    queryParams,
    prompt,
    tz,
  );

  if (shouldGroupDashboardAvailabilityByWindow(availabilityWindows, params)) {
    const todayKey = dashboardAvailabilityTodayKey(tz);
    const sections: string[] = [];
    const mergedProviders: Array<Record<string, unknown>> = [];
    const mergedAvailability: ReturnType<
      typeof buildCheckProvidersSummary
    >['availability'] = [];
    const mergedProviderNames: string[] = [];

    try {
      for (const window of availabilityWindows) {
        if (window.dateKeys.length === 0) continue;

        const windowParams: Record<string, unknown> = {
          ...params,
          timeOfDay: window.timeOfDay ?? params.timeOfDay,
          date: window.dateKeys[0],
        };
        const notBeforeTime =
          window.timeFrom ??
          notBeforeTimeFromWindow('', windowParams) ??
          notBeforeTimeFromWindow(prompt ?? '', windowParams);
        const timeOfDay =
          window.timeOfDay ??
          (params.timeOfDay as string | undefined) ??
          parseTimeOfDayWindow(prompt ?? '', windowParams) ??
          parseMultilingualTimeOfDayWindow(prompt ?? '', windowParams);

        const result = await deps.publicBookingService.recommendProviders(slug, {
          serviceId: service.id,
          dateKeys: window.dateKeys,
          notBeforeTime,
          limit: params.limit as number | undefined,
        });
        const formatted = buildCheckProvidersSummary({
          serviceName: service.name,
          dateKey: window.dateKeys[0]!,
          providers: result.providers,
          timeOfDay,
          notBeforeTime,
        });
        const label = buildDashboardAvailabilityWindowLabel(
          window,
          tz,
          todayKey,
        );
        sections.push(`${label}:\n${formatted.summary}`);
        mergedProviders.push(
          ...(result.providers as unknown as Array<Record<string, unknown>>),
        );
        mergedAvailability.push(...formatted.availability);
        mergedProviderNames.push(...formatted.availableProviders);
      }

      if (sections.length > 0) {
        return success('check_providers_for_service', sections.join('\n\n'), {
          providers: mergedProviders,
          availableProviders: [...new Set(mergedProviderNames)],
          availability: mergedAvailability,
          serviceId: service.id,
          serviceName: service.name,
          multiWindow: true,
          windows: availabilityWindows.length,
          noProviders: mergedProviderNames.length === 0,
        });
      }
    } catch (err: any) {
      return failure(
        'check_providers_for_service',
        err?.message ?? 'Could not check provider availability.',
        {
          serviceId: service.id,
        },
      );
    }
  }

  const primaryWindow = availabilityWindows[0];
  const dateKeys =
    primaryWindow?.dateKeys?.length > 0
      ? primaryWindow.dateKeys
      : [resolveAvailabilityDateKey(queryParams, prompt, tz)];
  const notBeforeTime =
    primaryWindow?.timeFrom ??
    notBeforeTimeFromWindow(prompt ?? '', queryParams);
  const timeOfDay =
    primaryWindow?.timeOfDay ??
    (queryParams.timeOfDay as string | undefined) ??
    parseTimeOfDayWindow(prompt ?? '', queryParams) ??
    parseMultilingualTimeOfDayWindow(prompt ?? '', queryParams);

  try {
    const result = await deps.publicBookingService.recommendProviders(slug, {
      serviceId: service.id,
      dateKeys,
      notBeforeTime,
      limit: queryParams.limit as number | undefined,
    });
    const dateKey =
      result.providers.find((provider) =>
        dateKeys.includes(provider.earliestDateKey),
      )?.earliestDateKey ?? dateKeys[0]!;
    const formatted = buildCheckProvidersSummary({
      serviceName: service.name,
      dateKey,
      providers: result.providers,
      timeOfDay,
      notBeforeTime,
    });

    return success('check_providers_for_service', formatted.summary, {
      providers: result.providers,
      availableProviders: formatted.availableProviders,
      availability: formatted.availability,
      serviceId: service.id,
      serviceName: service.name,
      date: dateKey,
      notBeforeTime,
      timeOfDay,
      noProviders: result.providers.length === 0,
    });
  } catch (err: any) {
    return failure(
      'check_providers_for_service',
      err?.message ?? 'Could not check provider availability.',
      {
        serviceId: service.id,
      },
    );
  }
}

export async function handleBookNearestSlotLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('book_nearest_slot', 'Business not found.');

  const catalogServices = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });
  const catalog = catalogServices.map((entry) => ({
    id: entry.id,
    name: entry.name,
  }));
  if (prompt?.trim()) {
    Object.assign(
      params,
      applyPromptMentionedServiceOverrideToParams(prompt, params, catalog),
    );
  }

  let service = await resolveService(deps, businessId, params);
  if (!service && params.serviceRank) {
    const pricedCatalog = catalogServices.map((entry) => ({
      id: entry.id,
      name: entry.name,
      price: Number(entry.price),
      durationMinutes: entry.durationMinutes,
    }));
    const discoverResolved = resolveDiscoverConstrainedService(pricedCatalog, {
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      serviceCategory: params.serviceCategory,
      maxPrice: params.maxPrice,
      serviceRank: params.serviceRank,
    });
    if (discoverResolved.service) {
      service = catalogServices.find(
        (entry) => entry.id === discoverResolved.service!.id,
      );
    }
  }
  if (!service) {
    return failure('book_nearest_slot', 'Specify which service to book.', {
      clarify: true,
      missing: ['serviceName'],
    });
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const tz = resolveTimezone(business?.timezone);

  const slotQuery = buildNearestBookableSlotQuery(params, prompt ?? '');
  const { employeeId, notBeforeTime, startDateKey, timeOfDay } = slotQuery;
  const windowQueries = buildNearestAvailabilityWindowQueries(
    params,
    prompt ?? '',
    tz,
  );

  const nearestResult =
    await deps.publicBookingService.findNearestBookableSlotAcrossWindows(slug, {
      serviceId: service.id,
      employeeId,
      windows: windowQueries,
    });

  const priorCheck = pickCheckProvidersHandoff(params);

  if (!nearestResult) {
    return failure(
      'book_nearest_slot',
      buildNoNearestSlotMessage({
        serviceName: service.name,
        dateKey: startDateKey ?? undefined,
        timeOfDay,
        notBeforeTime,
      }),
      attachCheckProvidersHandoff(
        {
          serviceId: service.id,
          serviceName: service.name,
          date: startDateKey,
          timeOfDay,
          notBeforeTime,
          reason: 'no_slots',
        },
        priorCheck,
      ),
    );
  }

  const enrichedParams = applyChosenAvailabilityWindowToParams(
    params,
    nearestResult,
  );
  const slot = nearestResult.slot;

  return success(
    'book_nearest_slot',
    buildNearestSlotBookedMessage({
      startTime: slot.startTime,
      employeeName: slot.employeeName,
      locale: params.locale,
    }),
    attachCheckProvidersHandoff(
      {
        slot,
        serviceId: service.id,
        serviceName: service.name,
        employeeId: slot.employeeId,
        startTime: slot.startTime,
        date: slot.dateKey,
        timeOfDay: nearestResult.timeOfDay,
        chosenAvailabilityWindow: enrichedParams.chosenAvailabilityWindow,
        chosenAvailabilityWindowIndex:
          enrichedParams.chosenAvailabilityWindowIndex,
        navigate: {
          path: 'checkout',
          query: {
            serviceId: service.id,
            employeeId: slot.employeeId,
            startTime: slot.startTime,
          },
        },
      },
      priorCheck,
    ),
  );
}

export async function handleApplyGiftCardCodeLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const code =
    (params.giftCardCode as string | undefined) ||
    extractGiftCardCodeFromPrompt(prompt ?? '') ||
    undefined;
  if (!code) {
    return failure(
      'apply_gift_card_code',
      'Specify gift card code to apply at checkout.',
      {
        clarify: true,
        missing: ['giftCardCode'],
      },
    );
  }

  const service = await resolveService(deps, businessId, params);
  try {
    await deps.giftCardsService.validate(businessId, code, service?.id);
    const balance = await deps.giftCardsService.getBalanceView(
      businessId,
      code,
    );
    const servicePrice = service ? Number(service.price) : null;
    const applicable =
      servicePrice != null
        ? Math.min(servicePrice, balance.balance)
        : balance.balance;
    return success(
      'apply_gift_card_code',
      `Gift card ${balance.code} can cover $${applicable.toFixed(2)} at checkout.`,
      {
        balance,
        applicableAmount: applicable,
        serviceId: service?.id,
        servicePrice,
      },
    );
  } catch (err: any) {
    return failure(
      'apply_gift_card_code',
      err?.message ?? 'Gift card cannot be applied.',
      { code },
    );
  }
}

export async function handleCheckGiftCardBalanceLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const code =
    (params.giftCardCode as string | undefined) ??
    extractGiftCardCodeFromPrompt(prompt ?? '');
  if (!code) {
    return failure(
      'check_gift_card_balance',
      'Specify gift card code to check balance.',
      {
        clarify: true,
        missing: ['giftCardCode'],
      },
    );
  }
  try {
    const balance = await deps.giftCardsService.getBalanceView(
      businessId,
      code,
    );
    return success(
      'check_gift_card_balance',
      `Balance: $${balance.balance.toFixed(2)}${balance.expiresAt ? ` — expires ${balance.expiresAt.toISOString().slice(0, 10)}` : ''}.`,
      { balance },
    );
  } catch (err: any) {
    return failure(
      'check_gift_card_balance',
      err?.message ?? 'Gift card not found.',
      { code },
    );
  }
}

export async function handleBuyGiftCardLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  physical = false,
): Promise<CommandResult> {
  const action = physical ? 'buy_gift_card_physical' : 'buy_gift_card';
  const deliveryMethod = physical ? 'physical' : 'digital';
  const catalog =
    await deps.giftCardPurchaseService.getPublicCatalog(businessId);
  if (!catalog.purchaseEnabled) {
    return failure(action, 'Gift card purchase is not enabled.');
  }

  const amount =
    params.amount ??
    extractAmountFromPrompt((params._prompt as string) ?? '') ??
    catalog.settings?.presetAmounts?.[0];
  if (!amount || !Number.isFinite(Number(amount))) {
    return failure(action, 'Specify gift card amount (e.g. "$50 gift card").', {
      clarify: true,
      missing: ['amount'],
      catalog,
    });
  }

  try {
    const quote = await deps.giftCardPurchaseService.quotePurchase(businessId, {
      cardType: 'monetary',
      amount: Number(amount),
      deliveryMethod,
      purchaserEmail: (params.purchaserEmail as string) ?? 'guest@example.com',
      purchaserName: params.purchaserName as string | undefined,
    });
    return success(
      action,
      `${quote.label} — total $${quote.total.toFixed(2)} (${deliveryMethod} delivery).`,
      { quote, catalog: catalog.settings, deliveryMethod },
    );
  } catch (err: any) {
    return failure(action, err?.message ?? 'Could not quote gift card.');
  }
}

export async function handleChoosePaymentMethodLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) return failure('choose_payment_method', 'Business not found.');

  const payment = resolvePublicPaymentSettings(business.settings);
  const online = isOnlinePaymentsEnabled(business.settings);
  const options: Array<{ method: string; label: string; available: boolean }> =
    [];
  if (online)
    options.push({
      method: 'online',
      label: 'Pay online (card)',
      available: true,
    });
  if (payment.acceptCashPayments) {
    options.push({
      method: 'cash',
      label: 'Pay cash at visit',
      available: true,
    });
  }
  if (!options.length) {
    return failure(
      'choose_payment_method',
      'No payment methods configured — enable Stripe or cash payments.',
    );
  }

  return success(
    'choose_payment_method',
    `Payment options: ${options.map((o) => o.label).join(', ')}.`,
    {
      options,
      acceptCashPayments: payment.acceptCashPayments,
      onlinePaymentsEnabled: online,
    },
  );
}

export async function handlePayOnlineLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) return failure('pay_online', 'Business not found.');
  if (!isOnlinePaymentsEnabled(business.settings)) {
    return failure(
      'pay_online',
      'Online card payments are not configured for this business.',
    );
  }
  return success('pay_online', 'Proceed to Stripe checkout to pay online.', {
    paymentMethod: 'online',
    onlinePaymentsEnabled: true,
  });
}

export async function handlePayCashAtVisitLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) return failure('pay_cash_at_visit', 'Business not found.');
  const payment = resolvePublicPaymentSettings(business.settings);
  if (!payment.acceptCashPayments) {
    return failure(
      'pay_cash_at_visit',
      'Cash pay-at-venue is not enabled for this business.',
    );
  }
  return success(
    'pay_cash_at_visit',
    'Book with cash payment — pay at your appointment.',
    {
      paymentMethod: 'cash',
      payAtVenue: true,
    },
  );
}

export async function handlePurchaseSubscriptionCheckoutLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const planId = params.planId as string | undefined;
  if (!planId) {
    return failure(
      'purchase_subscription_checkout',
      'Specify subscription planId for checkout preview.',
      {
        clarify: true,
        missing: ['planId'],
      },
    );
  }
  try {
    const checkout = await deps.subscriptionsService.getPlanCheckoutDetails(
      businessId,
      planId,
    );
    return success(
      'purchase_subscription_checkout',
      `${checkout.planName} — $${Number(checkout.amount).toFixed(2)} for ${checkout.includedAppointments} visits / ${checkout.durationMonths} months.`,
      { checkout },
    );
  } catch (err: any) {
    return failure(
      'purchase_subscription_checkout',
      err?.message ?? 'Subscription checkout preview failed.',
    );
  }
}

export async function handleExplainWhyStripeRequiredLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business)
    return failure('explain_why_stripe_required', 'Business not found.');

  const payment = resolvePublicPaymentSettings(business.settings);
  const online = isOnlinePaymentsEnabled(business.settings);
  const reasons: string[] = [];
  if (online && !payment.acceptCashPayments) {
    reasons.push(
      'This salon accepts online card payments only — Stripe checkout is required.',
    );
  } else if (online) {
    reasons.push('Online card payment uses Stripe for secure checkout.');
  } else {
    reasons.push(
      'Stripe is not configured — enable Connect to accept online payments.',
    );
  }

  return success('explain_why_stripe_required', reasons.join(' '), {
    onlinePaymentsEnabled: online,
    acceptCashPayments: payment.acceptCashPayments,
    reasons,
  });
}

export async function handleReceiptStatusLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const bookingId = params.bookingId as string | undefined;
  if (!bookingId) {
    return failure(
      'receipt_status',
      'Specify bookingId to check receipt status.',
      {
        clarify: true,
        missing: ['bookingId'],
      },
    );
  }
  const booking = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
  });
  if (!booking) return failure('receipt_status', 'Booking not found.');

  const sent = Boolean(
    booking.metadata?.receiptSentAt ?? booking.metadata?.confirmationEmailSent,
  );
  const status =
    booking.paymentStatus === PaymentStatus.PAID
      ? sent
        ? 'Receipt sent — payment confirmed.'
        : 'Payment confirmed — receipt pending or not emailed yet.'
      : 'Receipt unavailable — payment not completed.';

  return success('receipt_status', status, {
    bookingId: booking.id,
    paymentStatus: booking.paymentStatus,
    receiptSent: sent,
    receiptSentAt: booking.metadata?.receiptSentAt ?? null,
  });
}

function mergeCompoundContext(
  context: Record<string, unknown>,
  step: PaymentsCompoundStep,
  result: CommandResult,
): Record<string, unknown> {
  const details = result.details as Record<string, unknown>;
  const next = {
    ...context,
    ...pickSharedBookingContextSlice(step.params),
  };

  if (step.action === 'book_nearest_slot') {
    next.serviceId = details.serviceId;
    next.employeeId = details.employeeId;
    next.startTime = details.startTime;
    next.serviceName = details.serviceName;
    if (details.date) next.date = details.date;
    if (details.timeOfDay) next.timeOfDay = details.timeOfDay;
    if (details.chosenAvailabilityWindow) {
      next.chosenAvailabilityWindow = details.chosenAvailabilityWindow;
    }
  }
  if (step.action === 'check_providers_for_service') {
    next.serviceId = details.serviceId;
    next.serviceName = details.serviceName;
    const providers = details.providers as Array<{ id: string }> | undefined;
    if (providers?.length && !next.employeeId)
      next.employeeId = providers[0].id;
    Object.assign(next, mergeCheckProvidersHandoffIntoContext({}, result));
  }
  if (
    step.action === 'apply_gift_card_code' ||
    step.action === 'check_gift_card_balance'
  ) {
    const balance = details.balance as { code?: string } | undefined;
    if (balance?.code) next.giftCardCode = balance.code;
  }
  Object.assign(next, pickSharedBookingContextSlice(details));
  return next;
}

export async function handlePaymentsCompoundLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const safeParams = params ?? {};
  const steps: PaymentsCompoundStep[] =
    (safeParams.compoundSteps as PaymentsCompoundStep[] | undefined) ??
    decomposePaymentsCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple payment/checkout commands. Try separating with "and" or semicolons.',
      { clarify: true },
    );
  }

  const results: CommandResult[] = [];
  let compoundContext: Record<string, unknown> = {
    ...safeParams,
    _prompt: prompt,
  };

  for (const step of steps.slice(0, 4)) {
    const stepParams = {
      ...step.params,
      ...compoundContext,
      _prompt: step.segment,
    };
    let result: CommandResult;
    switch (step.action) {
      case 'summarize_unpaid':
        result = await handleSummarizeUnpaidLogic(deps, businessId, stepParams);
        break;
      case 'validate_gift_card':
        result = await handleValidateGiftCardLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'export_accounting':
        result = await handleExportAccountingLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'export_commissions':
        result = await handleExportCommissionsLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'explain_checkout_total':
        result = await handleExplainCheckoutTotalLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'list_subscription_revenue':
        result = await handleListSubscriptionRevenueLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'configure_cash_payments':
        result = await handleConfigureCashPaymentsLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'adjust_gift_card_balance':
        result = await handleAdjustGiftCardBalanceLogic(
          deps,
          businessId,
          stepParams,
          userId,
        );
        break;
      case 'extend_gift_card_expiry':
        result = await handleExtendGiftCardExpiryLogic(
          deps,
          businessId,
          stepParams,
          userId,
        );
        break;
      case 'refund_gift_card_order':
        result = await handleRefundGiftCardOrderLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'explain_payment_status':
        result = await handleExplainPaymentStatusLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'collect_cash_confirm':
        result = await handleCollectCashConfirmLogic(
          deps,
          businessId,
          stepParams,
          userId,
        );
        break;
      case 'check_providers_for_service':
        result = await handleCheckProvidersForServiceLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'book_nearest_slot':
        result = await handleBookNearestSlotLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'apply_gift_card_code':
        result = await handleApplyGiftCardCodeLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'check_gift_card_balance':
        result = await handleCheckGiftCardBalanceLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'buy_gift_card':
        result = await handleBuyGiftCardLogic(
          deps,
          businessId,
          stepParams,
          false,
        );
        break;
      case 'buy_gift_card_physical':
        result = await handleBuyGiftCardLogic(
          deps,
          businessId,
          stepParams,
          true,
        );
        break;
      case 'choose_payment_method':
        result = await handleChoosePaymentMethodLogic(deps, businessId);
        break;
      case 'pay_online':
        result = await handlePayOnlineLogic(deps, businessId);
        break;
      case 'pay_cash_at_visit':
        result = await handlePayCashAtVisitLogic(deps, businessId);
        break;
      case 'purchase_subscription_checkout':
        result = await handlePurchaseSubscriptionCheckoutLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'explain_why_stripe_required':
        result = await handleExplainWhyStripeRequiredLogic(deps, businessId);
        break;
      case 'receipt_status':
        result = await handleReceiptStatusLogic(deps, businessId, stepParams);
        break;
      default:
        result = failure(
          step.action,
          `Unsupported payments compound step: ${step.action}.`,
        );
    }
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((r) => r.action),
          failedStep: step.action,
          userId,
        },
      };
    }
    compoundContext = mergeCompoundContext(compoundContext, step, result);
  }

  const providerStep = [...results]
    .reverse()
    .find((entry) => entry.action === 'check_providers_for_service');
  const providerDetails = providerStep?.details as
    | Record<string, unknown>
    | undefined;
  const bookStep = [...results]
    .reverse()
    .find((entry) => entry.action === 'book_nearest_slot');
  const bookDetails = bookStep?.details as Record<string, unknown> | undefined;

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} payment/checkout step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      paymentsCompound: true,
      userId,
      finalContext: compoundContext,
      providers: providerDetails?.providers,
      availableProviders: providerDetails?.availableProviders,
      availability: providerDetails?.availability,
      serviceName: providerDetails?.serviceName,
      date: providerDetails?.date,
      checkProvidersHandoff:
        bookDetails?.checkProvidersHandoff ??
        compoundContext.checkProvidersHandoff,
    },
  };
}
