import {
  PrepaymentMode,
  type Service,
} from '../service/entities/service.entity.js';
import { resolveServices } from './ai-orchestration.helpers.js';
import { resolveServicesByCategoryHint } from './ai-operations.util.js';
import { isExplainServiceOnlinePaymentSetupPrompt } from './ai-service-online-payment-setup.util.js';

/** Dashboard intent id (ai-cmd-ext-2.13). */
export const SERVICE_ONLINE_PAYMENT_INTENT =
  'configure_service_online_payment' as const;

export type ServiceOnlinePaymentAccessTier = 'M';

export function resolveServiceOnlinePaymentAccessTier(
  action: string,
): ServiceOnlinePaymentAccessTier | null {
  return action === SERVICE_ONLINE_PAYMENT_INTENT ? 'M' : null;
}

export const SERVICE_ONLINE_PAYMENT_CLASSIFIER_RULES = `- configure_service_online_payment: MUTATE — per-service "Accept online payment on public booking" (prepaymentMode none|full|deposit on catalog services). Maps to Services page online payment toggle. Requires Stripe Connect before enabling full/deposit prepayment. NOT explain_service_online_payment_setup (read-only summary of current prepayment modes and Stripe Connect status).
- Scope: allServices=true for "all services/every service"; serviceName for one service; serviceNames[] for "Haircut and Blowdry"; categoryName for "massage services" / "services in Hair category". "Some services" with named list → serviceNames.
- Prepayment: prepaymentMode=full for pay-in-full / 100% prepayment; prepaymentMode=deposit for deposit/partial prepayment; omit depositAmount (null) when prompt says 50% or half (default checkout deposit). depositPercent for other percentages (computed per service price); depositAmount for fixed dollar deposit. prepaymentMode=none to disable/decline online payment.
- Decline/disable verbs: decline, disable, turn off, stop, reject, remove, refuse, "do not accept", "don't accept" → prepaymentMode=none with the same scope params as accept.
- NOT configure_cash_payments (business-wide cash at venue), NOT configure_online_booking (enable/disable public booking page), NOT update_service_prices (price %), NOT update_service (move to category only).
- Examples: "Accept online payment on public booking for all services with 50% prepayment" → allServices=true, prepaymentMode=deposit, depositPercent=50.
- "Require full prepayment on public booking for Massage" → serviceName=Massage, prepaymentMode=full.
- "Decline online payment on public booking for all services" → allServices=true, prepaymentMode=none.
- "Decline online payment on public booking for Haircut and Blowdry" → serviceNames=[Haircut,Blowdry], prepaymentMode=none.
- "Turn off online payment for haircut services" → categoryName=haircut, prepaymentMode=none.`;

export type ServiceOnlinePaymentPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: 'configure_service_online_payment';
  paramsPartial?: Record<string, unknown>;
};

export const SERVICE_ONLINE_PAYMENT_EN_SCENARIO_IDS = [
  'all-services-50-deposit',
  'all-services-full',
  'specific-service-deposit',
  'named-services-deposit',
  'category-services-full',
  'some-services-25',
  'disable-specific',
  'disable-all',
  'fixed-deposit-dollar',
  'stripe-all-half',
  'public-booking-single-full',
  'category-disable',
  'decline-all-services',
  'decline-specific-service',
  'decline-named-services',
  'decline-category-services',
  'decline-some-services',
  'decline-single-service-suffix',
  'decline-every-service',
] as const;

