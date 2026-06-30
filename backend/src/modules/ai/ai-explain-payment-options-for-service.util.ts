import {
  enrichPrepaymentParamsFromCatalogContext,
  hasPrepaymentServiceIdentity,
  isDeicticServiceReference,
  isDoIPayOnlineForServicePrompt,
  referencesCatalogServiceContext,
  isExplainAmountDueNowPrompt,
  isExplainWhyPrepaymentPrompt,
} from './ai-explain-prepayment.util.js';
import {
  extractServiceNameFromPrompt,
  isExplainCheckoutTotalPrompt,
} from './ai-payments.util.js';

export const CUSTOMER_PUBLIC_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CLASSIFIER_RULES = `- explain_payment_options_for_service: READ — explain whether a named catalog service accepts pay-online (card/Stripe) and/or pay-cash-at-venue based on prepaymentMode and acceptCashPayments. Triggers: do I pay online for color, can I pay cash for massage, is card payment required for facial, must I pay online for the selected service. Set serviceName when the user names a service; on public booking use session serviceId/serviceName for "this service" / "what I picked". Summarizes available methods (online card, cash at visit) and deposit vs balance rules. NOT explain_why_stripe_required (why policy — use when user asks why), NOT choose_payment_method (mutate checkout selection), NOT pay_cash_at_visit|pay_online (explicit checkout selection), NOT explain_checkout_total (amount math), NOT explain_service_price (listed card price), and NOT explain_public_booking_checkout (holistic checkout flow).`;

export type ExplainPaymentOptionsForServicePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_payment_options_for_service';
  serviceName?: string;
  rescueReason: 'service_payment_options';
};

export const EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_PROMPTS: readonly ExplainPaymentOptionsForServicePromptFixture[] =
  [
    {
      id: 'pay-online-for-color-customer',
      prompt: 'Do I pay online for color?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'color',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'can-pay-cash-massage-customer',
      prompt: 'Can I pay cash for massage?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'massage',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-manicure-customer',
      prompt: 'Do I need to pay online for manicure?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'manicure',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'can-pay-cash-haircut-customer',
      prompt: 'Can I pay cash for a haircut?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'haircut',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'must-pay-online-facial-customer',
      prompt: 'Must I pay online for facial?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'facial',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'card-required-color-customer',
      prompt: 'Is card payment required for color?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'color',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-blowdry-customer',
      prompt: 'Do I have to pay online for blowdry?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'blowdry',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'can-pay-online-massage-customer',
      prompt: 'Can I pay online for massage?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'massage',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'cash-for-trim-customer',
      prompt: 'Can I pay in cash for a trim?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'trim',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'online-required-waxing-customer',
      prompt: 'Is online payment required for waxing?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'waxing',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-by-card-spa-customer',
      prompt: 'Do I pay by card for spa day package service?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'spa day package service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'cash-for-swedish-customer',
      prompt: 'Can I pay cash for Swedish massage?',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'Swedish massage',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-for-color-public',
      prompt: 'Do I pay online for color?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'color',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'can-pay-cash-massage-public',
      prompt: 'Can I pay cash for massage?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'massage',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-manicure-public',
      prompt: 'Do I need to pay online for manicure?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'manicure',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'can-pay-cash-haircut-public',
      prompt: 'Can I pay cash for a haircut?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'haircut',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'must-pay-online-facial-public',
      prompt: 'Must I pay online for facial?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'facial',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'card-required-color-public',
      prompt: 'Is card payment required for color?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'color',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-blowdry-public',
      prompt: 'Do I have to pay online for blowdry?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'blowdry',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'can-pay-online-massage-public',
      prompt: 'Can I pay online for massage?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'massage',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'cash-for-trim-public',
      prompt: 'Can I pay in cash for a trim?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'trim',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'online-required-waxing-public',
      prompt: 'Is online payment required for waxing?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'waxing',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-by-card-spa-public',
      prompt: 'Do I pay by card for spa day package service?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'spa day package service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'cash-for-swedish-public',
      prompt: 'Can I pay cash for Swedish massage?',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      serviceName: 'Swedish massage',
      rescueReason: 'service_payment_options',
    },
  ];

