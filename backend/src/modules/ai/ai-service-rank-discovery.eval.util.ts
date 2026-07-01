import {
  SERVICE_RANK_COMPOUND_SCENARIOS,
  SIMILAR_SERVICE_RANK_PROMPTS,
  type ServiceRankCompoundScenario,
  type ServiceRankDiscoveryPromptFixture,
} from './ai-service-rank-discovery.fixtures.js';
import {
  buildProviderRankDiscoveryRescueParams,
  buildSubjectiveRankDiscoveryRescueParams,
  buildServiceRankDiscoveryRescueParams,
  extractProviderRankServiceCategoryFromPrompt,
  extractSubjectiveRankServiceCategoryFromPrompt,
  extractServiceRankFromPrompt,
  isMidRangeServiceListPrompt,
  rescueServiceRankDiscoveryIntent,
} from './ai-service-rank-discovery.util.js';
import { extractMaxPriceFromBudgetPrompt } from './ai-budget-service-discovery.util.js';
import { resolveBudgetMisrouteAction } from './ai-budget-service-discovery.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

const RANK_PUBLIC_ACTION_MAP: Record<string, string> = {
  discover_packages: 'booking_help',
};

const RANK_CUSTOMER_ACTION_MAP: Record<string, string> = {
  book_appointment: 'book_nearest_slot',
};

export function mapRankExpectedActionForSurface(
  action: string,
  surface: CommandSurface,
): string {
  if (surface === 'public') {
    return RANK_PUBLIC_ACTION_MAP[action] ?? action;
  }
  if (surface === 'customer') {
    return RANK_CUSTOMER_ACTION_MAP[action] ?? action;
  }
  return action;
}

export function rankSurfacesForScenario(
  scenario: ServiceRankDiscoveryPromptFixture,
): Array<'public' | 'customer'> {
  if (scenario.surface === 'public') return ['public'];
  if (scenario.surface === 'customer') return ['customer'];
  return ['public', 'customer'];
}

function isRankCompoundScenario(
  scenario: ServiceRankDiscoveryPromptFixture,
  surface: CommandSurface,
): boolean {
  if (surface === 'public') return !!scenario.publicCompoundSteps?.length;
  if (surface === 'customer') return !!scenario.customerCompoundSteps?.length;
  return false;
}

export function rankScenarioEligibleForEval(
  scenario: ServiceRankDiscoveryPromptFixture,
  surface: CommandSurface,
): boolean {
  if (scenario.phase2 || scenario.clarify) return false;
  if (surface !== 'public' && surface !== 'customer') return false;
  if (scenario.surface === 'public' && surface !== 'public') return false;
  if (scenario.surface === 'customer' && surface !== 'customer') return false;
  if (scenario.blocked && scenario.expectedAction !== 'discover_packages') {
    return false;
  }
  if (
    scenario.expectedAction === 'recommend_specialists' &&
    !scenario.providerRank
  ) {
    return false;
  }
  if (scenario.expectedAction === 'booking_help' || scenario.subjectiveRank) {
    return scenario.subjectiveRank === true;
  }
  if (
    scenario.expectedAction === 'analyze_appointments' ||
    scenario.expectedAction === 'analyze_services'
  ) {
    return false;
  }
  if (scenario.id === 'rank-plain-catalog-en') return false;
  if (isRankCompoundScenario(scenario, surface)) return true;
  if (scenario.expectedAction === 'discover_packages') return true;
  return (
    scenario.expectedParams?.serviceRank != null ||
    scenario.expectedParams?.serviceTier != null ||
    isMidRangeServiceListPrompt(scenario.prompt) ||
    extractServiceRankFromPrompt(scenario.prompt) != null
  );
}

function buildRankRescueParamsPartial(
  scenario: ServiceRankDiscoveryPromptFixture,
): Record<string, unknown> | undefined {
  const params = buildServiceRankDiscoveryRescueParams(scenario.prompt);
  const partial: Record<string, unknown> = {};
  const serviceRank =
    scenario.expectedParams?.serviceRank ?? params.serviceRank;
  if (serviceRank != null) {
    partial.serviceRank = serviceRank;
  }
  const maxPrice = scenario.expectedParams?.maxPrice ?? params.maxPrice;
  if (maxPrice != null) {
    partial.maxPrice = maxPrice;
  }
  if (params.serviceCategory != null) {
    partial.serviceCategory = params.serviceCategory;
  }
  if (params.serviceTier != null) {
    partial.serviceTier = params.serviceTier;
  }
  if (params.limit != null) {
    partial.limit = params.limit;
  }
  return Object.keys(partial).length > 0 ? partial : undefined;
}

