/** Dashboard read intent (ai-cmd-ext-2.32). */
export const AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT =
  'audit_services_missing_online_payment' as const;

export const SERVICES_MISSING_ONLINE_PAYMENT_READ_INTENTS = [
  AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
] as const;

export type ServicesMissingOnlinePaymentReadIntent =
  (typeof SERVICES_MISSING_ONLINE_PAYMENT_READ_INTENTS)[number];

export function isServicesMissingOnlinePaymentReadIntent(
  action: string,
): action is ServicesMissingOnlinePaymentReadIntent {
  return (
    SERVICES_MISSING_ONLINE_PAYMENT_READ_INTENTS as readonly string[]
  ).includes(action);
}

export const AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_CLASSIFIER_RULES = `- audit_services_missing_online_payment: READ — gap audit listing active catalog services that do NOT accept online payment on public booking (prepaymentMode none). Optional categoryName filter. Triggers: audit/find/list/show/which/what/are any + services + missing|without|don't accept|still don't|no online payment|cash-only. NOT explain_service_online_payment_setup (full prepayment summary or which services require prepayment), NOT configure_service_online_payment (mutate toggle), NOT list_services (catalog browse without payment gap), NOT explain_public_booking_checkout (checkout flow), and NOT configure_package_online_payment (mutate).
- Examples:
  - "Which services still don't accept online payment?" → audit_services_missing_online_payment
  - "Audit services missing online payment" → audit_services_missing_online_payment
  - "Find services without online payment on public booking" → audit_services_missing_online_payment
  - "Which massage services don't accept online payment?" → audit_services_missing_online_payment, categoryName=massage`;

export type AuditServicesMissingOnlinePaymentFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_PROMPTS: AuditServicesMissingOnlinePaymentFixture[] =
  [
    {
      id: 'which-still-dont-accept',
      prompt: "Which services still don't accept online payment?",
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    },
    {
      id: 'audit-missing',
      prompt: 'Audit services missing online payment',
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    },
    {
      id: 'find-without-public-booking',
      prompt: 'Find services without online payment on public booking',
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    },
    {
      id: 'list-no-online-prepayment',
      prompt: 'List services with no online prepayment',
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    },
    {
      id: 'which-missing-gap',
      prompt: 'Which catalog services are missing online payment?',
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    },
    {
      id: 'show-dont-accept',
      prompt: "Show services that don't accept online payment",
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    },
    {
      id: 'gap-audit-public',
      prompt: 'Run a gap audit for online payment on public booking services',
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    },
    {
      id: 'still-cash-only',
      prompt: 'Which services are still cash-only on public booking?',
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    },
    {
      id: 'any-missing',
      prompt: 'Are any services missing online payment?',
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    },
    {
      id: 'do-not-accept-prepayment',
      prompt: 'What services do not accept online prepayment?',
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    },
    {
      id: 'category-massage-missing',
      prompt: "Which massage services don't accept online payment?",
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
      paramsPartial: { categoryName: 'massage' },
    },
    {
      id: 'without-online-payment-setup',
      prompt: 'Which services are without online payment setup?',
      surface: 'dashboard',
      expectedAction: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    },
  ];

function hasAuditReadCue(prompt: string): boolean {
  return (
    /\b(audit|find|list|show|which|what|are|run)\b/i.test(prompt) ||
    /(?:ցույց\s+տուր|ինչ\s+ծառայություն)/i.test(prompt) ||
    /(?:какие|какой|покажи|найди)/i.test(prompt)
  );
}

function hasOnlinePaymentGapCue(prompt: string): boolean {
  return (
    /\b(?:missing|without|don'?t|do\s+not|no|still|gap|cash[\s-]?only)\b/i.test(
      prompt,
    ) ||
    /\bnot\s+accept\b/i.test(prompt) ||
    /\bare\s+any\b/i.test(prompt)
  );
}

