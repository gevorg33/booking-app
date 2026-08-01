import {
  SIMILAR_BUDGET_SERVICE_PROMPTS,
  type BudgetServiceDiscoveryPromptFixture,
} from './ai-budget-service-discovery.fixtures.js';
import {
  buildFlexibleAvailabilityEvalParams,
  isFlexibleAvailabilityBudgetCompoundPrompt,
} from './ai-flexible-availability-compound.util.js';
import { pickMatchingParamsPartial } from './ai-flexible-availability.eval.util.js';
import {
  enrichBudgetFromPrompt,
  extractBudgetPromoCodeFromPrompt,
  extractMaxPriceFromBudgetPrompt,
  extractMinPriceFromBudgetPrompt,
  extractMaxTotalPriceFromBudgetPrompt,
  extractBudgetCartServiceCountFromPrompt,
  isBudgetAnyProviderListPrompt,
  isBudgetCartTotalPrompt,
  resolveBudgetMisrouteAction,
} from './ai-budget-service-discovery.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

const BUDGET_DASHBOARD_ACTION_MAP: Record<string, string> = {
  discover_packages: 'list_packages',
  apply_gift_card_code: 'validate_gift_card',
  discover_subscription_plans: 'list_subscription_plans',
};

const BUDGET_PUBLIC_ACTION_MAP: Record<string, string> = {
  discover_packages: 'booking_help',
  discover_subscription_plans: 'booking_help',
};

const BUDGET_CUSTOMER_ACTION_MAP: Record<string, string> = {
  book_appointment: 'book_nearest_slot',
};

export function mapBudgetExpectedActionForSurface(
  action: string,
  surface: CommandSurface,
): string {
  if (surface === 'dashboard') {
    return BUDGET_DASHBOARD_ACTION_MAP[action] ?? action;
  }
  if (surface === 'public') {
    return BUDGET_PUBLIC_ACTION_MAP[action] ?? action;
  }
  if (surface === 'customer') {
    return BUDGET_CUSTOMER_ACTION_MAP[action] ?? action;
  }
  return action;
}

export function budgetSurfacesForScenario(
  scenario: BudgetServiceDiscoveryPromptFixture,
): CommandSurface[] {
  if (scenario.surface === 'public') return ['public'];
  if (scenario.surface === 'customer') return ['customer'];
  return ['public', 'customer', 'dashboard'];
}

function isBudgetCompoundScenario(
  scenario: BudgetServiceDiscoveryPromptFixture,
  surface: CommandSurface,
): boolean {
  if (surface === 'public') return !!scenario.publicCompoundSteps?.length;
  if (surface === 'customer') return !!scenario.customerCompoundSteps?.length;
  return false;
}

function mapBudgetFlexibleAvailabilityActionForSurface(
  scenario: BudgetServiceDiscoveryPromptFixture,
  surface: 'public' | 'customer',
): string {
  if (surface === 'customer') {
    return scenario.expectedAction === 'check_availability'
      ? 'check_providers_for_service'
      : scenario.expectedAction;
  }
  return scenario.expectedAction;
}

export function isBudgetFlexibleAvailabilityScenario(
  scenario: BudgetServiceDiscoveryPromptFixture,
): boolean {
  return (
    isFlexibleAvailabilityBudgetCompoundPrompt(scenario.prompt) &&
    scenario.expectedAction === 'check_availability'
  );
}

export function budgetScenarioEligibleForSurface(
  scenario: BudgetServiceDiscoveryPromptFixture,
  surface: CommandSurface,
): boolean {
  if (isBudgetFlexibleAvailabilityScenario(scenario)) {
    return surface === 'public' || surface === 'customer';
  }
  if (
    surface === 'dashboard' &&
    (scenario.publicCompoundSteps?.length ||
      scenario.customerCompoundSteps?.length)
  ) {
    return false;
  }
  if (isBudgetCompoundScenario(scenario, surface)) return true;
  if (scenario.skipMaxPrice) return true;
  if (scenario.expectedParams?.maxTotalPrice != null) return true;
  if (scenario.expectedParams?.minPrice != null) return true;
  if (scenario.expectedParams?.maxPrice != null) return true;
  if (isBudgetCartTotalPrompt(scenario.prompt)) return true;
  return extractMaxPriceFromBudgetPrompt(scenario.prompt) != null;
}

