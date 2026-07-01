import {
  extractServiceTierFromPrompt,
  resolveServiceTierParam,
  type ServiceTier,
} from '../../common/utils/service-rank-metadata.util.js';
import type { Service } from '../service/entities/service.entity.js';
import { resolveServices } from './ai-orchestration.helpers.js';
import { resolveServicesByCategoryHint } from './ai-operations.util.js';
import { isConfigureServiceDepositPolicyPrompt } from './ai-service-deposit-policy.util.js';
import { isExplainServiceOnlinePaymentSetupPrompt } from './ai-service-online-payment-setup.util.js';

/** Dashboard mutate intent (ai-cmd-ext-2.26). */
export const CONFIGURE_SERVICE_FEATURED_INTENT =
  'configure_service_featured' as const;

export const CONFIGURE_SERVICE_FEATURED_CLASSIFIER_RULES = `- configure_service_featured: MUTATE — mark/unmark featured catalog services and set/clear serviceTier metadata (standard|premium) on Monetization → Services. Params: serviceName, serviceNames[], categoryName, allServices, isFeatured (boolean), serviceTier (standard|premium|"" to clear). Use for "Mark Haircut as featured", "Set Blowdry to premium tier", "Unfeature Massage". NOT configure_service_deposit_policy (deposit on featured scope), NOT list_services (read catalog), NOT update_service (move category).
- Examples:
  - "Mark Haircut as a featured service" → serviceName=Haircut, isFeatured=true
  - "Feature Haircut and Blowdry" → serviceNames=[Haircut,Blowdry], isFeatured=true
  - "Unfeature Massage" → serviceName=Massage, isFeatured=false
  - "Set Color to premium tier" → serviceName=Color, serviceTier=premium
  - "Clear premium tier from Haircut" → serviceName=Haircut, serviceTier=""
  - NOT "Require $25 deposit on featured services" → configure_service_deposit_policy`;

export type ConfigureServiceFeaturedPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof CONFIGURE_SERVICE_FEATURED_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const CONFIGURE_SERVICE_FEATURED_PROMPTS: ConfigureServiceFeaturedPromptFixture[] =
  [
    {
      id: 'mark-haircut-featured',
      prompt: 'Mark Haircut as a featured service',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: { serviceName: 'Haircut', isFeatured: true },
    },
    {
      id: 'feature-blowdry',
      prompt: 'Feature the Blowdry service',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: { serviceName: 'Blowdry', isFeatured: true },
    },
    {
      id: 'unfeature-haircut',
      prompt: 'Unfeature Haircut',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: { serviceName: 'Haircut', isFeatured: false },
    },
    {
      id: 'remove-featured-massage',
      prompt: 'Remove featured from Massage',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: { serviceName: 'Massage', isFeatured: false },
    },
    {
      id: 'set-color-premium',
      prompt: 'Set Color to premium tier',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: { serviceName: 'Color', serviceTier: 'premium' },
    },
    {
      id: 'mark-facial-standard-tier',
      prompt: 'Mark Facial as standard tier service',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: { serviceName: 'Facial', serviceTier: 'standard' },
    },
    {
      id: 'configure-haircut-featured',
      prompt: 'Configure featured metadata — mark Haircut featured',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: { serviceName: 'Haircut', isFeatured: true },
    },
    {
      id: 'feature-haircut-blowdry',
      prompt: 'Feature Haircut and Blowdry',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: { serviceNames: ['Haircut', 'Blowdry'], isFeatured: true },
    },
    {
      id: 'featured-massage-category',
      prompt: 'Mark all massage services as featured',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: { categoryName: 'massage', isFeatured: true },
    },
    {
      id: 'clear-premium-haircut',
      prompt: 'Clear premium tier from Haircut',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: { serviceName: 'Haircut', serviceTier: '' },
    },
    {
      id: 'update-blowdry-featured-premium',
      prompt: 'Mark Blowdry featured and premium tier',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: {
        serviceName: 'Blowdry',
        isFeatured: true,
        serviceTier: 'premium',
      },
    },
    {
      id: 'set-quoted-service-featured',
      prompt: 'Mark "Neck Massage" as featured',
      surface: 'dashboard',
      expectedAction: CONFIGURE_SERVICE_FEATURED_INTENT,
      paramsPartial: { serviceName: 'Neck Massage', isFeatured: true },
    },
  ];

const FEATURE_MUTATE_VERB =
  /\b(mark|feature|unfeature|un-feature|remove|clear|set|configure|update|change)\b/i;

export type ParsedConfigureServiceFeatured = {
  isFeatured?: boolean;
  serviceTier?: ServiceTier | '';
  serviceName?: string;
  serviceNames?: string[];
  categoryName?: string;
  allServices?: boolean;
};

