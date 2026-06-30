import {
  extractServiceRankMetadata,
  extractServiceTierFromPrompt,
  resolveServiceTierParam,
  type ServiceTier,
} from '../../common/utils/service-rank-metadata.util.js';
import { PrepaymentMode, type Service } from '../service/entities/service.entity.js';
import { resolveServices } from './ai-orchestration.helpers.js';
import { resolveServicesByCategoryHint } from './ai-operations.util.js';
import { filterServicesByTier } from './ai-service-catalog-rank.util.js';
import { isExplainServiceOnlinePaymentSetupPrompt } from './ai-service-online-payment-setup.util.js';
import {
  computeServiceDepositAmount,
  parseDepositPercent,
  parseFixedDepositAmount,
} from './ai-service-online-payment.util.js';

/** Dashboard mutate intent (ai-cmd-ext-2.18). */
export const CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT =
  'configure_service_deposit_policy' as const;

export type ServiceDepositPolicyAccessTier = 'M';

export function resolveServiceDepositPolicyAccessTier(
  action: string,
): ServiceDepositPolicyAccessTier | null {
  return action === CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT ? 'M' : null;
}

export const SERVICE_DEPOSIT_POLICY_CLASSIFIER_RULES = `- configure_service_deposit_policy: MUTATE — set deposit prepayment on existing catalog services (prepaymentMode=deposit). Scope by serviceTier (standard|premium), featuredOnly (featured services), categoryName, serviceName, serviceNames[], or allServices. Params: depositPercent (number; omit or null for 50% default) OR depositAmount (fixed dollar). Enables online deposit checkout on scoped services. NOT configure_service_online_payment (full prepayment, disable, or generic online payment without tier/featured/deposit-policy phrasing), NOT configure_checkout_defaults (new-service defaults), NOT configure_service_featured (mark featured/tier metadata), NOT explain_service_online_payment_setup (read-only).
- Examples:
  - "Set 30% deposit on premium tier services" → serviceTier=premium, depositPercent=30
  - "Require $25 deposit on featured services" → featuredOnly=true, depositAmount=25
  - "Configure deposit policy for standard tier massage services — 50%" → serviceTier=standard, categoryName=massage, depositPercent=50
  - "Set deposit policy on featured color services to $15" → featuredOnly=true, categoryName=color, depositAmount=15
  - "Apply 25% deposit policy to all premium tier services" → serviceTier=premium, allServices=true, depositPercent=25`;

export type ConfigureServiceDepositPolicyPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const CONFIGURE_SERVICE_DEPOSIT_POLICY_PROMPTS: ConfigureServiceDepositPolicyPromptFixture[] =
  [
    {
      id: 'premium-tier-30-percent',
      prompt: 'Set 30% deposit on premium tier services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: { serviceTier: 'premium', depositPercent: 30 },
    },
    {
      id: 'featured-fixed-dollar',
      prompt: 'Require $25 deposit on featured services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: { featuredOnly: true, depositAmount: 25 },
    },
    {
      id: 'standard-tier-category-half',
      prompt:
        'Configure deposit policy for standard tier massage services — 50%',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: {
        serviceTier: 'standard',
        categoryName: 'massage',
        depositPercent: 50,
      },
    },
    {
      id: 'featured-category-fixed',
      prompt: 'Set deposit policy on featured color services to $15',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: {
        featuredOnly: true,
        categoryName: 'color',
        depositAmount: 15,
      },
    },
    {
      id: 'premium-tier-all-25',
      prompt: 'Apply 25% deposit policy to all premium tier services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: {
        serviceTier: 'premium',
        allServices: true,
        depositPercent: 25,
      },
    },
    {
      id: 'featured-half-deposit',
      prompt: 'Require half deposit on featured services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: { featuredOnly: true, depositPercent: 50 },
    },
    {
      id: 'premium-tier-category-20-dollar',
      prompt: 'Set $20 deposit on premium tier haircut services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: {
        serviceTier: 'premium',
        categoryName: 'haircut',
        depositAmount: 20,
      },
    },
    {
      id: 'standard-tier-40-percent',
      prompt: 'Update standard tier services to 40% deposit policy',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: { serviceTier: 'standard', depositPercent: 40 },
    },
    {
      id: 'featured-facial-35-percent',
      prompt: 'Configure 35% deposit for featured facial services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: {
        featuredOnly: true,
        categoryName: 'facial',
        depositPercent: 35,
      },
    },
    {
      id: 'deposit-policy-all-services',
      prompt: 'Set deposit policy for all services to 30%',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: { allServices: true, depositPercent: 30 },
    },
    {
      id: 'premium-tier-default-half',
      prompt: 'Configure deposit policy on premium tier services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: { serviceTier: 'premium' },
    },
    {
      id: 'featured-named-services',
      prompt: 'Require $10 deposit on featured Haircut and Blowdry services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
      paramsPartial: {
        featuredOnly: true,
        serviceNames: ['Haircut', 'Blowdry'],
        depositAmount: 10,
      },
    },
  ];

