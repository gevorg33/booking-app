import {
  PrepaymentMode,
  type Service,
} from '../service/entities/service.entity.js';
import {
  isExplainWhyPrepaymentPrompt,
  isExplainAmountDueNowPrompt,
  isDoIPayOnlineForServicePrompt,
  referencesCatalogServiceContext,
} from './ai-explain-prepayment.util.js';
import { isExplainPaymentOptionsForServicePrompt } from './ai-explain-payment-options-for-service.util.js';
import { isGuestPayCashManageCompoundCandidate } from './ai-guest-pay-cash-manage-cue.util.js';
import { isConfigureCheckoutDefaultsPrompt } from './ai-checkout-defaults.util.js';

export const CUSTOMER_PUBLIC_CASH_PAYMENT_CLASSIFIER_RULES = `- choose_payment_method: MUTATE — list or confirm checkout payment options for the current booking (online card via Stripe, pay cash at venue when enabled). Triggers: choose/select payment method, what payment options at checkout, can I pay online/card at checkout, do you accept cash (without naming a catalog service). NOT configure_cash_payments (dashboard mutate), NOT explain_public_booking_checkout (holistic checkout flow read), NOT explain_why_stripe_required (policy why), NOT explain_payment_options_for_service (can I pay cash/online for a named service — READ), NOT explain_checkout_total (amount math), NOT pay_cash_at_visit (explicit cash selection).
- pay_cash_at_visit: MUTATE — select pay-at-venue / cash for checkout when acceptCashPayments is enabled. Triggers: pay cash at visit, pay at venue, pay in cash at appointment, I'll pay cash when I arrive. Fails clearly when cash is disabled or the service requires online prepayment/deposit that cannot be skipped. NOT guest_pay_cash_manage (guest book + pay cash + email manage link compound); NOT pay_at_venue_fallback (skip/instead online payment — "Pay at salon instead", "Skip online payment"), NOT choose_payment_method (list options), NOT pay_online (card selection), NOT book_with_cash (booking-flow preference).`;

export type CashPaymentCheckoutPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'choose_payment_method' | 'pay_cash_at_visit';
  serviceName?: string;
};

export const CASH_PAYMENT_CHECKOUT_PROMPTS: readonly CashPaymentCheckoutPromptFixture[] =
  [
    {
      id: 'payment-options-checkout-customer',
      prompt: 'Which payment method can I use at checkout?',
      surface: 'customer',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'what-payment-options-customer',
      prompt: 'What payment options do I have?',
      surface: 'customer',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'can-pay-online-card-customer',
      prompt: 'Can I pay online with card?',
      surface: 'customer',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'how-pay-checkout-customer',
      prompt: 'How do I pay at checkout?',
      surface: 'customer',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'accept-cash-customer',
      prompt: 'Do you accept cash payments?',
      surface: 'customer',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'ways-to-pay-customer',
      prompt: 'What ways can I pay for my appointment?',
      surface: 'customer',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'pay-cash-at-visit-customer',
      prompt: 'Pay cash at visit',
      surface: 'customer',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'pay-at-venue-customer',
      prompt: "I'll pay at the venue",
      surface: 'customer',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'pay-in-cash-appointment-customer',
      prompt: 'Pay in cash at my appointment',
      surface: 'customer',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'pay-cash-when-arrive-customer',
      prompt: 'I want to pay cash when I arrive',
      surface: 'customer',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'choose-cash-visit-customer',
      prompt: 'Choose cash payment at visit',
      surface: 'customer',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'pay-venue-massage-customer',
      prompt: 'Pay at venue for massage',
      surface: 'customer',
      expectedAction: 'pay_cash_at_visit',
      serviceName: 'massage',
    },
    {
      id: 'pay-cash-haircut-customer',
      prompt: "I'll pay cash for my haircut",
      surface: 'customer',
      expectedAction: 'pay_cash_at_visit',
      serviceName: 'haircut',
    },
    {
      id: 'cash-at-visit-please-customer',
      prompt: 'Cash at visit please',
      surface: 'customer',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'payment-methods-public',
      prompt: 'What payment methods are available?',
      surface: 'public',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'can-pay-cash-booking-page-public',
      prompt: 'Can I pay cash on this booking page?',
      surface: 'public',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'take-cash-checkout-public',
      prompt: 'Do you take cash at checkout?',
      surface: 'public',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'payment-options-public-booking-public',
      prompt: 'Which payment options on public booking?',
      surface: 'public',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'pay-by-card-online-public',
      prompt: 'Can I pay by card online?',
      surface: 'public',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'cash-accepted-booking-public',
      prompt: 'Is cash accepted for booking?',
      surface: 'public',
      expectedAction: 'choose_payment_method',
    },
    {
      id: 'pay-cash-at-visit-public',
      prompt: 'Pay cash at visit',
      surface: 'public',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'pay-at-venue-public',
      prompt: 'Pay at venue',
      surface: 'public',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'pay-cash-when-visit-public',
      prompt: "I'll pay cash when I visit",
      surface: 'public',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'book-with-cash-public',
      prompt: 'Book with cash payment',
      surface: 'public',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'pay-cash-salon-public',
      prompt: 'Pay in cash at the salon',
      surface: 'public',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'cash-payment-appointment-public',
      prompt: 'Cash payment at my appointment',
      surface: 'public',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'prefer-cash-visit-public',
      prompt: 'I prefer to pay cash at visit',
      surface: 'public',
      expectedAction: 'pay_cash_at_visit',
    },
    {
      id: 'pay-cash-this-booking-public',
      prompt: 'Pay cash for this booking',
      surface: 'public',
      expectedAction: 'pay_cash_at_visit',
    },
  ];