function resolveBudgetRescueExpectation(
  scenario: BudgetServiceDiscoveryPromptFixture,
  surface: CommandSurface,
): {
  rescuedAction: string;
  rescueReason: string;
  paramsPartial?: Record<string, unknown>;
} {
  if (scenario.skipMaxPrice) {
    const misroute = resolveBudgetMisrouteAction(scenario.prompt);
    return {
      rescuedAction: mapBudgetExpectedActionForSurface(
        scenario.expectedAction,
        surface,
      ),
      rescueReason: misroute ?? scenario.expectedAction,
    };
  }

  const maxTotalPrice =
    scenario.expectedParams?.maxTotalPrice ??
    extractMaxTotalPriceFromBudgetPrompt(scenario.prompt);
  const maxPrice =
    scenario.expectedParams?.maxPrice ??
    extractMaxPriceFromBudgetPrompt(scenario.prompt);
  const specialistPrompt =
    /\b(?:best|rated|top|specialist|stylist|therapist)\b/i.test(
      scenario.prompt,
    ) && !isBudgetAnyProviderListPrompt(scenario.prompt);
  const rescuedAction = mapBudgetExpectedActionForSurface(
    specialistPrompt ? 'recommend_specialists' : scenario.expectedAction,
    surface,
  );

  const paramsPartial: Record<string, unknown> = {};
  if (maxTotalPrice != null) {
    paramsPartial.maxTotalPrice = maxTotalPrice;
    paramsPartial.serviceCount =
      scenario.expectedParams?.serviceCount ??
      extractBudgetCartServiceCountFromPrompt(scenario.prompt) ??
      2;
  } else if (maxPrice != null) {
    paramsPartial.maxPrice = maxPrice;
    const minPrice =
      scenario.expectedParams?.minPrice ??
      extractMinPriceFromBudgetPrompt(scenario.prompt);
    if (minPrice != null) paramsPartial.minPrice = minPrice;
    const promoCode =
      scenario.expectedParams?.promoCode ??
      extractBudgetPromoCodeFromPrompt(scenario.prompt);
    if (promoCode) paramsPartial.promoCode = promoCode;
    const budgetEnriched = enrichBudgetFromPrompt({}, scenario.prompt);
    if (budgetEnriched.serviceName) {
      paramsPartial.serviceName = budgetEnriched.serviceName;
    }
    if (budgetEnriched.allProviders === true) {
      paramsPartial.allProviders = true;
    }
    if (budgetEnriched.employeeName) {
      paramsPartial.employeeName = budgetEnriched.employeeName;
    }
    if (budgetEnriched.preferShortDuration === true) {
      paramsPartial.preferShortDuration = true;
    }
    if (budgetEnriched.minDurationMinutes != null) {
      paramsPartial.minDurationMinutes = budgetEnriched.minDurationMinutes;
    }
  }

  return {
    rescuedAction,
    rescueReason: specialistPrompt
      ? 'budget_recommend_specialists'
      : 'budget_list_services',
    ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
  };
}

