import {
  SUBSCRIPTION_FIRST_VISIT_COMPOUND_PROMPTS,
  SUBSCRIPTION_FIRST_VISIT_RESCUE_SCENARIOS,
  type SubscriptionFirstVisitCompoundFixture,
} from './ai-subscription-first-visit-compound.fixtures.js';
import { SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_SCENARIOS } from './ai-subscription-first-visit-compound-multilingual.fixtures.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildSubscriptionFirstVisitCompoundStepParams(
  fixture: Pick<SubscriptionFirstVisitCompoundFixture, 'serviceName' | 'date'>,
): AiCommandEvalExpectation['compoundStepParams'] {
  const partial: Record<string, unknown> = {
    subscriptionFirstVisit: true,
    paymentMethod: 'subscription_credit',
  };
  if (fixture.serviceName) partial.serviceName = fixture.serviceName;
  if (fixture.date) partial.date = fixture.date;

  return [
    { stepIndex: 0, paramsPartial: { ...partial, focus: 'overview' } },
    {
      stepIndex: 1,
      paramsPartial: { ...partial, continueAfterSubscriptionExplain: true },
    },
  ];
}

export function subscriptionFirstVisitScenarioToEvalCase(
  fixture: SubscriptionFirstVisitCompoundFixture,
  locale: 'en' | 'hy' | 'ru' = 'en',
): AiCommandEvalCase {
  return {
    id: `subscription-first-visit-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale,
    expect: {
      routeTier: 'compound',
      compoundRecipeId: 'subscription_first_visit',
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams:
        buildSubscriptionFirstVisitCompoundStepParams(fixture),
      noLlm: true,
    },
  };
}

export const AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_COMPOUND_CASES: AiCommandEvalCase[] =
  SUBSCRIPTION_FIRST_VISIT_COMPOUND_PROMPTS.map((fixture) =>
    subscriptionFirstVisitScenarioToEvalCase(fixture),
  );

export const AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_SCENARIOS.map((fixture) =>
    subscriptionFirstVisitScenarioToEvalCase(fixture, fixture.locale),
  );

export const AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_RESCUE_CASES: AiCommandEvalCase[] =
  SUBSCRIPTION_FIRST_VISIT_RESCUE_SCENARIOS.map((fixture) => ({
    id: `subscription-first-visit-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale: 'en' as const,
    expect: {
      routeTier: 'compound',
      rescueReason: 'subscription_first_visit_compound',
      compoundRecipeId: 'subscription_first_visit',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