export type ServiceCashAvailability = {
  cashAtVenueAllowed: boolean;
  cashForFullVisit: boolean;
  prepaymentBlocksCashOnly: boolean;
  prepaymentMode?: PrepaymentMode;
  note?: string;
};

export function resolveServiceCashAvailability(
  service: Pick<Service, 'name' | 'prepaymentMode'> | null | undefined,
  options: {
    acceptCashPayments: boolean;
    onlineEnabled: boolean;
  },
): ServiceCashAvailability {
  if (!options.acceptCashPayments) {
    return {
      cashAtVenueAllowed: false,
      cashForFullVisit: false,
      prepaymentBlocksCashOnly: false,
      note: 'Cash pay-at-venue is not enabled for this business.',
    };
  }

  if (!service) {
    return {
      cashAtVenueAllowed: true,
      cashForFullVisit: true,
      prepaymentBlocksCashOnly: false,
      note: 'Cash at venue is available when the service does not require online prepayment.',
    };
  }

  const prepaymentRequired =
    options.onlineEnabled && service.prepaymentMode !== PrepaymentMode.NONE;

  if (!prepaymentRequired) {
    return {
      cashAtVenueAllowed: true,
      cashForFullVisit: true,
      prepaymentBlocksCashOnly: false,
      prepaymentMode: service.prepaymentMode,
      note: `${service.name} can be booked with pay-at-venue cash when no online prepayment is required.`,
    };
  }

  if (service.prepaymentMode === PrepaymentMode.FULL) {
    return {
      cashAtVenueAllowed: false,
      cashForFullVisit: false,
      prepaymentBlocksCashOnly: true,
      prepaymentMode: service.prepaymentMode,
      note: `${service.name} requires full payment online — cash at venue is not available for checkout.`,
    };
  }

  return {
    cashAtVenueAllowed: true,
    cashForFullVisit: false,
    prepaymentBlocksCashOnly: true,
    prepaymentMode: service.prepaymentMode,
    note: `${service.name} requires an online deposit; any remaining balance can be paid cash at your visit.`,
  };
}

export type PaymentMethodOption = {
  method: string;
  label: string;
  available: boolean;
  note?: string;
};