function hasServicesOnlinePaymentGapSurface(prompt: string): boolean {
  return (
    (/\bservices?\b/i.test(prompt) &&
      /\b(?:online\s+payment|online\s+prepayment|prepayment)\b/i.test(
        prompt,
      )) ||
    (/\bservices?\b/i.test(prompt) && /\bcash[\s-]?only\b/i.test(prompt)) ||
    (/\baudit\b/i.test(prompt) && /\bonline\s+payment\b/i.test(prompt)) ||
    (/\bgap\s+audit\b/i.test(prompt) && /\bonline\s+payment\b/i.test(prompt))
  );
}

function extractAuditCategoryFilter(prompt: string): string | undefined {
  const patterns = [
    /\bwhich\s+([a-z][\w&'-]+)\s+services?\b/i,
    /\bfor\s+([a-z][\w&'-]+)\s+services?\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1] && match[1].toLowerCase() !== 'catalog') {
      return match[1].trim();
    }
  }
  return undefined;
}

export type ParsedAuditServicesMissingOnlinePayment = {
  categoryName?: string;
};

export function isAuditServicesMissingOnlinePaymentPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (!text) return false;

  if (
    /\bwhat\b.{0,30}\bcan\s+(?:i|we)\s+book\b/i.test(text) ||
    /\bbook\b.{0,30}\bwithout\b/i.test(text)
  ) {
    return false;
  }

  if (
    /\b(accept|enable|decline|disable|turn\s+on|turn\s+off|configure|require|set\s+up)\b/i.test(
      text,
    ) &&
    !/\b(audit|find|list|show|which|what|are|missing|without|don'?t|still)\b/i.test(
      text,
    )
  ) {
    return false;
  }

  if (!hasAuditReadCue(text)) return false;
  if (!hasServicesOnlinePaymentGapSurface(text)) return false;
  if (!hasOnlinePaymentGapCue(text) && !/\baudit\b/i.test(text)) return false;

  if (
    /\b(?:require|requiring|accept|accepting|with|have)\b/i.test(text) &&
    /\b(?:online\s+payment|online\s+prepayment|prepayment)\b/i.test(text) &&
    !hasOnlinePaymentGapCue(text)
  ) {
    return false;
  }

  if (
    /\b(?:require|requiring)\b/i.test(text) &&
    /\bprepayment\b/i.test(text) &&
    !/\b(?:don'?t|do\s+not|without|missing|still)\b/i.test(text)
  ) {
    return false;
  }

  if (
    /\bstripe\s+connect\b/i.test(text) ||
    /\bcash\b.{0,40}\b(?:allowed|still)\b/i.test(text)
  ) {
    return false;
  }

  if (
    /\b(?:accept|enable|configure|turn\s+on|set\s+up)\b/i.test(text) &&
    /\b(?:online\s+payment|online\s+prepayment)\b/i.test(text) &&
    !hasOnlinePaymentGapCue(text) &&
    !/\baudit\b/i.test(text)
  ) {
    return false;
  }

  return true;
}

export function parseAuditServicesMissingOnlinePaymentFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedAuditServicesMissingOnlinePayment | null {
  if (!isAuditServicesMissingOnlinePaymentPrompt(prompt)) return null;

  const categoryName =
    (typeof params.categoryName === 'string' && params.categoryName.trim()) ||
    extractAuditCategoryFilter(prompt);

  return { categoryName: categoryName || undefined };
}

/** NL rescue when classifier mislabels online payment gap audit prompts. */
export function rescueAuditServicesMissingOnlinePaymentIntent(
  prompt: string,
  action: string,
): {
  action: ServicesMissingOnlinePaymentReadIntent;
  rescueReason: string;
} | null {
  if (isServicesMissingOnlinePaymentReadIntent(action)) return null;
  if (!isAuditServicesMissingOnlinePaymentPrompt(prompt)) return null;
  return {
    action: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
    rescueReason: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
  };
}