function readStringParam(
  params: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const raw = params[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  return undefined;
}

function readBooleanParam(
  params: Record<string, unknown>,
  ...keys: string[]
): boolean | undefined {
  for (const key of keys) {
    const raw = params[key];
    if (typeof raw === 'boolean') return raw;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  }
  return undefined;
}

function readStringArrayParam(
  params: Record<string, unknown>,
  ...keys: string[]
): string[] | undefined {
  for (const key of keys) {
    const raw = params[key];
    if (!Array.isArray(raw)) continue;
    const values = raw
      .filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      )
      .map((value) => value.trim());
    if (values.length) return values;
  }
  return undefined;
}

export function extractFeaturedFlagFromPrompt(prompt: string): boolean | null {
  if (
    /\b(?:unfeature|un-feature|remove\s+featured|clear\s+featured)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (/\b(?:mark|feature|set\s+up)\s+.+\s+featured\b/i.test(prompt)) {
    return true;
  }
  if (/\bfeature\b/i.test(prompt) && /\bservice\b/i.test(prompt)) {
    return true;
  }
  if (/\b(?:feature|mark)\s+[A-Za-z].+\s+and\s+[A-Za-z]/i.test(prompt)) {
    return true;
  }
  return null;
}

export function extractFeaturedTierFromPrompt(
  prompt: string,
): ServiceTier | '' | null {
  if (
    /\b(?:remove|clear|unset)\s+(?:the\s+)?(?:premium|standard)\s+tier\b/i.test(
      prompt,
    )
  ) {
    return '';
  }
  const tier = extractServiceTierFromPrompt(prompt);
  if (tier) return tier;
  const setTier = prompt.match(/\bto\s+(premium|standard)\s+tier\b/i);
  if (setTier) return setTier[1].toLowerCase() as ServiceTier;
  const asTier = prompt.match(
    /\bas\s+(premium|standard)\s+tier(?:\s+service)?\b/i,
  );
  if (asTier) return asTier[1].toLowerCase() as ServiceTier;
  return null;
}

export function extractFeaturedServiceNameFromPrompt(
  prompt: string,
): string | null {
  const quoted = prompt.match(/\b(?:mark|feature|set)\s+"([^"]+)"/i);
  if (quoted) return quoted[1].trim();

  const asFeaturedService = prompt.match(
    /\b(?:mark|feature)\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+as\s+(?:a\s+)?featured(?:\s+service)?\b/i,
  );
  if (asFeaturedService) return asFeaturedService[1].trim();

  const markFeatured = prompt.match(
    /\bmark\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+featured\b/i,
  );
  if (markFeatured) return markFeatured[1].trim();

  const featuredAndTier = prompt.match(
    /\bmark\s+([A-Za-z][\w\s'-]+?)\s+featured\s+and\s+(?:premium|standard)\s+tier\b/i,
  );
  if (featuredAndTier) return featuredAndTier[1].trim();

  const namedPair = prompt.match(
    /\b(?:feature|mark)\s+([A-Za-z][\w\s'-]+?)\s+and\s+([A-Za-z][\w\s'-]+?)(?:\s+as|\s+featured|\s*$)/i,
  );
  if (namedPair) return namedPair[1].trim();

  const asTierOnly = prompt.match(
    /\b(?:mark|set)\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+as\s+(?:premium|standard)\s+tier(?:\s+service)?\b/i,
  );
  if (asTierOnly) return asTierOnly[1].trim();

  const asFeatured = prompt.match(
    /\b(?:mark|feature|set)\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+as\s+(?:a\s+)?featured\b/i,
  );
  if (asFeatured) return asFeatured[1].trim();

  const setTierNamed = prompt.match(
    /\bset\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+to\s+(?:premium|standard)\s+tier\b/i,
  );
  if (setTierNamed) return setTierNamed[1].trim();

  const unfeature = prompt.match(
    /\b(?:unfeature|remove\s+featured\s+from|clear\s+featured\s+from)\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)(?:\s+service|\s*$)/i,
  );
  if (unfeature) return unfeature[1].trim();

  const clearTier = prompt.match(
    /\b(?:clear|remove)\s+(?:premium|standard)\s+tier\s+from\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)(?:\s+service|\s*$)/i,
  );
  if (clearTier) return clearTier[1].trim();

  const serviceSuffix = prompt.match(
    /\b(?:feature|mark)\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
  );
  if (serviceSuffix) return serviceSuffix[1].trim();

  return null;
}

