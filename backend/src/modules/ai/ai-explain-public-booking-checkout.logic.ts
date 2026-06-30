import type { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service, PrepaymentMode } from '../service/entities/service.entity.js';
import { getBusinessStripeIntegration } from '../billing/stripe-integration.types.js';
import { resolvePublicPaymentSettings } from '../../common/utils/customer-self-service.util.js';
import { readBusinessGiftCardSettings } from '../gift-cards/gift-card.types.js';
import { describeCheckoutDefaultPrepayment } from './ai-checkout-defaults.util.js';
import type { CommandResult } from './command-completion.types.js';
import { isExplainPublicBookingCheckoutPrompt } from './ai-explain-public-booking-checkout.util.js';

const NAVIGATE = {
  path: '/dashboard/billing',
  label: 'Open Billing & checkout settings',
};

export interface ExplainPublicBookingCheckoutLogicDeps {
  businessRepo: Repository<Business>;
  serviceRepo: Repository<Service>;
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function countServicesByPrepayment(services: Service[]): {
  full: number;
  deposit: number;
  none: number;
} {
  let full = 0;
  let deposit = 0;
  let none = 0;
  for (const service of services) {
    switch (service.prepaymentMode) {
      case PrepaymentMode.FULL:
        full += 1;
        break;
      case PrepaymentMode.DEPOSIT:
        deposit += 1;
        break;
      default:
        none += 1;
        break;
    }
  }
  return { full, deposit, none };
}

export function buildPublicBookingCheckoutSummary(input: {
  stripeConnected: boolean;
  acceptCashPayments: boolean;
  giftCardPurchaseEnabled: boolean;
  fullPrepaymentCount: number;
  depositPrepaymentCount: number;
  totalActiveServices: number;
  defaultServicePrepaymentMode?: PrepaymentMode;
  defaultServiceDepositPercent?: number;
}): string {
  const onlineCount = input.fullPrepaymentCount + input.depositPrepaymentCount;
  const lines: string[] = [
    'Public booking checkout: visitors enter promo or gift-card codes first, then pay any remaining balance online (Stripe) or at the venue (cash), depending on your settings and each service prepayment mode.',
  ];

  lines.push(
    input.stripeConnected
      ? 'Stripe Connect is connected — card checkout is available when a service requires full or deposit prepayment and amount due is greater than zero.'
      : 'Stripe Connect is not connected — visitors cannot pay by card online until Billing onboarding is complete.',
  );

  lines.push(
    input.acceptCashPayments
      ? 'Cash at venue is enabled — after discounts, visitors may choose pay-at-venue on one-time bookings when the service is not full-prepayment-only and no deposit is due now.'
      : 'Cash at venue is disabled — checkout does not offer pay-at-venue.',
  );

  lines.push(
    'Gift cards at checkout: a valid code in the promo field reduces amount due before payment method selection (works with Stripe or cash).',
  );

  lines.push(
    input.giftCardPurchaseEnabled
      ? 'Gift card sales are enabled on public booking — visitors can also buy new gift cards (card or cash when allowed) from the gift-cards page.'
      : 'Gift card purchase on public booking is off — existing codes still apply at checkout when valid.',
  );

  if (onlineCount > 0) {
    lines.push(
      `${onlineCount} of ${input.totalActiveServices} active service(s) require online prepayment (${input.fullPrepaymentCount} full, ${input.depositPrepaymentCount} deposit) — per-service rules determine whether Stripe is required or cash remains available.`,
    );
  } else {
    lines.push(
      'No active services require online prepayment — checkout collects contact details only unless you enable prepayment per service.',
    );
  }

  if (input.defaultServicePrepaymentMode) {
    lines.push(
      `New services default to ${describeCheckoutDefaultPrepayment(
        input.defaultServicePrepaymentMode,
        input.defaultServiceDepositPercent,
      )}.`,
    );
  }

  return lines.join(' ');
}

export async function handleExplainPublicBookingCheckoutLogic(
  deps: ExplainPublicBookingCheckoutLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  if (!isExplainPublicBookingCheckoutPrompt(effectivePrompt)) {
    return failure(
      'explain_public_booking_checkout',
      'Ask how public booking checkout payment works (e.g. "Explain public booking checkout payment options" or "How do cash and gift cards interact on the booking page?").',
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_public_booking_checkout', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const payment = resolvePublicPaymentSettings(settings);
  const giftCards = readBusinessGiftCardSettings(settings);
  const stripe = getBusinessStripeIntegration(settings ?? {});
  const stripeConnected = Boolean(stripe.connectAccountId);

  const catalog = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    order: { name: 'ASC' },
  });
  const grouped = countServicesByPrepayment(catalog);
  const onlineCount = grouped.full + grouped.deposit;

  const summary = buildPublicBookingCheckoutSummary({
    stripeConnected,
    acceptCashPayments: payment.acceptCashPayments,
    giftCardPurchaseEnabled: giftCards.purchaseEnabled,
    fullPrepaymentCount: grouped.full,
    depositPrepaymentCount: grouped.deposit,
    totalActiveServices: catalog.length,
    defaultServicePrepaymentMode:
      payment.defaultServicePrepaymentMode as PrepaymentMode | undefined,
    defaultServiceDepositPercent:
      payment.defaultServiceDepositPercent ?? undefined,
  });

  return success('explain_public_booking_checkout', summary, {
    stripeConnectConnected: stripeConnected,
    connectAccountId: stripe.connectAccountId,
    acceptCashPayments: payment.acceptCashPayments,
    giftCardPurchaseEnabled: giftCards.purchaseEnabled,
    totalActiveServices: catalog.length,
    onlinePaymentEnabledCount: onlineCount,
    fullPrepaymentCount: grouped.full,
    depositPrepaymentCount: grouped.deposit,
    onlinePaymentOffCount: grouped.none,
    defaultServicePrepaymentMode: payment.defaultServicePrepaymentMode,
    defaultServiceDepositPercent: payment.defaultServiceDepositPercent,
    navigate: NAVIGATE,
  });
}