function resolveRankRescueExpectation(
  scenario: ServiceRankDiscoveryPromptFixture,
  surface: CommandSurface,
): {
  rescuedAction: string;
  rescueReason: string;
  paramsPartial?: Record<string, unknown>;
  rescueFromAction?: string;
} {
  if (scenario.expectedAction === 'discover_packages') {
    const misroute = resolveBudgetMisrouteAction(scenario.prompt);
    const rescued = rescueServiceRankDiscoveryIntent(
      scenario.prompt,
      'list_services',
      surface as 'customer' | 'dashboard' | 'public',
    );
    return {
      rescuedAction:
        rescued?.action ??
        mapRankExpectedActionForSurface(scenario.expectedAction, surface),
      rescueReason: misroute ?? scenario.expectedAction,
      rescueFromAction: 'list_services',
    };
  }

  if (scenario.providerRank) {
    const fromAction = 'unknown';
    const rescued = rescueServiceRankDiscoveryIntent(
      scenario.prompt,
      fromAction,
      surface as 'customer' | 'dashboard' | 'public',
    );
    const params = buildProviderRankDiscoveryRescueParams(scenario.prompt);
    const paramsPartial: Record<string, unknown> = {};
    const serviceCategory =
      scenario.expectedParams?.serviceCategory ??
      params.serviceCategory ??
      extractProviderRankServiceCategoryFromPrompt(scenario.prompt);
    if (serviceCategory) paramsPartial.serviceCategory = serviceCategory;
    const maxPrice =
      scenario.expectedParams?.maxPrice ??
      params.maxPrice ??
      extractMaxPriceFromBudgetPrompt(scenario.prompt);
    if (maxPrice != null) paramsPartial.maxPrice = maxPrice;

    return {
      rescuedAction:
        rescued?.action ??
        mapRankExpectedActionForSurface(scenario.expectedAction, surface),
      rescueReason: rescued?.rescueReason ?? 'rank_provider_specialists',
      rescueFromAction: fromAction,
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    };
  }

  if (scenario.subjectiveRank) {
    const fromAction = 'unknown';
    const rescued = rescueServiceRankDiscoveryIntent(
      scenario.prompt,
      fromAction,
      surface as 'customer' | 'dashboard' | 'public',
    );
    const params = buildSubjectiveRankDiscoveryRescueParams(scenario.prompt);
    const paramsPartial: Record<string, unknown> = {};
    const serviceCategory =
      scenario.expectedParams?.serviceCategory ??
      params.serviceCategory ??
      extractSubjectiveRankServiceCategoryFromPrompt(scenario.prompt);
    if (serviceCategory) paramsPartial.serviceCategory = serviceCategory;

    return {
      rescuedAction:
        rescued?.action ??
        mapRankExpectedActionForSurface(scenario.expectedAction, surface),
      rescueReason: rescued?.rescueReason ?? 'rank_subjective_booking_help',
      rescueFromAction: fromAction,
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    };
  }

  const fromAction =
    scenario.id === 'rank-not-specialist-en' ||
    scenario.id === 'rank-recommend-not-provider-en'
      ? 'recommend_specialists'
      : 'unknown';
  const rescued = rescueServiceRankDiscoveryIntent(
    scenario.prompt,
    fromAction,
    surface as 'customer' | 'dashboard' | 'public',
  );

  const defaultRescueReason = isMidRangeServiceListPrompt(scenario.prompt)
    ? 'rank_mid_range_list'
    : scenario.expectedParams?.serviceTier != null
      ? 'rank_tier_filter'
      : 'rank_list_services';

  return {
    rescuedAction:
      rescued?.action ??
      mapRankExpectedActionForSurface(scenario.expectedAction, surface),
    rescueReason: rescued?.rescueReason ?? defaultRescueReason,
    rescueFromAction: fromAction,
    paramsPartial: buildRankRescueParamsPartial(scenario),
  };
}

