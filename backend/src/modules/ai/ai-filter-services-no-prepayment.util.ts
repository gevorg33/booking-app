import { isDoIPayOnlineForServicePrompt } from './ai-explain-prepayment.util.js';

export const CUSTOMER_PUBLIC_FILTER_SERVICES_NO_PREPAYMENT_CLASSIFIER_RULES = `- filter_services_no_prepayment: READ — list catalog services the visitor can book without paying online (prepaymentMode=none / cash-at-visit only). Triggers: "What can I book without paying online?", "Show services with no online prepayment", "Which services don't require prepayment?". Optional serviceCategory when they narrow by type. Navigate to services. NOT list_services (general catalog browse, budget, rank/tier, or deposit/full prepayment filters); NOT explain_payment_options_for_service (one named service); NOT explain_why_stripe_required (policy why); NOT audit_services_missing_online_payment (dashboard gap audit); and NOT configure_service_online_payment (mutate).`;

export type FilterServicesNoPrepaymentPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'filter_services_no_prepayment';
  serviceCategory?: string;
  rescueReason: 'no_prepayment_services';
};

export const FILTER_SERVICES_NO_PREPAYMENT_PROMPTS: readonly FilterServicesNoPrepaymentPromptFixture[] =
  [
    {
      id: 'book-without-paying-online-customer',
      prompt: 'What can I book without paying online?',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'services-no-online-prepayment-customer',
      prompt: 'What services can I book without online prepayment?',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'show-without-paying-online-customer',
      prompt: 'Show services I can book without paying online',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'which-no-prepayment-customer',
      prompt: "Which services don't require online prepayment?",
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'list-no-online-payment-customer',
      prompt: 'List services with no online payment required',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'cash-at-visit-only-customer',
      prompt: 'What can I book and just pay at the salon?',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'massage-without-prepayment-customer',
      prompt: 'What massage services can I book without paying online?',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      serviceCategory: 'massage',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'haircut-no-deposit-customer',
      prompt: 'Show haircut options without online prepayment',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      serviceCategory: 'haircut',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'book-cash-only-customer',
      prompt: 'Which services are cash-only to book?',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'no-card-upfront-customer',
      prompt: 'What services do not need a card upfront?',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'without-paying-now-customer',
      prompt: 'What can I book without paying now?',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'services-pay-at-venue-customer',
      prompt: 'Show services I can pay for at the venue only',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'book-without-paying-online-public',
      prompt: 'What can I book without paying online?',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'services-no-online-prepayment-public',
      prompt: 'What services can I book without online prepayment?',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'show-without-paying-online-public',
      prompt: 'Show services I can book without paying online',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'which-no-prepayment-public',
      prompt: "Which services don't require online prepayment?",
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'list-no-online-payment-public',
      prompt: 'List services with no online payment required',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'cash-at-visit-only-public',
      prompt: 'What can I book and just pay at the salon?',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'massage-without-prepayment-public',
      prompt: 'What massage services can I book without paying online?',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      serviceCategory: 'massage',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'haircut-no-deposit-public',
      prompt: 'Show haircut options without online prepayment',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      serviceCategory: 'haircut',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'book-cash-only-public',
      prompt: 'Which services are cash-only to book?',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'no-card-upfront-public',
      prompt: 'What services do not need a card upfront?',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'without-paying-now-public',
      prompt: 'What can I book without paying now?',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'services-pay-at-venue-public',
      prompt: 'Show services I can pay for at the venue only',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
  ];

function hasNoPrepaymentPolicyCue(prompt: string): boolean {
  return (
    /\bwithout\s+paying\s+online\b/i.test(prompt) ||
    /\bwithout\s+paying\s+now\b/i.test(prompt) ||
    /\b(?:no|without)\s+online\s+prepayment\b/i.test(prompt) ||
    /\b(?:no|without)\s+online\s+payment\b/i.test(prompt) ||
    /\bdon'?t\s+require\s+(?:online\s+)?prepayment\b/i.test(prompt) ||
    /\bdo\s+not\s+need\s+(?:a\s+)?card\s+upfront\b/i.test(prompt) ||
    /\bcash[\s-]?only\b/i.test(prompt) ||
    /\bpay\s+at\s+(?:the\s+)?(?:salon|venue)\b/i.test(prompt) ||
    /\bpay\s+for\s+at\s+the\s+venue\s+only\b/i.test(prompt) ||
    /(?:առանց|օնլայն|նախավճար)/iu.test(prompt) ||
    /(?:без\s+оплаты\s+онлайн|без\s+предоплаты|наличными)/iu.test(prompt)
  );
}

function hasCatalogBrowseCue(prompt: string): boolean {
  return (
    /\b(?:what\s+(?:can|could)\s+i\s+book|what\s+services?\b|what\s+services?\s+can\s+i\s+book|show\s+services?|show\b.{0,24}\boptions?|list\s+services?|which\s+services?|options)\b/i.test(
      prompt,
    ) ||
    /\bbook\b.{0,30}\bwithout\b/i.test(prompt) ||
    /(?:ինչ\s+կարող\s+եմ|ցույց\s+տուր)/iu.test(prompt) ||
    /(?:что\s+можно\s+забронировать|покажи\s+услуги)/iu.test(prompt)
  );
}

function isDashboardPaymentGapAuditPrompt(prompt: string): boolean {
  return (
    /\b(?:audit|missing|still\s+don'?t|don'?t\s+accept|gap\s+audit)\b/i.test(
      prompt,
    ) && /\bservices?\b/i.test(prompt)
  );
}

function isSingleServicePaymentOptionsPrompt(prompt: string): boolean {
  return (
    isDoIPayOnlineForServicePrompt(prompt) ||
    (/\b(?:can i|do i|must i|should i|do i need to|do i have to)\s+(?:pay|need to pay)\b/i.test(
      prompt,
    ) &&
      /\bfor\s+(?:a\s+)?[\w'-]+/i.test(prompt) &&
      !/\bwhat\s+(?:can|services)\b/i.test(prompt)) ||
    (/\b(?:can|could|may)\s+i\s+pay\s+(?:in\s+)?cash\b/i.test(prompt) &&
      /\bfor\s+(?:a|an|the\s+)?[a-z]/i.test(prompt)) ||
    (/\bdo\s+i\s+pay\s+(?:online|by\s+card)\s+for\b/i.test(prompt))
  );
}

export function extractNoPrepaymentServiceCategoryFromPrompt(
  prompt: string,
): string | null {
  const patterns: ReadonlyArray<RegExp> = [
    /\bwhat\s+(\w+)\s+services?\b/i,
    /\bshow\s+(\w+)\s+options?\b/i,
    /\b(?:for|about)\s+(\w+)\s+services?\b/i,
    /(?:ինչ\s+)(\w+)(?:\s+ծառայություն)/iu,
    /(?:услуги?\s+)(\w+)/iu,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const captured = match?.[1]?.trim().toLowerCase();
    if (!captured) continue;
    if (
      /^(what|which|show|list|can|book|without|online|paying|services?|options?)$/i.test(
        captured,
      )
    ) {
      continue;
    }
    return captured;
  }
  return null;
}

export function isFilterServicesNoPrepaymentPrompt(prompt: string): boolean {
  if (!hasNoPrepaymentPolicyCue(prompt) || !hasCatalogBrowseCue(prompt)) {
    return false;
  }
  if (isSingleServicePaymentOptionsPrompt(prompt)) return false;
  if (isDashboardPaymentGapAuditPrompt(prompt)) return false;
  if (
    /\b(?:configure|enable|disable|turn\s+on|turn\s+off|decline|accept)\b/i.test(
      prompt,
    ) &&
    !/\b(?:list|show|what)\s+services?\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:deposit|full)\s+prepayment\b/i.test(prompt) &&
    !/\b(?:no|without)\b/i.test(prompt)
  ) {
    return false;
  }
  return true;
}

export function enrichFilterServicesNoPrepaymentParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const serviceCategory =
    (params.serviceCategory as string | undefined) ??
    extractNoPrepaymentServiceCategoryFromPrompt(prompt) ??
    undefined;
  return {
    ...params,
    prepaymentMode: 'none',
    onlinePaymentEnabled: false,
    ...(serviceCategory ? { serviceCategory } : {}),
  };
}

export function rescueFilterServicesNoPrepaymentIntent(
  prompt: string,
  action: string,
): {
  action: 'filter_services_no_prepayment';
  rescueReason: string;
} | null {
  if (action === 'filter_services_no_prepayment') return null;
  if (!isFilterServicesNoPrepaymentPrompt(prompt)) return null;
  return {
    action: 'filter_services_no_prepayment',
    rescueReason: 'no_prepayment_services',
  };
}

export function detectFilterServicesNoPrepaymentAction(
  prompt: string,
): 'filter_services_no_prepayment' | null {
  return (
    rescueFilterServicesNoPrepaymentIntent(prompt, 'unknown')?.action ?? null
  );
}
