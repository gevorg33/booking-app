import {
  SIMILAR_BUDGET_SERVICE_PROMPTS,
  type BudgetServiceDiscoveryPromptFixture,
} from './ai-budget-service-discovery.fixtures.js';
import {
  extractMaxPriceFromBudgetPrompt,
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
  apply_gift_card_code: 'booking_help',
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

export function budgetScenarioEligibleForSurface(
  scenario: BudgetServiceDiscoveryPromptFixture,
  surface: CommandSurface,
): boolean {
  if (
    surface === 'dashboard' &&
    (scenario.publicCompoundSteps?.length ||
      scenario.customerCompoundSteps?.length)
  ) {
    return false;
  }
  if (isBudgetCompoundScenario(scenario, surface)) return true;
  if (scenario.skipMaxPrice) return true;
  if (scenario.expectedParams?.maxPrice != null) return true;
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

  const maxPrice =
    scenario.expectedParams?.maxPrice ??
    extractMaxPriceFromBudgetPrompt(scenario.prompt);
  const specialistPrompt =
    /\b(?:best|rated|top|specialist|stylist|therapist)\b/i.test(
      scenario.prompt,
    );
  const rescuedAction = mapBudgetExpectedActionForSurface(
    specialistPrompt ? 'recommend_specialists' : scenario.expectedAction,
    surface,
  );

  return {
    rescuedAction,
    rescueReason: specialistPrompt
      ? 'budget_recommend_specialists'
      : 'budget_list_services',
    ...(maxPrice != null ? { paramsPartial: { maxPrice } } : {}),
  };
}

/** Map budget service discovery fixtures (budget-1.11) to deterministic eval golden cases. */
export function budgetServiceDiscoveryScenarioToEvalCase(
  scenario: BudgetServiceDiscoveryPromptFixture,
  surface: CommandSurface,
): AiCommandEvalCase {
  const id = `budget-${surface}-${scenario.id}`;

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