function cleanExtractedServiceName(value: string): string {
  return value
    .trim()
    .replace(/^(?:a|an|the)\s+/i, '')
    .replace(/[?.!]+$/, '');
}

export function extractServiceNameForPaymentOptionsPrompt(
  prompt: string,
): string | null {
  const payOnlineFor = prompt.match(
    /\bdo\s+i\s+(?:need\s+to\s+)?pay\s+(?:online|by\s+card)\s+for\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)(?:\s*\?|$)/i,
  );
  if (payOnlineFor) {
    const name = cleanExtractedServiceName(payOnlineFor[1]!);
    if (name) return name;
  }

  const mustPayOnlineFor = prompt.match(
    /\bmust\s+i\s+pay\s+online\s+for\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)(?:\s*\?|$)/i,
  );
  if (mustPayOnlineFor) {
    const name = cleanExtractedServiceName(mustPayOnlineFor[1]!);
    if (name) return name;
  }

  const haveToPayFor = prompt.match(
    /\bdo\s+i\s+have\s+to\s+pay\s+(?:online|by\s+card)\s+for\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)(?:\s*\?|$)/i,
  );
  if (haveToPayFor) {
    const name = cleanExtractedServiceName(haveToPayFor[1]!);
    if (name) return name;
  }

  const cashFor = prompt.match(
    /\bcan\s+i\s+pay\s+(?:in\s+)?cash\s+for\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)(?:\s*\?|$)/i,
  );
  if (cashFor) {
    const name = cleanExtractedServiceName(cashFor[1]!);
    if (name) return name;
  }

  const payOnlineCan = prompt.match(
    /\bcan\s+i\s+pay\s+(?:online|by\s+card)\s+for\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)(?:\s*\?|$)/i,
  );
  if (payOnlineCan) {
    const name = cleanExtractedServiceName(payOnlineCan[1]!);
    if (name) return name;
  }

  const requiredFor = prompt.match(
    /\b(?:is|are)\s+(?:online\s+payment|card\s+payment)\s+required\s+for\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)(?:\s*\?|$)/i,
  );
  if (requiredFor) {
    const name = cleanExtractedServiceName(requiredFor[1]!);
    if (name) return name;
  }

  const cardRequiredFor = prompt.match(
    /\bis\s+card\s+payment\s+required\s+for\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)(?:\s*\?|$)/i,
  );
  if (cardRequiredFor) {
    const name = cleanExtractedServiceName(cardRequiredFor[1]!);
    if (name) return name;
  }

  return extractServiceNameFromPrompt(prompt);
}