export const SERVICE_ONLINE_PAYMENT_PROMPTS: ServiceOnlinePaymentPromptFixture[] =
  [
    {
      id: 'all-services-50-deposit',
      prompt:
        'Accept online payment on public booking for all services with a prepayment 50%',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: {
        allServices: true,
        prepaymentMode: 'deposit',
        depositPercent: 50,
      },
    },
    {
      id: 'all-services-full',
      prompt:
        'Enable online payment on public booking for all services with full prepayment',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: { allServices: true, prepaymentMode: 'full' },
    },
    {
      id: 'specific-service-deposit',
      prompt:
        'Accept online payment on public booking for Massage with 50% deposit',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: {
        serviceName: 'Massage',
        prepaymentMode: 'deposit',
        depositPercent: 50,
      },
    },
    {
      id: 'named-services-deposit',
      prompt:
        'Require online payment on public booking for Haircut and Blowdry with half prepayment',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: {
        serviceNames: ['Haircut', 'Blowdry'],
        prepaymentMode: 'deposit',
        depositPercent: 50,
      },
    },
    {
      id: 'category-services-full',
      prompt:
        'Accept online payment on public booking for massage services with full prepayment',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: {
        categoryName: 'massage',
        prepaymentMode: 'full',
      },
    },
    {
      id: 'some-services-25',
      prompt:
        'Set up online payment on public booking for some services — Facial and Peel — with 25% prepayment',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: {
        serviceNames: ['Facial', 'Peel'],
        prepaymentMode: 'deposit',
        depositPercent: 25,
      },
    },
    {
      id: 'disable-specific',
      prompt:
        'Disable online payment on public booking for Neck Massage service',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: {
        serviceName: 'Neck Massage',
        prepaymentMode: 'none',
      },
    },
    {
      id: 'disable-all',
      prompt: 'Turn off online payment on public booking for all services',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: { allServices: true, prepaymentMode: 'none' },
    },
    {
      id: 'fixed-deposit-dollar',
      prompt:
        'Accept online payment on public booking for Color service with $20 deposit',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: {
        serviceName: 'Color',
        prepaymentMode: 'deposit',
        depositAmount: 20,
      },
    },
    {
      id: 'stripe-all-half',
      prompt:
        'Require Stripe checkout on public booking for every service with half prepayment',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: {
        allServices: true,
        prepaymentMode: 'deposit',
        depositPercent: 50,
      },
    },
    {
      id: 'public-booking-single-full',
      prompt:
        'Configure public booking to accept online payment for Manicure — pay in full upfront',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: { serviceName: 'Manicure', prepaymentMode: 'full' },
    },
    {
      id: 'category-disable',
      prompt:
        'Stop accepting online payment on public booking for dental services',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: { categoryName: 'dental', prepaymentMode: 'none' },
    },
    {
      id: 'decline-all-services',
      prompt: 'Decline online payment on public booking for all services',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: { allServices: true, prepaymentMode: 'none' },
    },
    {
      id: 'decline-specific-service',
      prompt: 'Decline online payment on public booking for Massage',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: { serviceName: 'Massage', prepaymentMode: 'none' },
    },
    {
      id: 'decline-named-services',
      prompt:
        'Decline online payment on public booking for Haircut and Blowdry',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: {
        serviceNames: ['Haircut', 'Blowdry'],
        prepaymentMode: 'none',
      },
    },
    {
      id: 'decline-category-services',
      prompt: 'Decline online payment on public booking for massage services',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: { categoryName: 'massage', prepaymentMode: 'none' },
    },
    {
      id: 'decline-some-services',
      prompt:
        'Do not accept online payment on public booking for some services — Facial and Peel',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: {
        serviceNames: ['Facial', 'Peel'],
        prepaymentMode: 'none',
      },
    },
    {
      id: 'decline-single-service-suffix',
      prompt:
        'Decline to accept online payment on public booking for Color service',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: { serviceName: 'Color', prepaymentMode: 'none' },
    },
    {
      id: 'decline-every-service',
      prompt: 'Refuse online payment on public booking for every service',
      surface: 'dashboard',
      expectedAction: 'configure_service_online_payment',
      paramsPartial: { allServices: true, prepaymentMode: 'none' },
    },
  ];

const ONLINE_PAYMENT_SIGNAL =
  /\b(online\s+payment|online\s+pay(?:ment)?s?|prepayment|pre[-\s]?pay|pay\s+online|stripe|card\s+checkout|checkout\s+online)\b|stripe\s+checkout/iu;