/** Map rank service discovery fixtures (rank-1.11) to deterministic eval golden cases. */
export function serviceRankDiscoveryScenarioToEvalCase(
  scenario: ServiceRankDiscoveryPromptFixture,
  surface: 'public' | 'customer',
): AiCommandEvalCase {
  const id = `rank-${surface}-${scenario.id}`;

  if (isRankCompoundScenario(scenario, surface)) {
    const steps =
      surface === 'public'
        ? scenario.publicCompoundSteps!
        : scenario.customerCompoundSteps!;
    const listStepParams = buildRankRescueParamsPartial(scenario) ?? {};
    const expect: AiCommandEvalExpectation = {
      compoundSurface: surface,
      compoundSteps: [...steps],
      compoundSource: 'golden',
      compoundRecipeId:
        surface === 'public'
          ? 'public_service_rank_discovery_compound'
          : 'customer_service_rank_discovery_compound',
      compoundStepParams: steps.map((_, stepIndex) => ({
        stepIndex,
        paramsPartial:
          stepIndex === 0 ? listStepParams : { bookingFirstAvailable: true },
      })),
    };
    return { id, prompt: scenario.prompt, locale: 'en', surface, expect };
  }

  const rescueExpectation = resolveRankRescueExpectation(scenario, surface);
  return {
    id,
    prompt: scenario.prompt,
    locale: 'en',
    surface,
    expect: {
      useSurfaceRankRescue: true,
      rescueFromAction: rescueExpectation.rescueFromAction ?? 'unknown',
      rescuedAction: rescueExpectation.rescuedAction,
      rescueReason: rescueExpectation.rescueReason,
      ...(rescueExpectation.paramsPartial
        ? { paramsPartial: rescueExpectation.paramsPartial }
        : {}),
    },
  };
}

export function serviceRankCompoundScenarioToEvalCase(
  scenario: ServiceRankCompoundScenario,
  surface: 'public' | 'customer',
): AiCommandEvalCase {
  const steps =
    surface === 'public'
      ? scenario.publicCompoundSteps
      : scenario.customerCompoundSteps;
  const listStepParams: Record<string, unknown> = {
    serviceRank: scenario.serviceRank,
    bookingFirstAvailable: true,
  };
  if (scenario.serviceCategory) {
    listStepParams.serviceCategory = scenario.serviceCategory;
  }
  if (scenario.maxPrice != null) {
    listStepParams.maxPrice = scenario.maxPrice;
  }

  return {
    id: `rank-${surface}-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface,
    expect: {
      compoundSurface: surface,
      compoundSteps: [...steps],
      compoundSource: 'golden',
      compoundRecipeId:
        surface === 'public'
          ? 'public_service_rank_discovery_compound'
          : 'customer_service_rank_discovery_compound',
      compoundStepParams: steps.map((_, stepIndex) => ({
        stepIndex,
        paramsPartial:
          stepIndex === 0 ? listStepParams : { bookingFirstAvailable: true },
      })),
    },
  };
}

function buildRankEvalCasesForSurface(
  surface: 'public' | 'customer',
  filter: (scenario: ServiceRankDiscoveryPromptFixture) => boolean,
): AiCommandEvalCase[] {
  const promptCases = SIMILAR_SERVICE_RANK_PROMPTS.filter(filter)
    .filter((scenario) => rankScenarioEligibleForEval(scenario, surface))
    .filter((scenario) => !isRankCompoundScenario(scenario, surface))
    .map((scenario) =>
      serviceRankDiscoveryScenarioToEvalCase(scenario, surface),
    );

  const compoundIds = new Set(
    SIMILAR_SERVICE_RANK_PROMPTS.filter((scenario) =>
      isRankCompoundScenario(scenario, surface),
    ).map((scenario) => scenario.id),
  );
  const compoundCases = SERVICE_RANK_COMPOUND_SCENARIOS.filter(
    (scenario) => !compoundIds.has(scenario.id),
  ).map((scenario) => serviceRankCompoundScenarioToEvalCase(scenario, surface));

  const compoundPromptCases = SIMILAR_SERVICE_RANK_PROMPTS.filter(
    (scenario) =>
      isRankCompoundScenario(scenario, surface) &&
      rankScenarioEligibleForEval(scenario, surface),
  ).map((scenario) =>
    serviceRankDiscoveryScenarioToEvalCase(scenario, surface),
  );

  return [...promptCases, ...compoundCases, ...compoundPromptCases];
}

export const AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_PUBLIC_CASES: AiCommandEvalCase[] =
  buildRankEvalCasesForSurface(
    'public',
    (scenario) => scenario.surface === 'public' || scenario.surface === 'both',
  );

export const AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CUSTOMER_CASES: AiCommandEvalCase[] =
  buildRankEvalCasesForSurface(
    'customer',
    (scenario) =>
      scenario.surface === 'customer' || scenario.surface === 'both',
  );

export const AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CASES: AiCommandEvalCase[] =
  [
    ...AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_PUBLIC_CASES,
    ...AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CUSTOMER_CASES,
  ];