function isExplicitCashSelectionPrompt(prompt: string): boolean {
  if (/\b(can|could|may|do|must|is|are)\s+i\s+pay\b/i.test(prompt)) {
    return false;
  }
  return (
    /\b(i(?:'ll|\s+will)|pay\s+cash\s+at\s+visit|book\s+with\s+cash)\b/i.test(
      prompt,
    ) ||
    /\b(pay\s+in\s+cash|cash\s+at\s+(?:the\s+)?visit|pay\s+at\s+(?:the\s+)?venue)\b/i.test(
      prompt,
    )
  );
}

function isCheckoutWidePaymentOptionsPrompt(prompt: string): boolean {
  return (
    /\b(at\s+checkout|for\s+this\s+booking|payment\s+methods?\s+available|which\s+payment\s+method|what\s+payment\s+options?)\b/i.test(
      prompt,
    ) && !hasNamedServicePaymentOptionsPrompt(prompt)
  );
}

export function hasNamedServicePaymentOptionsPrompt(prompt: string): boolean {
  return (
    Boolean(extractServiceNameForPaymentOptionsPrompt(prompt)) ||
    referencesCatalogServiceContext(prompt) ||
    isDoIPayOnlineForServicePrompt(prompt)
  );
}

export function isExplainPaymentOptionsForServicePrompt(prompt: string): boolean {
  if (/\bwhy\b/i.test(prompt)) return false;
  if (isExplainAmountDueNowPrompt(prompt)) return false;
  if (isExplainCheckoutTotalPrompt(prompt)) return false;
  if (isExplainWhyPrepaymentPrompt(prompt)) return false;
  if (isExplicitCashSelectionPrompt(prompt)) return false;
  if (/\b(choose|select)\s+(?:payment|cash|card)\b/i.test(prompt)) return false;

  if (isCheckoutWidePaymentOptionsPrompt(prompt)) return false;

  if (
    /վճարե՞մ\s+առցանց/i.test(prompt) ||
    /կարո՞ղ\s+եմ.*կանխիկ/i.test(prompt) ||
    /պետք\s+ա.*առցանց/i.test(prompt) ||
    /պետք\s+է.*առցանց/i.test(prompt) ||
    (/այս\s+ծառայության/i.test(prompt) &&
      /առցանց|վճար/i.test(prompt))
  ) {
    return true;
  }
  if (
    /плачу\s+ли\s+онлайн/i.test(prompt) ||
    /могу\s+ли\s+я.*наличными/i.test(prompt) ||
    /нужно\s+ли\s+платить\s+онлайн/i.test(prompt) ||
    (/эту\s+услугу/i.test(prompt) && /онлайн|наличн/i.test(prompt))
  ) {
    return true;
  }

  if (isDoIPayOnlineForServicePrompt(prompt)) return true;

  if (
    /\b(can|could|may)\s+i\s+pay\s+(?:in\s+)?cash\b/i.test(prompt) &&
    /\bfor\s+(?:a|an|the\s+)?[a-z]/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(can|could|may)\s+i\s+pay\s+(?:online|by\s+card)\b/i.test(prompt) &&
    /\bfor\s+/i.test(prompt)
  ) {
    return true;
  }

  if (/\bdo\s+i\s+pay\s+(?:online|by\s+card)\s+for\b/i.test(prompt)) {
    return true;
  }

  if (
    /\b(is|are)\s+.+\s+(?:online\s+payment|card\s+payment)\s+required\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  return false;
}

export function needsPaymentOptionsServiceClarify(
  prompt: string,
  params: Record<string, unknown>,
): boolean {
  if (
    !referencesCatalogServiceContext(prompt) &&
    !isDoIPayOnlineForServicePrompt(prompt)
  ) {
    if (extractServiceNameForPaymentOptionsPrompt(prompt)) return false;
    return false;
  }
  return !hasPrepaymentServiceIdentity(params);
}

export function enrichExplainPaymentOptionsParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const serviceName =
    (params.serviceName as string | undefined)?.trim() ||
    extractServiceNameForPaymentOptionsPrompt(prompt);
  if (!serviceName || isDeicticServiceReference(serviceName)) return params;
  return { ...params, serviceName };
}

export function enrichPaymentOptionsParamsFromCatalogContext(
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
    isDoIPayOnlineForServicePrompt(prompt) ||
    isExplainPaymentOptionsForServicePrompt(prompt)
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

export function rescueExplainPaymentOptionsForServiceIntent(
  prompt: string,
  action: string,
): { action: 'explain_payment_options_for_service'; rescueReason: string } | null {
  if (action === 'explain_payment_options_for_service') return null;
  if (!isExplainPaymentOptionsForServicePrompt(prompt)) return null;
  return {
    action: 'explain_payment_options_for_service',
    rescueReason: 'service_payment_options',
  };
}

export function detectExplainPaymentOptionsForServiceAction(
  prompt: string,
): 'explain_payment_options_for_service' | null {
  return (
    rescueExplainPaymentOptionsForServiceIntent(prompt, 'unknown')?.action ??
    null
  );
}