function parseFeaturedScopeFromPrompt(prompt: string): {
  serviceName?: string;
  serviceNames?: string[];
  categoryName?: string;
  allServices?: boolean;
} {
  const scope: ReturnType<typeof parseFeaturedScopeFromPrompt> = {};

  if (/\ball\s+services?\b/i.test(prompt)) {
    scope.allServices = true;
  }

  const allCategory = prompt.match(/\ball\s+([A-Za-z][\w&'-]+)\s+services?\b/i);
  if (allCategory) {
    scope.categoryName = allCategory[1].trim();
  }

  const namedPair = prompt.match(
    /\b(?:feature|mark)\s+([A-Za-z][\w\s'-]+?)\s+and\s+([A-Za-z][\w\s'-]+?)(?:\s+as|\s+featured|\s*$)/i,
  );
  if (namedPair) {
    scope.serviceNames = [namedPair[1].trim(), namedPair[2].trim()];
  }

  const serviceName = extractFeaturedServiceNameFromPrompt(prompt);
  if (serviceName) scope.serviceName = serviceName;

  return scope;
}

export function isConfigureServiceFeaturedPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isConfigureServiceDepositPolicyPrompt(text)) return false;
  if (isExplainServiceOnlinePaymentSetupPrompt(text)) return false;
  if (/\b(?:deposit|prepayment|pre-pay)\b/i.test(text)) return false;

  const wantsFeaturedChange =
    extractFeaturedFlagFromPrompt(text) != null ||
    (/\bfeatured\b/i.test(text) && FEATURE_MUTATE_VERB.test(text));

  const wantsTierChange =
    extractFeaturedTierFromPrompt(text) != null ||
    (/\b(?:premium|standard)\s+tier\b/i.test(text) &&
      FEATURE_MUTATE_VERB.test(text));

  if (!wantsFeaturedChange && !wantsTierChange) return false;

  if (
    /\b(?:list|show|which|what|summarize|explain)\b/i.test(text) &&
    !FEATURE_MUTATE_VERB.test(text)
  ) {
    return false;
  }

  return true;
}

export function parseConfigureServiceFeaturedFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigureServiceFeatured | null {
  const hasParamSignal =
    readBooleanParam(params, 'isFeatured', 'featured') != null ||
    params.serviceTier !== undefined ||
    readStringParam(params, 'serviceName') != null ||
    (readStringArrayParam(params, 'serviceNames')?.length ?? 0) > 0 ||
    readStringParam(params, 'categoryName') != null ||
    params.allServices === true;

  if (!isConfigureServiceFeaturedPrompt(prompt) && !hasParamSignal) return null;

  const scope = parseFeaturedScopeFromPrompt(prompt);
  const isFeatured =
    readBooleanParam(params, 'isFeatured', 'featured') ??
    extractFeaturedFlagFromPrompt(prompt) ??
    undefined;
  const tierParam = params.serviceTier;
  const serviceTier =
    tierParam === ''
      ? ''
      : (resolveServiceTierParam(tierParam) ??
        extractFeaturedTierFromPrompt(prompt) ??
        undefined);

  const parsed: ParsedConfigureServiceFeatured = {
    isFeatured,
    serviceTier,
    serviceName:
      readStringParam(params, 'serviceName') ?? scope.serviceName ?? undefined,
    serviceNames:
      readStringArrayParam(params, 'serviceNames') ??
      scope.serviceNames ??
      undefined,
    categoryName:
      readStringParam(params, 'categoryName') ??
      scope.categoryName ??
      undefined,
    allServices:
      params.allServices === true ? true : (scope.allServices ?? undefined),
  };

  if (
    parsed.isFeatured == null &&
    parsed.serviceTier == null &&
    !parsed.serviceName &&
    !parsed.serviceNames?.length &&
    !parsed.categoryName &&
    !parsed.allServices &&
    !isConfigureServiceFeaturedPrompt(prompt)
  ) {
    return null;
  }

  return parsed;
}

export function resolveTargetServicesForFeaturedConfig<
  T extends {
    id: string;
    name: string;
    isActive?: boolean;
    category?: { name?: string | null } | null;
  },
>(catalog: T[], config: ParsedConfigureServiceFeatured): T[] {
  const active = catalog.filter((service) => service.isActive !== false);

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
    const byCategoryOnly = active.filter((service) =>
      service.category?.name?.toLowerCase().includes(hint),
    );
    if (byCategoryOnly.length) return byCategoryOnly;

    const matched = resolveServicesByCategoryHint(
      active as unknown as Service[],
      config.categoryName,
    ) as unknown as T[];
    if (matched.length) return matched;
  }

  return [];
}

export function rescueConfigureServiceFeaturedIntent(
  prompt: string,
  action: string,
): {
  action: typeof CONFIGURE_SERVICE_FEATURED_INTENT;
  rescueReason: string;
} | null {
  if (
    isConfigureServiceFeaturedPrompt(prompt) &&
    action !== CONFIGURE_SERVICE_FEATURED_INTENT
  ) {
    return {
      action: CONFIGURE_SERVICE_FEATURED_INTENT,
      rescueReason: 'configure_service_featured',
    };
  }
  return null;
}

export function enrichConfigureServiceFeaturedParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseConfigureServiceFeaturedFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    ...(parsed.isFeatured != null ? { isFeatured: parsed.isFeatured } : {}),
    ...(parsed.serviceTier != null ? { serviceTier: parsed.serviceTier } : {}),
    ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
    ...(parsed.serviceNames?.length
      ? { serviceNames: parsed.serviceNames }
      : {}),
    ...(parsed.categoryName ? { categoryName: parsed.categoryName } : {}),
    ...(parsed.allServices ? { allServices: true } : {}),
  };
}
