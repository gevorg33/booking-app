import { PrepaymentMode, type Service } from '../service/entities/service.entity.js';
import { isExplainAmountDueNowPrompt } from './ai-explain-amount-due-now.util.js';

export { isExplainAmountDueNowPrompt } from './ai-explain-amount-due-now.util.js';

export const CUSTOMER_PUBLIC_PREPAYMENT_EXPLAIN_CLASSIFIER_RULES = `- explain_why_stripe_required: READ — explain why online card payment or prepayment is required at checkout (Stripe secure checkout). When the user asks why prepayment, why deposit, why pay now, or why Stripe, classify here — include serviceName when they name a catalog service. Summarizes per-service prepaymentMode (none|full|deposit), deposit amount due now, and balance at visit. NOT explain_payment_options_for_service (can I pay cash/online for a service — options read without why), NOT configure_service_online_payment (dashboard mutate), NOT explain_service_online_payment_setup (owner catalog summary), NOT explain_public_booking_checkout (holistic cash/online/gift-card flow), NOT pay_online|choose_payment_method (mutate checkout or list payment options), NOT explain_amount_due_now (how much due today / deposit math), and NOT explain_checkout_currency|explain_stripe_checkout_currency (currency display).
- explain_checkout_total: READ — explain the full checkout total breakdown for a named service including gift-card offset and remainder due at visit. Triggers: explain checkout total, checkout total breakdown with gift card. Uses session serviceId/serviceName on public booking when the user refers to the selected service. NOT explain_amount_due_now (pay today / deposit due now), NOT explain_checkout_tax (tax line), NOT list_services (catalog browse), NOT explain_why_stripe_required (policy why, not line-item math), NOT explain_service_price (listed card price + tax badge without checkout math).`;

export type ExplainPrepaymentPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_why_stripe_required' | 'explain_checkout_total';
  serviceName?: string;
};

export const EXPLAIN_PREPAYMENT_PROMPTS: readonly ExplainPrepaymentPromptFixture[] =
  [
    {
      id: 'why-prepayment-massage-customer',
      prompt: 'Why do I need prepayment for massage?',
      surface: 'customer',
      expectedAction: 'explain_why_stripe_required',
      serviceName: 'massage',
    },
    {
      id: 'why-pay-now-haircut-customer',
      prompt: 'Why must I pay online now for a haircut?',
      surface: 'customer',
      expectedAction: 'explain_why_stripe_required',
      serviceName: 'haircut',
    },
    {
      id: 'why-deposit-facial-customer',
      prompt: 'Why is there a deposit for facial?',
      surface: 'customer',
      expectedAction: 'explain_why_stripe_required',
      serviceName: 'facial',
    },
    {
      id: 'why-stripe-required-checkout-customer',
      prompt: 'Why is Stripe required at checkout?',
      surface: 'customer',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'why-pay-before-appointment-customer',
      prompt: 'Why do I have to pay before my appointment?',
      surface: 'customer',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'why-must-pay-now-customer',
      prompt: 'Why must I pay now?',
      surface: 'customer',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'why-online-payment-color-customer',
      prompt: 'Why does color require online payment?',
      surface: 'customer',
      expectedAction: 'explain_why_stripe_required',
      serviceName: 'color',
    },
    {
      id: 'explain-prepayment-policy-customer',
      prompt: 'Explain prepayment policy for spa day package service',
      surface: 'customer',
      expectedAction: 'explain_why_stripe_required',
      serviceName: 'spa day package service',
    },
    {
      id: 'why-card-required-customer',
      prompt: 'Why is card payment required?',
      surface: 'customer',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'why-half-deposit-customer',
      prompt: 'Why is half the price due upfront?',
      surface: 'customer',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'why-pay-online-manicure-customer',
      prompt: 'Why pay online for manicure?',
      surface: 'customer',
      expectedAction: 'explain_why_stripe_required',
      serviceName: 'manicure',
    },
    {
      id: 'checkout-total-breakdown-customer',
      prompt: 'Explain checkout total for haircut',
      surface: 'customer',
      expectedAction: 'explain_checkout_total',
      serviceName: 'haircut',
    },
    {
      id: 'why-prepayment-massage-public',
      prompt: 'Why is prepayment required for massage?',
      surface: 'public',
      expectedAction: 'explain_why_stripe_required',
      serviceName: 'massage',
    },
    {
      id: 'why-pay-online-booking-public',
      prompt: 'Why do I pay online when booking?',
      surface: 'public',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'why-deposit-public',
      prompt: 'Why is there a deposit on this booking page?',
      surface: 'public',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'why-stripe-checkout-public',
      prompt: 'Why does checkout use Stripe?',
      surface: 'public',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'why-full-prepayment-public',
      prompt: 'Why full prepayment for blowdry?',
      surface: 'public',
      expectedAction: 'explain_why_stripe_required',
      serviceName: 'blowdry',
    },
    {
      id: 'why-pay-now-slot-public',
      prompt: 'Why must I pay now to hold the slot?',
      surface: 'public',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'why-must-pay-now-public',
      prompt: 'Why must I pay now?',
      surface: 'public',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'explain-deposit-policy-public',
      prompt: 'Explain the deposit policy',
      surface: 'public',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'why-card-before-visit-public',
      prompt: 'Why pay by card before the visit?',
      surface: 'public',
      expectedAction: 'explain_why_stripe_required',
    },
    {
      id: 'why-online-for-massage-public',
      prompt: 'Why online payment for Swedish massage?',
      surface: 'public',
      expectedAction: 'explain_why_stripe_required',
      serviceName: 'Swedish massage',
    },
    {
      id: 'checkout-total-public',
      prompt: 'Explain checkout total for haircut',
      surface: 'public',
      expectedAction: 'explain_checkout_total',
      serviceName: 'haircut',
    },
  ];