export function buildPaymentMethodOptionsCopy(options: {
  onlineEnabled: boolean;
  acceptCashPayments: boolean;
  service?: Pick<Service, 'name' | 'prepaymentMode'> | null;
}): {
  summary: string;
  options: PaymentMethodOption[];
  acceptCashPayments: boolean;
  onlinePaymentsEnabled: boolean;
  serviceCash?: ServiceCashAvailability;
} {
  const cashAvailability = resolveServiceCashAvailability(options.service, {
    acceptCashPayments: options.acceptCashPayments,
    onlineEnabled: options.onlineEnabled,
  });
  const paymentOptions: PaymentMethodOption[] = [];

  if (options.onlineEnabled) {
    paymentOptions.push({
      method: 'online',
      label: 'Pay online (card)',
      available: true,
      note: cashAvailability.prepaymentBlocksCashOnly
        ? 'Required for prepayment or deposit on this service.'
        : undefined,
    });
  }

  if (options.acceptCashPayments) {
    paymentOptions.push({
      method: 'cash',
      label: 'Pay cash at visit',
      available: cashAvailability.cashAtVenueAllowed,
      note: cashAvailability.cashForFullVisit
        ? 'Pay the full amount at your appointment.'
        : cashAvailability.prepaymentBlocksCashOnly
          ? 'Available for any balance due at visit after online deposit.'
          : undefined,
    });
  }

  const labels = paymentOptions
    .filter((option) => option.available)
    .map((option) => option.label);
  let summary: string;
  if (!labels.length) {
    summary =
      'No payment methods are configured — enable Stripe Connect or cash pay-at-venue in settings.';
  } else if (!options.acceptCashPayments) {
    summary = `Online card payment only — cash at venue is not enabled. Options: ${labels.join(', ')}.`;
  } else if (options.service && cashAvailability.prepaymentBlocksCashOnly) {
    summary = `${labels.join(' or ')}. ${cashAvailability.note ?? ''}`.trim();
  } else if (options.service) {
    summary = `For ${options.service.name}: ${labels.join(' or ')}.`;
  } else {
    summary = `Payment options: ${labels.join(', ')}.`;
  }

  return {
    summary,
    options: paymentOptions,
    acceptCashPayments: options.acceptCashPayments,
    onlinePaymentsEnabled: options.onlineEnabled,
    serviceCash: cashAvailability,
  };
}

export function buildPayCashAtVisitCopy(options: {
  acceptCashPayments: boolean;
  service?: Pick<Service, 'name' | 'prepaymentMode'> | null;
  onlineEnabled: boolean;
}): { summary: string; available: boolean; details: Record<string, unknown> } {
  const cashAvailability = resolveServiceCashAvailability(options.service, {
    acceptCashPayments: options.acceptCashPayments,
    onlineEnabled: options.onlineEnabled,
  });

  if (!options.acceptCashPayments) {
    return {
      summary:
        'Cash pay-at-venue is not enabled — this business requires online card checkout.',
      available: false,
      details: {
        paymentMethod: 'cash',
        payAtVenue: false,
        acceptCashPayments: false,
        serviceCash: cashAvailability,
      },
    };
  }

  if (options.service && cashAvailability.prepaymentBlocksCashOnly) {
    if (options.service.prepaymentMode === PrepaymentMode.FULL) {
      return {
        summary:
          cashAvailability.note ??
          'Full online prepayment is required for this service.',
        available: false,
        details: {
          paymentMethod: 'cash',
          payAtVenue: false,
          acceptCashPayments: true,
          serviceCash: cashAvailability,
        },
      };
    }
    return {
      summary:
        `${cashAvailability.note ?? ''} Select pay online for the deposit, then pay any balance cash at your visit.`.trim(),
      available: false,
      details: {
        paymentMethod: 'cash',
        payAtVenue: true,
        acceptCashPayments: true,
        depositRequiredOnline: true,
        serviceCash: cashAvailability,
      },
    };
  }

  const serviceLabel = options.service ? ` for ${options.service.name}` : '';
  return {
    summary: `Book with cash payment${serviceLabel} — pay at your appointment.`,
    available: true,
    details: {
      paymentMethod: 'cash',
      payAtVenue: true,
      acceptCashPayments: true,
      serviceCash: cashAvailability,
    },
  };
}

