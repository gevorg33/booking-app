import {
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS,
  type FlexibleAvailabilityPromptFixture,
} from './ai-flexible-availability.fixtures.js';
import {
  buildFlexibleAvailabilityCompoundSharedParams,
  buildFlexibleAvailabilityEvalParams,
} from './ai-flexible-availability-compound.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

const FLEXIBLE_AVAILABILITY_EVAL_PARAM_KEYS = [
  'serviceCategory',
  'maxPrice',
  'availabilityWindows',
  'bookingFirstAvailable',
  'allProviders',
  'date',
  'weekdays',
  'timeOfDay',
] as const;

export function mapFlexibleAvailabilityActionForSurface(
  scenario: FlexibleAvailabilityPromptFixture,
  surface: 'public' | 'customer',
): string {
  if (surface === 'customer') {
    if (scenario.customerExpectedAction) return scenario.customerExpectedAction;
    if (scenario.expectedAction === 'check_availability') {
      return 'check_providers_for_service';
    }
    if (scenario.expectedAction === 'book_appointment') {
      return 'book_nearest_slot';
    }
    return scenario.expectedAction;
  }

  if (scenario.expectedAction === 'check_providers_for_service') {
    return 'check_availability';
  }
  if (scenario.expectedAction === 'book_nearest_slot') {
    return 'book_appointment';
  }
  return scenario.expectedAction;
}

export function flexibleAvailabilitySurfacesForScenario(
  scenario: FlexibleAvailabilityPromptFixture,
): Array<'public' | 'customer'> {
  if (scenario.surface === 'public') return ['public'];
  if (scenario.surface === 'customer') return ['customer'];
  if (scenario.surface === 'dashboard') return [];
  return ['public', 'customer'];
}

function isFlexibleAvailabilityCompoundScenario(
  scenario: FlexibleAvailabilityPromptFixture,
  surface: CommandSurface,
): boolean {
  if (surface === 'public') return !!scenario.publicCompoundSteps?.length;
  if (surface === 'customer') return !!scenario.customerCompoundSteps?.length;
  return false;
}

export function valuesMatchEvalPartial(
  actual: unknown,
  expected: unknown,
): boolean {
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      expected.length === actual.length &&
      expected.every((item, index) =>
        valuesMatchEvalPartial(actual[index], item),
      )
    );
  }
  if (expected !== null && typeof expected === 'object') {
    if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) {
      return false;
    }
    return Object.entries(expected as Record<string, unknown>).every(
      ([key, value]) =>
        valuesMatchEvalPartial(
          (actual as Record<string, unknown>)[key],
          value,
        ),
    );
  }
  return actual === expected;
}

function pickMatchingParamsPartial(
  expected: Record<string, unknown> | undefined,
  actual: Record<string, unknown>,
): Record<string, unknown> {
  if (!expected) return {};

  const partial: Record<string, unknown> = {};
  for (const key of FLEXIBLE_AVAILABILITY_EVAL_PARAM_KEYS) {
    if (expected[key] === undefined) continue;
    if (valuesMatchEvalPartial(actual[key], expected[key])) {
      partial[key] = expected[key];
    }
  }
  return partial;
}

export function flexibleAvailabilityScenarioEligibleForEval(
  scenario: FlexibleAvailabilityPromptFixture,
  surface: 'public' | 'customer',
): boolean {
  if (scenario.phase2 || scenario.handlerOutcome) return false;
  if (scenario.surface === 'dashboard') return false;
  if (scenario.surface === 'public' && surface !== 'public') return false;
  if (scenario.surface === 'customer' && surface !== 'customer') return false;
  if (scenario.skipMaxPrice) return false;

  const action = mapFlexibleAvailabilityActionForSurface(scenario, surface);
  if (
    ![
      'check_availability',
      'check_providers_for_service',
      'book_appointment',
      'book_nearest_slot',
    ].includes(action)
  ) {
    return false;
  }

  if (isFlexibleAvailabilityCompoundScenario(scenario, surface)) {
    return true;
  }

  if (!scenario.expectedParams?.availabilityWindows) {
    return false;
  }

  const enriched = buildFlexibleAvailabilityEvalParams(
    scenario.prompt,
    surface,
    action,
  );
  const partial = pickMatchingParamsPartial(scenario.expectedParams, enriched);
  return (
    Object.keys(partial).length > 0 &&
    partial.availabilityWindows !== undefined
  );
}

function buildCompoundStepParamsPartial(
  shared: Record<string, unknown>,
): Record<string, unknown> {
  const partial: Record<string, unknown> = {};
  for (const key of [
    'serviceCategory',
    'maxPrice',
    'availabilityWindows',
    'allProviders',
  ] as const) {
    if (shared[key] !== undefined) {
      partial[key] = shared[key];
    }
  }
  return partial;
}

/** Map flexible availability fixtures (avail-1.11) to deterministic eval golden cases. */
export function flexibleAvailabilityScenarioToEvalCase(
  scenario: FlexibleAvailabilityPromptFixture,
  surface: 'public' | 'customer',
): AiCommandEvalCase {
  const id = `avail-${surface}-${scenario.id}`;
  const action = mapFlexibleAvailabilityActionForSurface(scenario, surface);

  if (isFlexibleAvailabilityCompoundScenario(scenario, surface)) {
    const steps =
      surface === 'public'
        ? scenario.publicCompoundSteps!
        : scenario.customerCompoundSteps!;
    const shared = buildFlexibleAvailabilityCompoundSharedParams(
      scenario.prompt,
      surface,
    );
    const listStepParams = buildCompoundStepParamsPartial(shared);
    const expect: AiCommandEvalExpectation = {
      compoundSurface: surface,
      compoundSteps: [...steps],
      compoundSource: 'golden',
      compoundRecipeId:
        surface === 'public'
          ? 'public_flexible_availability_budget_compound'
          : 'customer_flexible_availability_budget_compound',
      compoundStepParams: steps.map((_, stepIndex) => ({
        stepIndex,
        paramsPartial:
          stepIndex === steps.length - 1
            ? { ...listStepParams, bookingFirstAvailable: true }
            : listStepParams,
      })),
    };
    return { id, prompt: scenario.prompt, locale: 'en', surface, expect };
  }

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
    locale: scenario.id.includes('-hy')
      ? 'hy'
      : scenario.id.includes('-ru')
        ? 'ru'
        : 'en',
    surface,
    expect: {
      useSurfaceFlexibleAvailabilityEnrichment: true,
      enrichedAction: action,
      paramsPartial,
    },
  };
}

function buildFlexibleAvailabilityEvalCasesForSurface(
  surface: 'public' | 'customer',
  filter: (scenario: FlexibleAvailabilityPromptFixture) => boolean,
): AiCommandEvalCase[] {
  return SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter(filter)
    .filter((scenario) =>
      flexibleAvailabilityScenarioEligibleForEval(scenario, surface),
    )
    .map((scenario) =>
      flexibleAvailabilityScenarioToEvalCase(scenario, surface),
    );
}

export const AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES: AiCommandEvalCase[] =
  buildFlexibleAvailabilityEvalCasesForSurface(
    'public',
    (scenario) => scenario.surface === 'public' || scenario.surface === 'both',
  );

export const AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES: AiCommandEvalCase[] =
  buildFlexibleAvailabilityEvalCasesForSurface(
    'customer',
    (scenario) =>
      scenario.surface === 'customer' || scenario.surface === 'both',
  );

export const AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CASES: AiCommandEvalCase[] =
  [
    ...AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES,
    ...AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES,
  ];
