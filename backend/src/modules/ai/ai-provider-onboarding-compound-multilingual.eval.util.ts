import {
  PROVIDER_ONBOARDING_MULTILINGUAL_SCENARIOS,
  type ProviderOnboardingMultilingualScenario,
} from './ai-provider-onboarding-compound-multilingual.fixtures.js';
import { needsMultilingualNormalization } from './ai-prompt-i18n.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

export function providerOnboardingMultilingualEvalCaseId(
  scenario: Pick<ProviderOnboardingMultilingualScenario, 'id'>,
): string {
  return `provider-onboarding-i18n-${scenario.id}`;
}

function buildProviderOnboardingCompoundStepParams(
  expectedParams?: Record<string, unknown>,
): AiCommandEvalExpectation['compoundStepParams'] {
  if (!expectedParams) return undefined;

  const stepParams: NonNullable<
    AiCommandEvalExpectation['compoundStepParams']
  > = [];

  if (expectedParams.employeeName) {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: { employeeName: expectedParams.employeeName },
    });
  }
  if (expectedParams.serviceNames) {
    stepParams.push({
      stepIndex: 1,
      paramsPartial: { serviceNames: expectedParams.serviceNames },
    });
  }
  if (expectedParams.templateName) {
    stepParams.push({
      stepIndex: 2,
      paramsPartial: { templateName: expectedParams.templateName },
    });
  }
  if (typeof expectedParams.enabled === 'boolean') {
    stepParams.push({
      stepIndex: 3,
      paramsPartial: { enabled: expectedParams.enabled },
    });
  }

  return stepParams.length > 0 ? stepParams : undefined;
}

export function providerOnboardingMultilingualScenarioToEvalCase(
  scenario: ProviderOnboardingMultilingualScenario,
): AiCommandEvalCase {
  const compoundStepParams = buildProviderOnboardingCompoundStepParams(
    scenario.paramsPartial,
  );
  const needsMultilingual = needsMultilingualNormalization(scenario.prompt);

  return {
    id: providerOnboardingMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'dashboard',
    locale: scenario.locale,
    expect: {
      ...(isCompoundPrompt(scenario.prompt)
        ? { routeTier: 'compound' as const }
        : {}),
      compoundSurface: 'dashboard',
      compoundSteps: [...scenario.orderedActions],
      compoundRecipeId: 'onboard_new_provider',
      compoundSource: 'golden',
      ...(needsMultilingual ? { needsMultilingual: true } : {}),
      ...(compoundStepParams ? { compoundStepParams } : {}),
    },
  };
}

export const AI_COMMAND_EVAL_PROVIDER_ONBOARDING_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_ONBOARDING_MULTILINGUAL_SCENARIOS.map(
    providerOnboardingMultilingualScenarioToEvalCase,
  );