const DISABLE_ONLINE_PAYMENT_RE =
  /\b(decline(?:\s+to)?|disable|turn\s+off|stop|reject|remove|refuse|no\s+longer|do\s+not\s+accept|don't\s+accept|dont\s+accept)\b|(?:մերժ\w*|անջատ\w*|դադարեց\w*|չընդուն\w*|չ\s*ընդուն|մի\s+ընդուն)|(?:отклон\w*|отключ\w*|выключ\w*|прекрат\w*|отказ\w*|не\s+приним\w*)/iu;

function isDisablingOnlinePayment(prompt: string): boolean {
  return DISABLE_ONLINE_PAYMENT_RE.test(prompt);
}

export type ParsedServiceOnlinePaymentConfig = {
  prepaymentMode: PrepaymentMode;
  allServices: boolean;
  serviceName?: string;
  serviceNames?: string[];
  categoryName?: string;
  depositPercent?: number | null;
  depositAmount?: number | null;
};

function hasOnlinePaymentVerb(prompt: string): boolean {
  return (
    /\b(accept|enable|disable|decline(?:\s+to)?|turn\s+(?:on|off)|require|configure|set\s+up|allow|stop|reject|refuse|do\s+not\s+accept|don't\s+accept|dont\s+accept)\b|(?:ընդուն\w*|միացր\w*|կարգավոր\w*|պահանջ\w*|անջատ\w*|մերժ\w*|դադարեց\w*|թույլ\s+տուր)|(?:приним\w*|принять|включ\w*|настро\w*|требу\w*|отключ\w*|отклон\w*|прекрати\w*|отказ\w*|разреш\w*)/iu.test(
      prompt,
    ) || /\bprepayment\b/i.test(prompt)
  );
}

function hasServiceOnlinePaymentScope(prompt: string): boolean {
  return (
    /\bservices?\b/i.test(prompt) ||
    /\bpublic\s+booking\b/i.test(prompt) ||
    /\bbooking\s+page\b/i.test(prompt)
  );
}

function isCheckoutDefaultsScopePrompt(prompt: string): boolean {
  if (/\bcheckout\s+defaults?\b/i.test(prompt)) return true;
  const hasNewServices =
    /\b(?:new|newly\s+added|future|added)\s+services?\b|\bfor\s+new\s+services?\b/i.test(
      prompt,
    );
  if (
    hasNewServices &&
    /\b(default|prepayment|online\s+payment|cash|pay\s+at\s+(?:the\s+)?venue)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  return false;
}

function isDepositPolicyTierFeaturedScope(prompt: string): boolean {
  const hasTierOrFeatured =
    /\b(?:standard|premium)\s+tier\b/i.test(prompt) ||
    /\bfeatured\s+services?\b/i.test(prompt);
  const hasDeposit =
    /\b(deposit|prepayment|pre[-\s]?pay)\b/i.test(prompt) ||
    /\$\s*\d/.test(prompt) ||
    /\b\d+\s*%/.test(prompt);
  return hasTierOrFeatured && hasDeposit;
}

function isExplicitDepositPolicyPrompt(prompt: string): boolean {
  return (
    /\bdeposit\s+policy\b/i.test(prompt) &&
    (/\b(deposit|prepayment|pre[-\s]?pay|\$\s*\d|\d+\s*%)\b/i.test(prompt) ||
      /\bhalf\b/i.test(prompt))
  );
}

export function isConfigureServiceOnlinePaymentPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isCheckoutDefaultsScopePrompt(text)) return false;
  if (isExplainServiceOnlinePaymentSetupPrompt(text)) return false;
  if (/\bpackages?\b/i.test(text) && ONLINE_PAYMENT_SIGNAL.test(text)) {
    return false;
  }
  if (
    isDepositPolicyTierFeaturedScope(text) ||
    isExplicitDepositPolicyPrompt(text)
  ) {
    return false;
  }

  const disabling =
    isDisablingOnlinePayment(text) &&
    ONLINE_PAYMENT_SIGNAL.test(text) &&
    hasServiceOnlinePaymentScope(text);

  const enabling =
    !isDisablingOnlinePayment(text) &&
    ONLINE_PAYMENT_SIGNAL.test(text) &&
    hasOnlinePaymentVerb(text) &&
    hasServiceOnlinePaymentScope(text);

  return disabling || enabling;
}

export function parseDepositPercent(prompt: string): number | null | undefined {
  if (
    /\b(?:half|50\s*%\s*deposit|50\s*%\s*prepayment|50\s*%\s*pre[-\s]?pay)\b/i.test(
      prompt,
    )
  ) {
    return 50;
  }
  if (
    /\b(?:half|50\s*%)\b/i.test(prompt) &&
    /\b(deposit|prepayment|pre[-\s]?pay)\b/i.test(prompt)
  ) {
    return 50;
  }
  const prepayBeforePct = prompt.match(
    /\b(?:deposit|prepayment|pre[-\s]?pay)\s+(?:of\s+)?(?:a\s+)?(\d{1,3})\s*%/i,
  );
  if (prepayBeforePct) return Number.parseInt(prepayBeforePct[1], 10);
  const pct = prompt.match(
    /\b(\d{1,3})\s*%(?:\s*(?:deposit|prepayment|pre[-\s]?pay))?(?:\b|$)/i,
  );
  if (pct) return Number.parseInt(pct[1], 10);
  if (/\b100\s*%\b/i.test(prompt) || /\bfull\s+prepayment\b/i.test(prompt)) {
    return 100;
  }
  return undefined;
}

