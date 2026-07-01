import {
  PrepaymentMode,
  type Service,
} from '../service/entities/service.entity.js';
import { isListServicesPaymentFilterPrompt } from './ai-list-services-payment-filters.util.js';
import {
  isDoIPayOnlineForServicePrompt,
  referencesCatalogServiceContext,
} from './ai-explain-prepayment.util.js';

/** Dashboard read intent (ai-cmd-ext-2.13.5). */
export const EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT =
  'explain_service_online_payment_setup' as const;

export const SERVICE_ONLINE_PAYMENT_SETUP_READ_INTENTS = [
  EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
] as const;

export type ServiceOnlinePaymentSetupReadIntent =
  (typeof SERVICE_ONLINE_PAYMENT_SETUP_READ_INTENTS)[number];

export function isServiceOnlinePaymentSetupReadIntent(
  action: string,
): action is ServiceOnlinePaymentSetupReadIntent {
  return (
    SERVICE_ONLINE_PAYMENT_SETUP_READ_INTENTS as readonly string[]
  ).includes(action);
}

export const SERVICE_ONLINE_PAYMENT_SETUP_CLASSIFIER_RULES = `- explain_service_online_payment_setup: READ — summarize per-service online payment on public booking (prepaymentMode none|full|deposit), Stripe Connect status, and whether cash at venue is still allowed. Triggers: explain/show/describe/what/which/summarize + online payment setup|prepayment mode|Stripe Connect|which services require prepayment|cash still allowed. Optional serviceName or categoryName filter. NOT configure_service_online_payment (mutate toggle), NOT explain_public_booking_checkout (holistic checkout cash/online/gift-card flow), NOT list_services (catalog browse without payment context), NOT explain_why_stripe_required (customer checkout), NOT audit_services_missing_online_payment (gap audit only), and NOT configure_cash_payments (mutate).
- Examples:
  - "Explain service online payment setup" → explain_service_online_payment_setup
  - "Which services require prepayment on public booking?" → explain_service_online_payment_setup
  - "Is Stripe Connect ready?" → explain_service_online_payment_setup
  - "Is cash still allowed on public booking?" → explain_service_online_payment_setup
  - "Describe online payment setup for Massage service" → explain_service_online_payment_setup, serviceName=Massage`;

export type ExplainServiceOnlinePaymentSetupFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_PROMPTS: ExplainServiceOnlinePaymentSetupFixture[] =
  [
    {
      id: 'explain-setup',
      prompt: 'Explain service online payment setup',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
    },
    {
      id: 'which-require-prepayment',
      prompt: 'Which services require prepayment on public booking?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
    },
    {
      id: 'show-settings-all',
      prompt: 'Show online payment and prepayment settings for our services',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
    },
    {
      id: 'stripe-connect-ready',
      prompt: 'Is Stripe Connect ready for online payments?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
    },
    {
      id: 'which-accept-online',
      prompt: 'Which services accept online payment on public booking?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
    },
    {
      id: 'category-prepayment-mode',
      prompt: 'Describe prepayment mode for massage services',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
      paramsPartial: { categoryName: 'massage' },
    },
    {
      id: 'stripe-connect-status',
      prompt: 'What is our Stripe Connect status?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
    },
    {
      id: 'cash-still-allowed',
      prompt: 'Is cash still allowed on public booking?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
    },
    {
      id: 'summarize-all-services',
      prompt: 'Summarize online payment setup for all services',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
    },
    {
      id: 'full-vs-deposit',
      prompt: 'Which services have full prepayment vs deposit?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
    },
    {
      id: 'single-service-setup',
      prompt: 'Explain online payment setup for Haircut service',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
      paramsPartial: { serviceName: 'Haircut' },
    },
    {
      id: 'catalog-prepayment-modes',
      prompt: 'What prepayment modes are configured on our catalog?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
    },
  ];

function hasExplainReadCue(prompt: string): boolean {
  return (
    /\b(explain|show|describe|what|which|how|summarize|overview|status)\b/i.test(
      prompt,
    ) ||
    /\b(is|are)\b/i.test(prompt) ||
    /(?:բացատրիր|ցույց\s+տուր)/i.test(prompt) ||
    /(?:объясни|покажи|опиши|какие|какой)/i.test(prompt)
  );
}

function hasOnlinePaymentSetupSurface(prompt: string): boolean {
  return (
    /\bonline\s+payment\s+setup\b/i.test(prompt) ||
    /\bservice\s+online\s+payment\b/i.test(prompt) ||
    /\bprepayment\s+mode\b/i.test(prompt) ||
    /\bprepayment\s+modes\b/i.test(prompt) ||
    /\bstripe\s+connect\b/i.test(prompt) ||
    /\b(?:public\s+booking|booking\s+page).{0,50}\bonline\s+payment\b/i.test(
      prompt,
    ) ||
    /\bonline\s+payment.{0,50}\b(?:public\s+booking|services?|catalog)\b/i.test(
      prompt,
    ) ||
    /\b(?:which|what)\s+services?\b.{0,70}\b(?:prepayment|online\s+payment|stripe|deposit)\b/i.test(
      prompt,
    ) ||
    /\b(?:which|what)\s+services?\b.{0,70}\b(?:full|deposit)\b/i.test(prompt) ||
    /\b(?:require|requiring|accept(?:ing)?|have)\b.{0,50}\b(?:prepayment|online\s+payment)\b/i.test(
      prompt,
    ) ||
    /\bcash\b.{0,40}\b(?:allowed|enabled|accept|still|venue|public\s+booking)\b/i.test(
      prompt,
    ) ||
    /\b(?:still|also)\s+allow\s+cash\b/i.test(prompt) ||
    /\bprepayment\b.{0,30}\b(?:settings?|setup|configured)\b/i.test(prompt)
  );
}