export function enrichCashPaymentParamsFromPrompt(
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

export function isAskPaymentOptionsPrompt(prompt: string): boolean {
  if (isExplainWhyPrepaymentPrompt(prompt)) return false;
  if (isExplainAmountDueNowPrompt(prompt)) return false;
  if (isExplainPaymentOptionsForServicePrompt(prompt)) return false;
  if (isServiceNamedPaymentOptionsQuestionPrompt(prompt)) return false;
  if (
    /\b(pay\s+cash\s+at\s+visit|cash\s+at\s+(?:the\s+)?visit|pay\s+at\s+(?:the\s+)?venue)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /\b(can|could|may|do you|does|is)\b/i.test(prompt) &&
    /\b(pay\s+(?:in\s+)?cash|cash\s+(?:at|payment|accepted)|take\s+cash|payment\s+options?|pay\s+online|pay\s+by\s+card|accept\s+cash)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(how|what|which)\b/i.test(prompt) &&
    /\b(pay|payment\s+(?:method|options?|ways?|methods?))\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function isExplicitPayCashAtVisitPrompt(prompt: string): boolean {
  if (isConfigureCheckoutDefaultsPrompt(prompt)) return false;
  if (isGuestPayCashManageCompoundCandidate(prompt)) return false;
  if (isAskPaymentOptionsPrompt(prompt)) return false;
  if (isServiceNamedPaymentOptionsQuestionPrompt(prompt)) return false;
  if (
    /\b(skip|without|bypass|avoid|instead|rather\s+than|no\s+online|don't\s+pay\s+online)\b/i.test(
      prompt,
    ) &&
    /\b(online|stripe|card)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(i(?:'ll|\s+will|\s+want\s+to|\s+prefer\s+to)|choose|select)\b/i.test(
      prompt,
    ) &&
    /\b(pay\s+(?:in\s+)?cash|cash\s+(?:payment\s+)?at\s+(?:the\s+|my\s+)?(?:visit|appointment)|pay\s+at\s+(?:the\s+)?venue)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  return (
    /\b(pay\s+in\s+cash|cash\s+(?:payment\s+)?at\s+(?:the\s+|my\s+)?(?:visit|appointment)|pay\s+at\s+(?:the\s+)?venue|pay\s+cash|book\s+with\s+cash)\b/i.test(
      prompt,
    ) &&
    !/\b(show|list|display)\b/i.test(prompt) &&
    !/\b(?:appointments?|bookings?)\s+(?:list|history|calendar)\b/i.test(prompt)
  );
}

function isServiceNamedPaymentOptionsQuestionPrompt(prompt: string): boolean {
  if (/\bwhy\b/i.test(prompt)) return false;
  if (
    /\b(can|could|may|do|must)\s+i\s+pay\s+(?:online|by\s+card|in\s+cash|cash)\s+for\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(is|are)\s+.+\s+(?:online\s+payment|card\s+payment)\s+required\s+for\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    isDoIPayOnlineForServicePrompt(prompt) &&
    referencesCatalogServiceContext(prompt)
  ) {
    return true;
  }
  if (/эту\s+услугу/i.test(prompt) && /онлайн|наличн/i.test(prompt)) {
    return true;
  }
  if (/այս\s+ծառայության/i.test(prompt) && /առցանց|վճար|կանխիկ/i.test(prompt)) {
    return true;
  }
  return false;
}

export function rescueCashPaymentCheckoutIntent(
  prompt: string,
  action: string,
): {
  action: 'choose_payment_method' | 'pay_cash_at_visit';
  rescueReason: string;
} | null {
  if (action === 'choose_payment_method' || action === 'pay_cash_at_visit') {
    return null;
  }
  if (isConfigureCheckoutDefaultsPrompt(prompt)) return null;
  if (isExplicitPayCashAtVisitPrompt(prompt)) {
    return { action: 'pay_cash_at_visit', rescueReason: 'pay_cash_at_visit' };
  }
  if (isAskPaymentOptionsPrompt(prompt)) {
    return {
      action: 'choose_payment_method',
      rescueReason: 'payment_options',
    };
  }
  return null;
}
