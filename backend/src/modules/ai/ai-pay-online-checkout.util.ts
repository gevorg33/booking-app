import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  isExplainAmountDueNowPrompt,
  isExplainWhyPrepaymentPrompt,
} from './ai-explain-prepayment.util.js';
import { isAskPaymentOptionsPrompt } from './ai-cash-payment-checkout.util.js';

export const CUSTOMER_PUBLIC_PAY_ONLINE_CLASSIFIER_RULES = `- pay_online: MUTATE — select secure Stripe card checkout after the customer picked a time slot. Triggers: pay online, pay with card, continue to payment, proceed to Stripe checkout, complete checkout with card. Sets paymentMethod=online and navigates to checkout when serviceId/startTime/employeeId are in session. Fails when Stripe is not connected or online payments disabled. NOT choose_payment_method (list options), NOT pay_cash_at_visit (cash selection), NOT explain_why_stripe_required (why card required), NOT resume_pending_payment (restore abandoned device session — "closed app mid-checkout"), NOT book_nearest_slot (pick slot).`;

export type PayOnlineCheckoutPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'pay_online';
  serviceName?: string;
};

export const PAY_ONLINE_CHECKOUT_PROMPTS: readonly PayOnlineCheckoutPromptFixture[] =
  [
    {
      id: 'pay-online-customer',
      prompt: 'Pay online',
      surface: 'customer',
      expectedAction: 'pay_online',
    },
    {
      id: 'pay-with-card-customer',
      prompt: 'Pay with card',
      surface: 'customer',
      expectedAction: 'pay_online',
    },
    {
      id: 'checkout-online-customer',
      prompt: 'Checkout online with card',
      surface: 'customer',
      expectedAction: 'pay_online',
    },
    {
      id: 'continue-payment-customer',
      prompt: 'Continue to payment',
      surface: 'customer',
      expectedAction: 'pay_online',
    },
    {
      id: 'finish-stripe-checkout-customer',
      prompt: 'Finish Stripe checkout',
      surface: 'customer',
      expectedAction: 'pay_online',
    },
    {
      id: 'proceed-secure-checkout-customer',
      prompt: 'Proceed to secure checkout',
      surface: 'customer',
      expectedAction: 'pay_online',
    },
    {
      id: 'complete-checkout-card-customer',
      prompt: 'Complete checkout with card',
      surface: 'customer',
      expectedAction: 'pay_online',
    },
    {
      id: 'pay-by-card-now-customer',
      prompt: 'Pay by card now',
      surface: 'customer',
      expectedAction: 'pay_online',
    },
    {
      id: 'use-card-checkout-customer',
      prompt: 'Use my card for checkout',
      surface: 'customer',
      expectedAction: 'pay_online',
    },
    {
      id: 'pay-online-massage-customer',
      prompt: 'Pay online for massage',
      surface: 'customer',
      expectedAction: 'pay_online',
      serviceName: 'massage',
    },
    {
      id: 'open-stripe-customer',
      prompt: 'Open Stripe checkout',
      surface: 'customer',
      expectedAction: 'pay_online',
    },
    {
      id: 'ready-pay-online-customer',
      prompt: "I'm ready to pay online",
      surface: 'customer',
      expectedAction: 'pay_online',
    },
    {
      id: 'pay-online-public',
      prompt: 'Pay online',
      surface: 'public',
      expectedAction: 'pay_online',
    },
    {
      id: 'pay-with-card-public',
      prompt: 'Pay with card',
      surface: 'public',
      expectedAction: 'pay_online',
    },
    {
      id: 'continue-payment-public',
      prompt: 'Continue to payment',
      surface: 'public',
      expectedAction: 'pay_online',
    },
    {
      id: 'finish-checkout-public',
      prompt: 'Finish checkout with card',
      surface: 'public',
      expectedAction: 'pay_online',
    },
    {
      id: 'proceed-stripe-public',
      prompt: 'Proceed to Stripe',
      surface: 'public',
      expectedAction: 'pay_online',
    },
    {
      id: 'pay-online-haircut-public',
      prompt: 'Pay online for my haircut',
      surface: 'public',
      expectedAction: 'pay_online',
      serviceName: 'haircut',
    },
    {
      id: 'use-card-booking-public',
      prompt: 'Use card to complete booking',
      surface: 'public',
      expectedAction: 'pay_online',
    },
    {
      id: 'secure-checkout-public',
      prompt: 'Take me to secure card checkout',
      surface: 'public',
      expectedAction: 'pay_online',
    },
  ];

export function enrichPayOnlineParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  extractServiceName: (value: string) => string | null,
): Record<string, unknown> {
  const serviceName =
    (params.serviceName as string | undefined)?.trim() ||
    extractServiceName(prompt);
  if (!serviceName) return params;
  return { ...params, serviceName };
}