/** Customer + public NL fixtures for explain_why_stripe_required (ai-cmd-customer-4.0 P0). */
export const EXPLAIN_WHY_STRIPE_REQUIRED_PROMPTS: readonly ExplainPrepaymentPromptFixture[] =
  EXPLAIN_PREPAYMENT_PROMPTS.filter(
    (row) => row.expectedAction === 'explain_why_stripe_required',
  );

export type PublicCatalogPrepaymentPromptFixture = {
  id: string;
  prompt: string;
  surface: 'public';
  expectedAction:
    | 'explain_payment_options_for_service'
    | 'explain_amount_due_now';
  sessionServiceId?: string;
  sessionServiceName?: string;
  prepaymentMode?: PrepaymentMode;
  expectsYes?: boolean;
};

/** ai-cmd-ext-7.2 — public booking catalog-context prepayment prompts. */
export const PUBLIC_CATALOG_PREPAYMENT_PROMPTS: readonly PublicCatalogPrepaymentPromptFixture[] =
  [
    {
      id: 'pay-online-this-service-public',
      prompt: 'Do I pay online for this service?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      sessionServiceId: 's1',
      sessionServiceName: 'Massage',
      prepaymentMode: PrepaymentMode.DEPOSIT,
      expectsYes: true,
    },
    {
      id: 'pay-online-selected-service-public',
      prompt: 'Do I need to pay online for the selected service?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      sessionServiceId: 's2',
      sessionServiceName: 'Haircut',
      prepaymentMode: PrepaymentMode.NONE,
      expectsYes: false,
    },
    {
      id: 'is-online-required-this-treatment-public',
      prompt: 'Is online payment required for this treatment?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      sessionServiceId: 's1',
      sessionServiceName: 'Massage',
      prepaymentMode: PrepaymentMode.FULL,
      expectsYes: true,
    },
    {
      id: 'must-pay-online-current-service-public',
      prompt: 'Must I pay online for the current service?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      sessionServiceId: 's1',
      sessionServiceName: 'Massage',
      prepaymentMode: PrepaymentMode.DEPOSIT,
      expectsYes: true,
    },
    {
      id: 'pay-online-what-i-picked-public',
      prompt: 'Do I pay online for what I picked?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      sessionServiceId: 's2',
      sessionServiceName: 'Haircut',
      prepaymentMode: PrepaymentMode.NONE,
      expectsYes: false,
    },
    {
      id: 'online-payment-this-booking-public',
      prompt: 'Is there online payment for this booking service?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      sessionServiceId: 's1',
      sessionServiceName: 'Massage',
      prepaymentMode: PrepaymentMode.DEPOSIT,
      expectsYes: true,
    },
    {
      id: 'pay-online-before-visit-this-service-public',
      prompt: 'Do I pay online before the visit for this service?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      sessionServiceId: 's2',
      sessionServiceName: 'Haircut',
      prepaymentMode: PrepaymentMode.NONE,
      expectsYes: false,
    },
    {
      id: 'card-required-this-service-public',
      prompt: 'Is card payment required for this service?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      sessionServiceId: 's1',
      sessionServiceName: 'Massage',
      prepaymentMode: PrepaymentMode.FULL,
      expectsYes: true,
    },
    {
      id: 'how-much-this-service-today-public',
      prompt: 'How much do I pay today for this service?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      sessionServiceId: 's1',
      sessionServiceName: 'Massage',
      prepaymentMode: PrepaymentMode.DEPOSIT,
    },
    {
      id: 'deposit-this-service-public',
      prompt: 'What deposit is due for the selected service?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      sessionServiceId: 's1',
      sessionServiceName: 'Massage',
      prepaymentMode: PrepaymentMode.DEPOSIT,
    },
    {
      id: 'amount-due-selected-service-public',
      prompt: 'Break down amount due now for the service I selected',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      sessionServiceId: 's1',
      sessionServiceName: 'Massage',
      prepaymentMode: PrepaymentMode.DEPOSIT,
    },
    {
      id: 'pay-today-current-service-public',
      prompt: "What's due today for the current service?",
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      sessionServiceId: 's2',
      sessionServiceName: 'Haircut',
      prepaymentMode: PrepaymentMode.NONE,
    },
  ];