/** Map budget service discovery fixtures (budget-1.11) to deterministic eval golden cases. */
export function budgetServiceDiscoveryScenarioToEvalCase(
  scenario: BudgetServiceDiscoveryPromptFixture,
  surface: CommandSurface,
): AiCommandEvalCase {
  const id = `budget-${surface}-${scenario.id}`;

  if (
    isBudgetFlexibleAvailabilityScenario(scenario) &&
    (surface === 'public' || surface === 'customer')
  ) {
    const action = mapBudgetFlexibleAvailabilityActionForSurface(
      scenario,
      surface,
    );
    const enriched = buildFlexibleAvailabilityEvalParams(
      scenario.prompt,
      surface,
      action,
    );
    const paramsPartial = pickMatchingParamsPartial(
      scenario.expectedParams,
      enriched,
    );
    return {
      id,
      prompt: scenario.prompt,
      locale: 'en',
      surface,
      expect: {
        useSurfaceFlexibleAvailabilityEnrichment: true,
        enrichedAction: action,
        paramsPartial,
      },
    };
  }

  if (isBudgetCompoundScenario(scenario, surface)) {
    const steps =
      surface === 'public'
        ? scenario.publicCompoundSteps!
        : scenario.customerCompoundSteps!;
    const recipeId =
      surface === 'public'
        ? 'public_budget_service_discovery_compound'
        : 'customer_budget_service_discovery_compound';
    const expect: AiCommandEvalExpectation = {
      compoundSurface: surface,
      compoundSteps: [...steps],
      compoundSource: 'golden',
      compoundRecipeId: recipeId,
    };
    if (scenario.expectedParams?.maxPrice != null) {
      expect.compoundStepParams = steps.map((_, stepIndex) => ({
        stepIndex,
        paramsPartial: { maxPrice: scenario.expectedParams!.maxPrice },
      }));
    }
    return { id, prompt: scenario.prompt, locale: 'en', surface, expect };
  }

  if (scenario.skipMaxPrice) {
    const misroute = resolveBudgetMisrouteAction(scenario.prompt);
    if (
      scenario.expectedAction === 'explain_checkout_currency' &&
      misroute == null
    ) {
      return {
        id,
        prompt: scenario.prompt,
        locale: 'en',
        surface,
        expect: {
          useCheckoutCurrencyRescue: true,
          rescuedAction: 'explain_checkout_currency',
          rescueFromAction: 'list_services',
          rescueReason: 'explain_checkout_currency',
        },
      };
    }

    return {
      id,
      prompt: scenario.prompt,
      locale: 'en',
      surface,
      expect: {
        useSurfaceBudgetRescue: true,
        rescuedAction: mapBudgetExpectedActionForSurface(
          scenario.expectedAction,
          surface,
        ),
        rescueFromAction: 'list_services',
        rescueReason: misroute ?? scenario.expectedAction,
      },
    };
  }

  const rescueExpectation = resolveBudgetRescueExpectation(scenario, surface);
  return {
    id,
    prompt: scenario.prompt,
    locale: 'en',
    surface,
    expect: {
      useSurfaceBudgetRescue: true,
      rescueFromAction: 'unknown',
      ...rescueExpectation,
    },
  };
}

function buildBudgetEvalCasesForSurface(
  surface: CommandSurface,
  filter: (scenario: BudgetServiceDiscoveryPromptFixture) => boolean,
): AiCommandEvalCase[] {
  return SIMILAR_BUDGET_SERVICE_PROMPTS.filter((scenario) => !scenario.phase2)
    .filter(filter)
    .filter((scenario) => budgetScenarioEligibleForSurface(scenario, surface))
    .map((scenario) =>
      budgetServiceDiscoveryScenarioToEvalCase(scenario, surface),
    );
}

export const AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_PUBLIC_CASES: AiCommandEvalCase[] =
  buildBudgetEvalCasesForSurface(
    'public',
    (scenario) => scenario.surface === 'public' || scenario.surface === 'both',
  );

export const AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CUSTOMER_CASES: AiCommandEvalCase[] =
  buildBudgetEvalCasesForSurface(
    'customer',
    (scenario) =>
      scenario.surface === 'customer' || scenario.surface === 'both',
  );

export const AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_DASHBOARD_CASES: AiCommandEvalCase[] =
  buildBudgetEvalCasesForSurface(
    'dashboard',
    (scenario) => scenario.surface === 'both',
  );

export const AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CASES: AiCommandEvalCase[] =
  [
    ...AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_PUBLIC_CASES,
    ...AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CUSTOMER_CASES,
    ...AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_DASHBOARD_CASES,
  ];