export function hasPayOnlineSlotContext(
  params: Record<string, unknown>,
): boolean {
  if (params.packageId) return true;
  const startTime = params.startTime as string | undefined;
  const employeeId = params.employeeId as string | undefined;
  const serviceId = params.serviceId as string | undefined;
  const cartServiceIds = params.cartServiceIds as string[] | undefined;
  if (startTime && employeeId && (serviceId || cartServiceIds?.length)) {
    return true;
  }
  return Boolean(serviceId || cartServiceIds?.length);
}

export function buildPayOnlineCheckoutNavigate(
  params: Record<string, unknown>,
): { path: string; query: Record<string, string> } | null {
  const startTime = params.startTime as string | undefined;
  const employeeId = params.employeeId as string | undefined;
  const packageId = params.packageId as string | undefined;
  const cartServiceIds = Array.isArray(params.cartServiceIds)
    ? params.cartServiceIds.map(String).filter(Boolean)
    : [];
  const serviceId = params.serviceId as string | undefined;
  const serviceIds = cartServiceIds.length
    ? cartServiceIds
    : serviceId
      ? [serviceId]
      : [];

  if (packageId) {
    return {
      path: 'checkout',
      query: {
        packageId,
        payment: 'online',
        ...(startTime ? { startTime } : {}),
      },
    };
  }

  if (serviceIds.length > 1 && startTime && employeeId) {
    return {
      path: 'multi/checkout',
      query: {
        services: serviceIds.join(','),
        startTime,
        employeeId,
        payment: 'online',
      },
    };
  }

  if (serviceIds.length === 1 && startTime && employeeId) {
    return {
      path: 'checkout',
      query: {
        serviceId: serviceIds[0]!,
        startTime,
        employeeId,
        payment: 'online',
      },
    };
  }

  if (serviceIds.length === 1) {
    return {
      path: 'checkout',
      query: {
        serviceId: serviceIds[0]!,
        payment: 'online',
      },
    };
  }

  return null;
}

export function buildPayOnlineCopy(options: {
  onlineEnabled: boolean;
  stripeConfigured: boolean;
  service?: {
    name?: string | null;
    prepaymentMode?: PrepaymentMode;
  } | null;
  hasSlotContext: boolean;
}): {
  summary: string;
  available: boolean;
  details: Record<string, unknown>;
} {
  if (!options.stripeConfigured) {
    return {
      summary:
        'Stripe checkout is not set up yet — online card payment is unavailable.',
      available: false,
      details: {
        paymentMethod: 'online',
        onlinePaymentsEnabled: options.onlineEnabled,
        stripeConfigured: false,
      },
    };
  }

  if (!options.onlineEnabled) {
    return {
      summary: 'Online card payments are not enabled for this business.',
      available: false,
      details: {
        paymentMethod: 'online',
        onlinePaymentsEnabled: false,
        stripeConfigured: true,
      },
    };
  }

  const serviceLabel = options.service ? ` for ${options.service.name}` : '';
  const prepaymentNote =
    options.service?.prepaymentMode === PrepaymentMode.FULL
      ? ' Full prepayment is due now via Stripe.'
      : options.service?.prepaymentMode === PrepaymentMode.DEPOSIT
        ? ' Your deposit is collected securely via Stripe.'
        : '';
  const slotNote = options.hasSlotContext
    ? ' Opening secure Stripe checkout for your selected time.'
    : '';

  return {
    summary:
      `Pay online with card${serviceLabel}${slotNote}${prepaymentNote}`.trim(),
    available: true,
    details: {
      paymentMethod: 'online',
      onlinePaymentsEnabled: true,
      stripeConfigured: true,
      payOnline: true,
      prepaymentMode: options.service?.prepaymentMode ?? null,
    },
  };
}

export function isExplicitPayOnlinePrompt(prompt: string): boolean {
  if (isExplainWhyPrepaymentPrompt(prompt)) return false;
  if (isExplainAmountDueNowPrompt(prompt)) return false;
  if (isAskPaymentOptionsPrompt(prompt)) return false;
  if (/\b(why|explain|how much|what|which|can i|could i|do you)\b/i.test(prompt)) {
    if (/\b(pay\s+online|card|stripe)\b/i.test(prompt)) return false;
  }

  if (
    /\b(pay\s+online|checkout\s+online|pay\s+with\s+(?:my\s+)?card|pay\s+by\s+card|use\s+(?:my\s+)?card)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(continue|finish|complete|proceed|open|take me to)\b/i.test(prompt) &&
    /\b(payment|checkout|stripe|secure checkout|card checkout)\b/i.test(
      prompt,
    ) &&
    !/\bcontinue\s+my\s+payment\b/i.test(prompt) &&
    !/\b(closed|mid[\s-]?checkout|abandoned|left\s+(?:off|during)|restore|resume)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (/\b(ready to pay online|pay online now)\b/i.test(prompt)) return true;

  return false;
}

export function rescuePayOnlineCheckoutIntent(
  prompt: string,
  action: string,
): { action: 'pay_online'; rescueReason: string } | null {
  if (action === 'pay_online') return null;
  if (isExplicitPayOnlinePrompt(prompt)) {
    return { action: 'pay_online', rescueReason: 'pay_online' };
  }
  return null;
}