export function resolveServicePrepaymentDueAmount(
  service: Pick<Service, 'price' | 'prepaymentMode' | 'depositAmount'>,
): number {
  const price = Number(service.price);
  if (service.prepaymentMode === PrepaymentMode.NONE) return 0;
  if (service.prepaymentMode === PrepaymentMode.FULL) return price;
  if (service.depositAmount != null && Number(service.depositAmount) > 0) {
    return Math.min(Number(service.depositAmount), price);
  }
  return Math.round(price * 50) / 100;
}

export function referencesCatalogServiceContext(prompt: string): boolean {
  return (
    /\b(this|the|selected|current|that)\s+(?:service|treatment|booking(?:\s+service)?)\b/i.test(
      prompt,
    ) ||
    /\bwhat\s+i(?:'ve|\s+have)\s+(?:selected|picked|chosen)\b/i.test(prompt) ||
    /\bservice\s+i\s+selected\b/i.test(prompt)
  );
}

export function isDoIPayOnlineForServicePrompt(prompt: string): boolean {
  if (/\bwhy\b/i.test(prompt)) return false;
  if (/\b(can|could|may)\b/i.test(prompt)) return false;
  return (
    /\bdo\s+i\s+(?:need\s+to\s+)?pay\s+online\b/i.test(prompt) ||
    /\bdo\s+i\s+have\s+to\s+pay\s+(?:online|by\s+card)\b/i.test(prompt) ||
    /\bis\s+(?:online\s+payment|card\s+payment)\s+required\b/i.test(prompt) ||
    /\bis\s+there\s+online\s+payment\b/i.test(prompt) ||
    /\bmust\s+i\s+pay\s+online\b/i.test(prompt)
  );
}

export function isDeicticServiceReference(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return (
    /^(this|the|that|selected|current)\s+(?:service|treatment)$/.test(
      normalized,
    ) ||
    normalized === 'what i picked' ||
    normalized === 'what i selected'
  );
}

export function hasPrepaymentServiceIdentity(
  params: Record<string, unknown>,
): boolean {
  const serviceName = (params.serviceName as string | undefined)?.trim();
  if (serviceName && isDeicticServiceReference(serviceName)) {
    return (params.serviceId != null && params.serviceId !== '');
  }
  return (
    (params.serviceId != null && params.serviceId !== '') ||
    (serviceName != null && serviceName !== '')
  );
}

export function enrichPrepaymentParamsFromCatalogContext(
  params: Record<string, unknown>,
  prompt: string,
  catalogContext?: Record<string, unknown>,
): Record<string, unknown> {
  if (hasPrepaymentServiceIdentity(params)) return params;
  const ctx = catalogContext ?? {};
  const sessionHasService =
    (ctx.serviceId != null && ctx.serviceId !== '') ||
    (ctx.serviceName != null && ctx.serviceName !== '');
  if (!sessionHasService) return params;

  if (
    referencesCatalogServiceContext(prompt) ||
    isDoIPayOnlineForServicePrompt(prompt)
  ) {
    const next = { ...params };
    if (ctx.serviceId != null && ctx.serviceId !== '') {
      next.serviceId = ctx.serviceId;
    }
    if (ctx.serviceName != null && ctx.serviceName !== '') {
      next.serviceName = ctx.serviceName;
    }
    return next;
  }
  return params;
}

export function needsCatalogServiceClarify(
  prompt: string,
  params: Record<string, unknown>,
): boolean {
  if (
    !referencesCatalogServiceContext(prompt) &&
    !isDoIPayOnlineForServicePrompt(prompt)
  ) {
    return false;
  }
  return !hasPrepaymentServiceIdentity(params);
}

export function describeServicePrepaymentPolicy(
  service: Pick<Service, 'prepaymentMode' | 'depositAmount' | 'price'>,
): string {
  if (service.prepaymentMode === PrepaymentMode.NONE) {
    return 'no online prepayment';
  }
  if (service.prepaymentMode === PrepaymentMode.FULL) {
    return 'full prepayment online';
  }
  if (service.depositAmount != null && Number(service.depositAmount) > 0) {
    return `$${Number(service.depositAmount).toFixed(2)} deposit online`;
  }
  return '50% deposit online';
}

export function isExplainWhyPrepaymentPrompt(prompt: string): boolean {
  if (isExplainAmountDueNowPrompt(prompt)) return false;
  if (isDoIPayOnlineForServicePrompt(prompt)) return false;
  if (/\bdo\s+i\s+pay\s+online\b/i.test(prompt)) return true;
  if (/\bwhy\s+(?:must|do)\s+i\s+(?:have\s+to\s+)?pay\b/i.test(prompt)) return true;
  if (/\bwhy\s+(?:do\s+i\s+need|is)\s+.*\b(prepayment|prepay|deposit)\b/i.test(prompt)) {
    return true;
  }
  if (/\bwhy\s+pay\s+online\b/i.test(prompt)) return true;
  if (/\bwhy\s+pay\s+(?:by\s+)?(?:card|online)\b/i.test(prompt)) return true;
  return (
    /\b(why|explain)\b/i.test(prompt) &&
    /\b(prepayment|prepay|deposit|pay\s+now|pay\s+online|online\s+payment|pay\s+before|pay\s+by\s+card|upfront|due\s+upfront|hold\s+the\s+slot|card\s+payment|before\s+(?:my\s+)?(?:appointment|visit)|when\s+booking|online\s+when\s+booking)\b/i.test(
      prompt,
    )
  );
}

function isExplainCheckoutTotalOnlyPrompt(prompt: string): boolean {
  if (isExplainAmountDueNowPrompt(prompt)) return false;
  return (
    /\b(?:explain|break\s*down)\b/i.test(prompt) &&
    /\bcheckout\s+total\b/i.test(prompt)
  );
}

export function rescueExplainPrepaymentIntent(
  prompt: string,
  action: string,
): {
  action: 'explain_why_stripe_required' | 'explain_checkout_total';
  rescueReason: string;
} | null {
  if (
    action === 'explain_why_stripe_required' ||
    action === 'explain_checkout_total' ||
    action === 'explain_amount_due_now'
  ) {
    return null;
  }
  if (isExplainWhyPrepaymentPrompt(prompt)) {
    return {
      action: 'explain_why_stripe_required',
      rescueReason: 'why_prepayment',
    };
  }
  if (isExplainCheckoutTotalOnlyPrompt(prompt)) {
    return {
      action: 'explain_checkout_total',
      rescueReason: 'checkout_total',
    };
  }
  return null;
}

export function enrichPrepaymentExplainParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  extractServiceName: (value: string) => string | null,
): Record<string, unknown> {
  const serviceName =
    (params.serviceName as string | undefined)?.trim() ||
    extractServiceName(prompt);
  if (!serviceName || isDeicticServiceReference(serviceName)) return params;
  return { ...params, serviceName };
}