const CHECKOUT_DEFAULTS_SCOPE =
  /\bcheckout\s+defaults?\b|\b(?:new|newly\s+added|future|added)\s+services?\b|\bfor\s+new\s+services?\b/i;

const DISABLE_DEPOSIT =
  /\b(decline|disable|turn\s+off|stop|reject|remove|refuse|no\s+online\s+payment)\b/i;

const MUTATE_DEPOSIT_VERB =
  /\b(set|configure|require|update|change|apply)\b/i;

function hasTierOrFeaturedScope(prompt: string): boolean {
  return (
    /\b(?:standard|premium)\s+tier\b/i.test(prompt) ||
    /\bfeatured\s+services?\b/i.test(prompt) ||
    /\bfor\s+featured\b/i.test(prompt) ||
    /\bfeatured\s+[A-Za-z]/i.test(prompt)
  );
}

function hasDepositPolicyPhrase(prompt: string): boolean {
  return /\bdeposit\s+policy\b/i.test(prompt);
}

function hasDepositAmountSignal(prompt: string): boolean {
  return (
    /\b(deposit|prepayment|pre[-\s]?pay)\b/i.test(prompt) ||
    /\$\s*\d/.test(prompt) ||
    /\b\d+\s*%/.test(prompt) ||
    /\bhalf\b/i.test(prompt)
  );
}

export function isConfigureServiceDepositPolicyPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (CHECKOUT_DEFAULTS_SCOPE.test(text)) return false;
  if (isExplainServiceOnlinePaymentSetupPrompt(text)) return false;
  if (DISABLE_DEPOSIT.test(text)) return false;
  if (/\bfull\s+prepayment\b/i.test(text) || /\bpay\s+in\s+full\b/i.test(text)) {
    return false;
  }

  const scoped = hasTierOrFeaturedScope(text) || hasDepositPolicyPhrase(text);
  if (!scoped) return false;
  if (!hasDepositAmountSignal(text)) return false;

  if (hasDepositPolicyPhrase(text)) return true;
  return MUTATE_DEPOSIT_VERB.test(text);
}

export type ParsedServiceDepositPolicyConfig = {
  prepaymentMode: PrepaymentMode.DEPOSIT;
  depositPercent?: number | null;
  depositAmount?: number | null;
  allServices?: boolean;
  serviceName?: string;
  serviceNames?: string[];
  categoryName?: string;
  serviceTier?: ServiceTier;
  featuredOnly?: boolean;
};

function readServiceRankFields(service: Service): {
  isFeatured: boolean;
  serviceTier: ServiceTier | null;
} {
  const enriched = service as Service & {
    isFeatured?: boolean;
    serviceTier?: ServiceTier | null;
  };
  if (
    enriched.isFeatured !== undefined ||
    enriched.serviceTier !== undefined
  ) {
    return {
      isFeatured: enriched.isFeatured === true,
      serviceTier: enriched.serviceTier ?? null,
    };
  }
  const rank = extractServiceRankMetadata(service.metadata);
  return {
    isFeatured: rank.isFeatured === true,
    serviceTier: rank.serviceTier ?? null,
  };
}

