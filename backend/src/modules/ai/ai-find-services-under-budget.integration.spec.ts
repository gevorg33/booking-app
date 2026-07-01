import {
  FIND_SERVICES_UNDER_BUDGET_PROMPTS,
  FIND_SERVICES_UNDER_BUDGET_RESCUE_SCENARIOS,
} from './ai-find-services-under-budget.fixtures.js';
import { rescueFindServicesUnderBudgetIntent } from './ai-find-services-under-budget.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_FIND_SERVICES_UNDER_BUDGET_CASES } from './eval/ai-command-eval.cases.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-classifier.schema.js';
import { CUSTOMER_PUBLIC_FIND_SERVICES_UNDER_BUDGET_CLASSIFIER_RULES } from './ai-find-services-under-budget.fixtures.js';

describe('ai-find-services-under-budget integration (ai-cmd-customer-4.20.3)', () => {
  it.each(FIND_SERVICES_UNDER_BUDGET_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueFindServicesUnderBudgetIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it('public classifier schema includes find_services_under_budget chip rules', () => {
    const schema = buildPublicClassifierSchema();
    expect(schema).toContain('find_services_under_budget');
    expect(schema).toContain('Services under $50');
    expect(
      CUSTOMER_PUBLIC_FIND_SERVICES_UNDER_BUDGET_CLASSIFIER_RULES,
    ).toContain('assistantDiscoverChipUnder50');
  });

  it.each(
    FIND_SERVICES_UNDER_BUDGET_PROMPTS.filter(
      (e) => e.surface === 'customer',
    ).slice(0, 3),
  )('chip prompt $id is in eval golden set', ({ id }) => {
    expect(
      AI_COMMAND_EVAL_FIND_SERVICES_UNDER_BUDGET_CASES.some((row) =>
        row.id.includes(id.replace('-customer', '')),
      ),
    ).toBe(true);
  });

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_FIND_SERVICES_UNDER_BUDGET_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