export function parseFixedDepositAmount(prompt: string): number | undefined {
  const dollar = prompt.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (dollar) return Number.parseFloat(dollar[1]);
  const words = prompt.match(/\b(\d+(?:\.\d+)?)\s+dollar\b/i);
  if (words) return Number.parseFloat(words[1]);
  return undefined;
}

function parsePrepaymentMode(
  prompt: string,
  params: Record<string, unknown>,
): PrepaymentMode | undefined {
  const fromParams = params.prepaymentMode;
  if (
    fromParams === 'none' ||
    fromParams === 'full' ||
    fromParams === 'deposit'
  ) {
    return fromParams as PrepaymentMode;
  }

  if (isDisablingOnlinePayment(prompt) && ONLINE_PAYMENT_SIGNAL.test(prompt)) {
    return PrepaymentMode.NONE;
  }

  const depositPct = parseDepositPercent(prompt);
  if (depositPct != null && depositPct < 100) {
    return PrepaymentMode.DEPOSIT;
  }

  if (
    /\b(deposit|prepayment|pre[-\s]?pay|partial|half)\b/i.test(prompt) &&
    !/\bfull\s+prepayment\b/i.test(prompt) &&
    !/\bpay\s+in\s+full\b/i.test(prompt)
  ) {
    return PrepaymentMode.DEPOSIT;
  }

  if (
    /\b(full|100\s*%|pay\s+in\s+full|upfront|entire\s+amount)\b/i.test(prompt)
  ) {
    return PrepaymentMode.FULL;
  }

  if (/\b(enable|accept|require|allow|turn\s+on)\b/i.test(prompt)) {
    return PrepaymentMode.FULL;
  }

  return undefined;
}