function parseDepositPolicyScopeFromPrompt(prompt: string): {
  allServices?: boolean;
  serviceName?: string;
  serviceNames?: string[];
  categoryName?: string;
  serviceTier?: ServiceTier;
  featuredOnly?: boolean;
} {
  const scope: ReturnType<typeof parseDepositPolicyScopeFromPrompt> = {};

  const tier = extractServiceTierFromPrompt(prompt);
  if (tier) scope.serviceTier = tier;

  if (
    /\bfeatured\s+services?\b/i.test(prompt) ||
    /\bfor\s+featured\b/i.test(prompt)
  ) {
    scope.featuredOnly = true;
  }

  const tierCategory = prompt.match(
    /\b(?:standard|premium)\s+tier\s+([A-Za-z][\w&'-]+)\s+services\b/i,
  );
  if (tierCategory) {
    scope.categoryName = tierCategory[1]!.trim();
    return scope;
  }

  const featuredCategory = prompt.match(
    /\bfeatured\s+([A-Za-z][\w&'-]+)\s+services\b/i,
  );
  if (featuredCategory) {
    scope.featuredOnly = true;
    scope.categoryName = featuredCategory[1]!.trim();
    return scope;
  }

  if (/\b(?:all|every|each)\s+(?:premium|standard)\s+tier\s+services\b/i.test(prompt)) {
    scope.allServices = true;
    return scope;
  }

  if (/\b(?:all|every|each)\s+services\b/i.test(prompt)) {
    scope.allServices = true;
    return scope;
  }

  const allCategory = prompt.match(
    /\b(?:all|every)\s+([A-Za-z][\w&'-]+)\s+services\b/i,
  );
  if (allCategory) {
    scope.categoryName = allCategory[1]!.trim();
    return scope;
  }

  const forCategory = prompt.match(
    /\bfor\s+(?:all\s+)?([A-Za-z][\w&'-]+)\s+services\b/i,
  );
  if (forCategory && forCategory[1]!.toLowerCase() !== 'featured') {
    scope.categoryName = forCategory[1]!.trim();
    return scope;
  }

  const featuredNamed = prompt.match(
    /\bfeatured\s+([A-Za-z][\w\s'-]+?)\s+and\s+([A-Za-z][\w\s'-]+?)\s+services\b/i,
  );
  if (featuredNamed) {
    scope.featuredOnly = true;
    scope.serviceNames = [featuredNamed[1]!.trim(), featuredNamed[2]!.trim()];
    return scope;
  }

  const tierOnly =
    /\b(?:standard|premium)\s+tier\s+services\b/i.test(prompt) &&
    !scope.categoryName;
  if (tierOnly) {
    return scope;
  }

  if (scope.featuredOnly && !scope.categoryName) {
    return scope;
  }

  return scope;
}

export function parseServiceDepositPolicyConfig(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedServiceDepositPolicyConfig | null {
  const hasExplicitParams =
    typeof params.depositPercent === 'number' ||
    typeof params.depositAmount === 'number' ||
    params.featuredOnly === true ||
    resolveServiceTierParam(params.serviceTier) != null;

  if (
    !isConfigureServiceDepositPolicyPrompt(prompt) &&
    !hasExplicitParams &&
    params._forceDepositPolicy !== true
  ) {
    return null;
  }

  const depositPercent =
    typeof params.depositPercent === 'number'
      ? params.depositPercent
      : parseDepositPercent(prompt);
  const depositAmount =
    typeof params.depositAmount === 'number'
      ? params.depositAmount
      : parseFixedDepositAmount(prompt);

  if (
    depositPercent === undefined &&
    depositAmount === undefined &&
    !/\b(deposit|prepayment|pre[-\s]?pay)\b/i.test(prompt)
  ) {
    return null;
  }

  const scopeFromPrompt = parseDepositPolicyScopeFromPrompt(prompt);
  const serviceTier =
    resolveServiceTierParam(params.serviceTier) ??
    scopeFromPrompt.serviceTier;
  const featuredOnly =
    params.featuredOnly === true || scopeFromPrompt.featuredOnly === true;

  return {
    prepaymentMode: PrepaymentMode.DEPOSIT,
    depositPercent:
      depositPercent === undefined ? undefined : depositPercent,
    depositAmount: depositAmount ?? undefined,
    allServices:
      params.allServices === true || scopeFromPrompt.allServices === true,
    serviceName:
      (typeof params.serviceName === 'string' && params.serviceName) ||
      scopeFromPrompt.serviceName,
    serviceNames:
      (Array.isArray(params.serviceNames) &&
        params.serviceNames.filter((n): n is string => typeof n === 'string')) ||
      scopeFromPrompt.serviceNames,
    categoryName:
      (typeof params.categoryName === 'string' && params.categoryName) ||
      scopeFromPrompt.categoryName,
    serviceTier: serviceTier ?? undefined,
    featuredOnly: featuredOnly || undefined,
  };
}

export function resolveTargetServicesForDepositPolicy<
  T extends Service & {
    isActive?: boolean;
    category?: { name: string } | null;
    isFeatured?: boolean;
    serviceTier?: ServiceTier | null;
  },
>(catalog: T[], config: ParsedServiceDepositPolicyConfig): T[] {
  let active = catalog.filter((s) => s.isActive !== false);

  if (config.serviceTier) {
    const withTier = active.map((service) => {
      const rank = readServiceRankFields(service);
      return { ...service, serviceTier: rank.serviceTier };
    });
    active = filterServicesByTier(withTier, config.serviceTier) as T[];
  }

  if (config.featuredOnly) {
    active = active.filter((service) => readServiceRankFields(service).isFeatured);
  }

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

  if (config.serviceTier || config.featuredOnly) {
    return active;
  }

  return [];
}

export function describeServiceDepositPolicy(config: ParsedServiceDepositPolicyConfig): string {
  if (config.depositAmount != null && config.depositAmount > 0) {
    return `$${config.depositAmount} deposit`;
  }
  if (config.depositPercent != null && config.depositPercent !== 50) {
    return `${config.depositPercent}% deposit`;
  }
  return '50% deposit';
}

export function computeDepositPolicyAmount(
  price: number,
  config: ParsedServiceDepositPolicyConfig,
): number | null {
  return computeServiceDepositAmount(price, {
    prepaymentMode: PrepaymentMode.DEPOSIT,
    allServices: config.allServices ?? false,
    depositPercent: config.depositPercent,
    depositAmount: config.depositAmount,
  });
}

export function enrichServiceDepositPolicyParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseServiceDepositPolicyConfig(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    prepaymentMode: parsed.prepaymentMode,
    depositPercent: parsed.depositPercent ?? params.depositPercent,
    depositAmount: parsed.depositAmount ?? params.depositAmount,
    allServices: parsed.allServices || params.allServices,
    serviceName: parsed.serviceName ?? params.serviceName,
    serviceNames: parsed.serviceNames ?? params.serviceNames,
    categoryName: parsed.categoryName ?? params.categoryName,
    serviceTier: parsed.serviceTier ?? params.serviceTier,
    featuredOnly: parsed.featuredOnly ?? params.featuredOnly,
  };
}

export function rescueConfigureServiceDepositPolicyIntent(
  prompt: string,
  action: string,
): {
  action: typeof CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT;
  rescueReason: string;
} | null {
  if (action === CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT) return null;
  if (!isConfigureServiceDepositPolicyPrompt(prompt)) return null;
  return {
    action: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
    rescueReason: CONFIGURE_SERVICE_DEPOSIT_POLICY_INTENT,
  };
}
