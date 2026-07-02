import {
  isDashboardIntentAllowed,
  type AccessTier,
} from './access-control.matrix.js';
import {
  CLINIC_TEST_RESULT_EXT_MUTATE_INTENTS,
  CLINIC_TEST_RESULT_EXT_READ_INTENTS,
  detectClinicTestResultExtIntentFromPrompt,
  rescueClinicTestResultExtIntent,
  type ClinicTestResultExtIntent,
} from './ai-clinic-test-result-ext.util.js';
import { CLINIC_TEST_RESULT_EXT_CLASSIFIER_SCENARIOS } from './ai-clinic-test-result-ext-classifier.fixtures.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

/** Mutate vs read classifier tier for clinic test-result intents (M / R). */
export type ClinicTestResultExtAccessTier = 'M' | 'R';

export type ClinicTestResultAccessTier = ClinicTestResultExtAccessTier;

const CLINIC_TEST_RESULT_CORE_MUTATE_INTENTS = [
  'enter_test_result',
  'release_test_result',
] as const;

export function resolveClinicTestResultAccessTier(
  action: string,
): ClinicTestResultAccessTier | null {
  if (
    (CLINIC_TEST_RESULT_CORE_MUTATE_INTENTS as readonly string[]).includes(
      action,
    ) ||
    (CLINIC_TEST_RESULT_EXT_MUTATE_INTENTS as readonly string[]).includes(
      action,
    )
  ) {
    return 'M';
  }
  if (
    (CLINIC_TEST_RESULT_EXT_READ_INTENTS as readonly string[]).includes(action)
  ) {
    return 'R';
  }
  return null;
}

export function resolveClinicTestResultExtAccessTier(
  action: string,
): ClinicTestResultExtAccessTier | null {
  return resolveClinicTestResultAccessTier(action);
}

/** Dashboard membership tiers that may run clinic test-result intents. */
export const CLINIC_TEST_RESULT_DASHBOARD_ALLOWED_TIERS: readonly AccessTier[] =
  ['staff', 'manager', 'owner'];

/** @deprecated Use CLINIC_TEST_RESULT_DASHBOARD_ALLOWED_TIERS */
export const CLINIC_TEST_RESULT_EXT_DASHBOARD_ALLOWED_TIERS =
  CLINIC_TEST_RESULT_DASHBOARD_ALLOWED_TIERS;

export function assertClinicTestResultAccessTierMatchesMatrix(
  action: string,
  accessTier: ClinicTestResultAccessTier,
): string[] {
  const errors: string[] = [];
  const resolved = resolveClinicTestResultAccessTier(action);
  if (resolved !== accessTier) {
    errors.push(
      `accessTier: expected ${accessTier} for ${action}, resolved ${resolved ?? 'none'}`,
    );
  }
  if (!resolved) {
    return errors;
  }

  if (isDashboardIntentAllowed('client', action)) {
    errors.push(
      `access-control: ${action} must be denied for client tier on dashboard`,
    );
  }
  for (const tier of CLINIC_TEST_RESULT_DASHBOARD_ALLOWED_TIERS) {
    if (!isDashboardIntentAllowed(tier, action)) {
      errors.push(
        `access-control: ${action} must be allowed for ${tier} tier on dashboard`,
      );
    }
  }

  return errors;
}

export function assertClinicTestResultExtAccessTierMatchesMatrix(
  action: string,
  accessTier: ClinicTestResultExtAccessTier,
): string[] {
  return assertClinicTestResultAccessTierMatchesMatrix(action, accessTier);
}

export function buildClinicTestResultExtEvalExpectation(
  rescuedAction:
    | (typeof CLINIC_TEST_RESULT_EXT_MUTATE_INTENTS)[number]
    | (typeof CLINIC_TEST_RESULT_EXT_READ_INTENTS)[number],
  partial: Omit<AiCommandEvalExpectation, 'accessTier' | 'rescuedAction'> = {},
): AiCommandEvalExpectation {
  const accessTier = resolveClinicTestResultExtAccessTier(rescuedAction);
  if (!accessTier) {
    throw new Error(
      `Unknown clinic ext intent for access tier: ${rescuedAction}`,
    );
  }
  return {
    rescuedAction,
    accessTier,
    ...partial,
  };
}

export function buildClinicTestResultExtClassifierEvalExpectation(
  action: ClinicTestResultExtIntent,
  partial: Omit<
    AiCommandEvalExpectation,
    | 'action'
    | 'accessTier'
    | 'useClinicTestResultExtClassifierDetect'
    | 'rescuedAction'
  > = {},
): AiCommandEvalExpectation {
  const accessTier = resolveClinicTestResultExtAccessTier(action);
  if (!accessTier) {
    throw new Error(`Unknown clinic ext intent for classifier eval: ${action}`);
  }
  return {
    action,
    accessTier,
    useClinicTestResultExtClassifierDetect: true,
    ...partial,
  };
}

export function assertClinicTestResultExtClassifierDetect(
  prompt: string,
  expect: Pick<
    AiCommandEvalExpectation,
    'action' | 'paramsPartial' | 'needsMultilingual'
  >,
): string[] {
  const errors: string[] = [];
  if (!expect.action) {
    errors.push('useClinicTestResultExtClassifierDetect: action required');
    return errors;
  }

  const detected = detectClinicTestResultExtIntentFromPrompt(prompt);
  if (!detected || detected.action !== expect.action) {
    errors.push(
      `action: expected ${expect.action}, detected ${detected?.action ?? 'none'}`,
    );
    return errors;
  }

  const rescue = rescueClinicTestResultExtIntent(prompt, expect.action);
  if (rescue !== null) {
    errors.push(
      `classifierWithoutRescue: rescue fired for correct action ${expect.action}`,
    );
  }

  if (expect.paramsPartial) {
    for (const [key, value] of Object.entries(expect.paramsPartial)) {
      if (detected.params[key] !== value) {
        errors.push(
          `params.${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(detected.params[key])}`,
        );
      }
    }
  }

  return errors;
}

export function clinicTestResultExtClassifierScenarioToEvalCase(
  scenario: (typeof CLINIC_TEST_RESULT_EXT_CLASSIFIER_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `clinic-test-result-ext-classifier-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface: 'dashboard',
    expect: buildClinicTestResultExtClassifierEvalExpectation(
      scenario.expectedAction,
      {
        ...(scenario.paramsPartial
          ? { paramsPartial: scenario.paramsPartial }
          : {}),
        ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
      },
    ),
  };
}

export const AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CLASSIFIER_CASES: AiCommandEvalCase[] =
  CLINIC_TEST_RESULT_EXT_CLASSIFIER_SCENARIOS.map(
    clinicTestResultExtClassifierScenarioToEvalCase,
  );