export type PrepaymentExplainCopy = {
  summary: string;
  reasons: string[];
  prepaymentMode?: PrepaymentMode;
  amountDueNow?: number;
  balanceAtVisit?: number;
  servicePrice?: number;
};

export function buildServicePrepaymentExplainCopy(
  service: Pick<Service, 'name' | 'price' | 'prepaymentMode' | 'depositAmount'>,
  options: {
    onlineEnabled: boolean;
    acceptCash: boolean;
    directOnlinePaymentQuestion?: boolean;
  },
): PrepaymentExplainCopy {
  const servicePrice = Number(service.price);
  const amountDueNow = resolveServicePrepaymentDueAmount(service);
  const balanceAtVisit = Math.max(0, servicePrice - amountDueNow);
  const policy = describeServicePrepaymentPolicy(service);
  const reasons: string[] = [];

  if (service.prepaymentMode === PrepaymentMode.NONE) {
    reasons.push(
      `${service.name} does not require online prepayment on public booking.`,
    );
    if (options.acceptCash) {
      reasons.push('You can pay at the venue when cash payments are enabled.');
    } else if (options.onlineEnabled) {
      reasons.push(
        'Online card checkout is optional for this service when prepayment is off.',
      );
    }
    const summary = reasons.join(' ');
    return {
      summary: options.directOnlinePaymentQuestion
        ? `No — ${summary}`
        : summary,
      reasons,
      prepaymentMode: PrepaymentMode.NONE,
      amountDueNow: 0,
      balanceAtVisit: servicePrice,
      servicePrice,
    };
  }

  if (service.prepaymentMode === PrepaymentMode.FULL) {
    reasons.push(
      `${service.name} requires full prepayment ($${servicePrice.toFixed(2)}) online to confirm the booking.`,
    );
    reasons.push('Stripe checkout secures the card payment before your visit.');
    const summary = reasons.join(' ');
    return {
      summary: options.directOnlinePaymentQuestion
        ? `Yes — ${summary}`
        : summary,
      reasons,
      prepaymentMode: PrepaymentMode.FULL,
      amountDueNow: servicePrice,
      balanceAtVisit: 0,
      servicePrice,
    };
  }

  reasons.push(
    `${service.name} requires ${policy} — $${amountDueNow.toFixed(2)} due now via Stripe checkout.`,
  );
  if (balanceAtVisit > 0) {
    reasons.push(
      `The remaining $${balanceAtVisit.toFixed(2)} is due at your visit${options.acceptCash ? ' (cash or card at venue when allowed)' : ''}.`,
    );
  }
  reasons.push(
    'Prepayment holds your slot and reduces no-shows — the salon configured this policy per service.',
  );

  const summary = reasons.join(' ');
  return {
    summary: options.directOnlinePaymentQuestion ? `Yes — ${summary}` : summary,
    reasons,
    prepaymentMode: PrepaymentMode.DEPOSIT,
    amountDueNow,
    balanceAtVisit,
    servicePrice,
  };
}

export function buildBusinessPrepaymentExplainCopy(options: {
  onlineEnabled: boolean;
  acceptCash: boolean;
}): PrepaymentExplainCopy {
  const reasons: string[] = [];
  if (!options.onlineEnabled) {
    reasons.push(
      'Online prepayment is not enabled — connect Stripe in billing settings to accept card checkout.',
    );
    return { summary: reasons.join(' '), reasons };
  }
  if (!options.acceptCash) {
    reasons.push(
      'This salon accepts online card payments only — Stripe checkout is required when a service has prepayment enabled.',
    );
  } else {
    reasons.push(
      'When a service requires prepayment, Stripe checkout collects the deposit or full amount due now.',
    );
    reasons.push(
      'Services without prepayment can still be paid cash at the venue when that option is enabled.',
    );
  }
  reasons.push(
    'Ask about a specific service (e.g. "why prepayment for massage?") to see its deposit vs pay-at-visit split.',
  );
  return { summary: reasons.join(' '), reasons };
}