function parseServiceScopeFromPrompt(prompt: string): {
  allServices?: boolean;
  serviceName?: string;
  serviceNames?: string[];
  categoryName?: string;
} {
  if (/\b(?:all|every|each)\s+services?\b/i.test(prompt)) {
    return { allServices: true };
  }

  const someList = prompt.match(
    /\bsome\s+services?\s*[—–-]\s*([^—–-]+?)(?:\s*[—–-]\s*with|\s+with|\s*$)/i,
  );
  if (someList) {
    const names = someList[1]
      .split(/\s+and\s+|,/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length) return { serviceNames: names };
  }

  const categoryMatch = prompt.match(
    /\bfor\s+(?:the\s+)?([a-z][\w&'-]+)\s+services\b/i,
  );
  if (categoryMatch && categoryMatch[1].toLowerCase() !== 'some') {
    return { categoryName: categoryMatch[1].trim() };
  }

  const namedPair = prompt.match(
    /\bfor\s+([A-Za-z][\w\s'-]+?)\s+and\s+([A-Za-z][\w\s'-]+?)(?:\s+with|\s*$)/i,
  );
  if (namedPair) {
    return {
      serviceNames: [namedPair[1].trim(), namedPair[2].trim()],
    };
  }

  const singleFor = prompt.match(
    /\bfor\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
  );
  if (singleFor) return { serviceName: singleFor[1].trim() };

  const singleNamed = prompt.match(
    /\bfor\s+(?:the\s+)?([A-Za-z][\w\s'-]{2,40}?)(?:\s+with\b|\s*[—–-]\s)/i,
  );
  if (singleNamed) {
    const name = singleNamed[1].trim();
    if (
      !/^(all|every|each|some|public)\b/i.test(name) &&
      !/\bservices?\b/i.test(name)
    ) {
      return { serviceName: name };
    }
  }

  const singleAtEnd = prompt.match(
    /\bfor\s+(?:the\s+)?([A-Za-z][\w\s'-]{2,40}?)\s*$/i,
  );
  if (singleAtEnd) {
    const name = singleAtEnd[1].trim();
    if (
      !/^(all|every|each|some|public)\b/i.test(name) &&
      !/\bservices?\b/i.test(name)
    ) {
      return { serviceName: name };
    }
  }

  return {};
}

export function parseServiceOnlinePaymentConfig(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedServiceOnlinePaymentConfig | null {
  const prepaymentMode = parsePrepaymentMode(prompt, params);
  if (!prepaymentMode) return null;

  const scopeFromPrompt = parseServiceScopeFromPrompt(prompt);
  const allServices =
    params.allServices === true || scopeFromPrompt.allServices === true;
  const serviceName =
    (typeof params.serviceName === 'string' && params.serviceName) ||
    scopeFromPrompt.serviceName;
  const serviceNames =
    (Array.isArray(params.serviceNames) &&
      params.serviceNames.filter((n): n is string => typeof n === 'string')) ||
    scopeFromPrompt.serviceNames;
  const categoryName =
    (typeof params.categoryName === 'string' && params.categoryName) ||
    scopeFromPrompt.categoryName;

  const depositPercent =
    typeof params.depositPercent === 'number'
      ? params.depositPercent
      : parseDepositPercent(prompt);
  const depositAmount =
    typeof params.depositAmount === 'number'
      ? params.depositAmount
      : parseFixedDepositAmount(prompt);

  return {
    prepaymentMode,
    allServices,
    serviceName: serviceName || undefined,
    serviceNames: serviceNames?.length ? serviceNames : undefined,
    categoryName: categoryName || undefined,
    depositPercent: depositPercent === undefined ? undefined : depositPercent,
    depositAmount: depositAmount ?? undefined,
  };
}

export function resolveTargetServicesForOnlinePayment<
  T extends {
    id: string;
    name: string;
    isActive?: boolean;
    category?: { name: string } | null;
  },
>(catalog: T[], config: ParsedServiceOnlinePaymentConfig): T[] {
  const active = catalog.filter((s) => s.isActive !== false);
  if (config.allServices) return active;

  if (config.serviceNames?.length) {
    const matched = resolveServices(active as unknown as Service[], {
      serviceNames: config.serviceNames,
    });
    if (matched.length) return matched as unknown as T[];
  }

  if (config.serviceName) {
    const matched = resolveServices(active as unknown as Service[], {
      serviceName: config.serviceName,
    });
    if (matched.length) return matched as unknown as T[];
  }

  if (config.categoryName) {
    const hint = config.categoryName.toLowerCase();
    const byCategoryOnly = active.filter((s) =>
      s.category?.name?.toLowerCase().includes(hint),
    );
    if (byCategoryOnly.length) return byCategoryOnly;

    const matched = resolveServicesByCategoryHint(active, config.categoryName);
    if (matched.length && matched.length < active.length) return matched;
  }

  return [];
}

export function computeServiceDepositAmount(
  price: number,
  config: ParsedServiceOnlinePaymentConfig,
): number | null {
  if (config.prepaymentMode !== PrepaymentMode.DEPOSIT) return null;
  if (config.depositAmount != null && config.depositAmount > 0) {
    return Math.min(config.depositAmount, price);
  }
  const pct = config.depositPercent;
  if (pct == null || pct === 50) return null;
  if (pct <= 0 || pct >= 100) return null;
  return Math.round(price * (pct / 100) * 100) / 100;
}

export function describePrepaymentMode(
  config: ParsedServiceOnlinePaymentConfig,
): string {
  if (config.prepaymentMode === PrepaymentMode.NONE) {
    return 'online payment disabled';
  }
  if (config.prepaymentMode === PrepaymentMode.FULL) {
    return 'full prepayment';
  }
  if (config.depositAmount != null && config.depositAmount > 0) {
    return `$${config.depositAmount} deposit`;
  }
  if (config.depositPercent != null && config.depositPercent !== 50) {
    return `${config.depositPercent}% deposit`;
  }
  return '50% deposit';
}

export function enrichServiceOnlinePaymentParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseServiceOnlinePaymentConfig(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    prepaymentMode: parsed.prepaymentMode,
    allServices: parsed.allServices || params.allServices,
    serviceName: parsed.serviceName ?? params.serviceName,
    serviceNames: parsed.serviceNames ?? params.serviceNames,
    categoryName: parsed.categoryName ?? params.categoryName,
    depositPercent: parsed.depositPercent ?? params.depositPercent,
    depositAmount: parsed.depositAmount ?? params.depositAmount,
  };
}