function extractExplainServiceFilter(prompt: string): string | undefined {
  const patterns = [
    /\bonline\s+payment\s+setup\s+for\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
    /\bfor\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function extractExplainCategoryFilter(prompt: string): string | undefined {
  const patterns = [
    /\bfor\s+(?:the\s+)?([a-z][\w&'-]+)\s+services\b/i,
    /\bprepayment\s+mode\s+for\s+(?:the\s+)?([a-z][\w&'-]+)\s+services\b/i,
    /\bdescribe\s+prepayment\s+mode\s+for\s+(?:the\s+)?([a-z][\w&'-]+)\s+services\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1] && match[1].toLowerCase() !== 'some') {
      return match[1].trim();
    }
  }
  return undefined;
}

export type ParsedExplainServiceOnlinePaymentSetup = {
  serviceName?: string;
  categoryName?: string;
};

export function isExplainServiceOnlinePaymentSetupPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (!text) return false;

  if (
    isDoIPayOnlineForServicePrompt(text) ||
    referencesCatalogServiceContext(text)
  ) {
    return false;
  }

  if (isListServicesPaymentFilterPrompt(text)) return false;

  if (
    /\blist\s+services?\b/i.test(text) &&
    !/\b(?:online\s+payment|prepayment|stripe|connect|deposit)\b/i.test(text)
  ) {
    return false;
  }

  if (!hasExplainReadCue(text)) return false;
  if (!hasOnlinePaymentSetupSurface(text)) return false;

  if (
    /\b(?:don'?t|do\s+not|without|missing|gap|still|cash[\s-]?only)\b/i.test(
      text,
    ) &&
    /\bservices?\b/i.test(text) &&
    /\bonline\s+payment\b/i.test(text)
  ) {
    return false;
  }
  if (/\baudit\b/i.test(text) && /\bonline\s+payment\b/i.test(text)) {
    return false;
  }

  if (
    /\b(accept|enable|decline(?:\s+to)?|disable|turn\s+(?:on|off)|require|configure|set\s+up|stop|reject|refuse)\b/i.test(
      text,
    ) &&
    !/\b(explain|show|describe|what|which|summarize|status|is|are)\b/i.test(
      text,
    )
  ) {
    return false;
  }

  return true;
}

export function parseExplainServiceOnlinePaymentSetupFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainServiceOnlinePaymentSetup | null {
  if (!isExplainServiceOnlinePaymentSetupPrompt(prompt)) return null;

  const serviceName =
    (typeof params.serviceName === 'string' && params.serviceName.trim()) ||
    extractExplainServiceFilter(prompt);
  const categoryName =
    (typeof params.categoryName === 'string' && params.categoryName.trim()) ||
    extractExplainCategoryFilter(prompt);

  return {
    serviceName: serviceName || undefined,
    categoryName: categoryName || undefined,
  };
}

export function formatServicePrepaymentLabel(
  service: Pick<Service, 'name' | 'prepaymentMode' | 'depositAmount'>,
): string {
  switch (service.prepaymentMode) {
    case PrepaymentMode.FULL:
      return `${service.name}: full prepayment`;
    case PrepaymentMode.DEPOSIT:
      if (service.depositAmount != null && Number(service.depositAmount) > 0) {
        return `${service.name}: $${Number(service.depositAmount).toFixed(0)} deposit`;
      }
      return `${service.name}: 50% deposit (default checkout deposit)`;
    default:
      return `${service.name}: online payment off`;
  }
}

export function filterServicesForOnlinePaymentSetupExplain<
  T extends {
    id: string;
    name: string;
    isActive?: boolean;
    category?: { name: string } | null;
  },
>(catalog: T[], parsed: ParsedExplainServiceOnlinePaymentSetup): T[] {
  const active = catalog.filter((service) => service.isActive !== false);

  if (parsed.serviceName) {
    const needle = parsed.serviceName.trim().toLowerCase();
    const matched = active.filter((service) => {
      const name = service.name.toLowerCase();
      return name === needle || name.includes(needle) || needle.includes(name);
    });
    return matched.length ? matched : [];
  }

  if (parsed.categoryName) {
    const hint = parsed.categoryName.toLowerCase();
    const matched = active.filter((service) =>
      service.category?.name?.toLowerCase().includes(hint),
    );
    if (matched.length) return matched;
  }

  return active;
}

/** NL rescue when classifier mislabels service online payment setup explain prompts. */
export function rescueExplainServiceOnlinePaymentSetupIntent(
  prompt: string,
  action: string,
): {
  action: ServiceOnlinePaymentSetupReadIntent;
  rescueReason: string;
} | null {
  if (isServiceOnlinePaymentSetupReadIntent(action)) return null;
  if (!isExplainServiceOnlinePaymentSetupPrompt(prompt)) return null;
  return {
    action: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
    rescueReason: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
  };
}
