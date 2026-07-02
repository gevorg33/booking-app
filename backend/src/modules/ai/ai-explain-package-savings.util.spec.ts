import {
  CUSTOMER_PUBLIC_EXPLAIN_PACKAGE_SAVINGS_CLASSIFIER_RULES,
  EXPLAIN_PACKAGE_SAVINGS_PROMPTS,
  EXPLAIN_PACKAGE_SAVINGS_RESCUE_SCENARIOS,
  detectExplainPackageSavingsAction,
  enrichExplainPackageSavingsParamsFromPrompt,
  isExplainPackageSavingsPrompt,
  rescueExplainPackageSavingsIntent,
} from './ai-explain-package-savings.util.js';
import { EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS } from './ai-explain-package-savings-multilingual.fixtures.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { isCompareServicesPrompt } from './ai-compare-services.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_PACKAGE_SAVINGS_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-explain-package-savings.util (ai-cmd-customer-4.6.5)', () => {
  it('exports classifier rules for explain_package_savings', () => {
    expect(CUSTOMER_PUBLIC_EXPLAIN_PACKAGE_SAVINGS_CLASSIFIER_RULES).toContain(
      'explain_package_savings',
    );
  });

  it.each(EXPLAIN_PACKAGE_SAVINGS_PROMPTS.map((row) => [row.id, row] as const))(
    'detects explain_package_savings for $id',
    (_id, row) => {
      expect(isExplainPackageSavingsPrompt(row.prompt)).toBe(true);
      expect(detectExplainPackageSavingsAction(row.prompt)).toBe(
        row.expectedAction,
      );
      expect(
        rescueExplainPackageSavingsIntent(row.prompt, 'unknown')?.action,
      ).toBe(row.expectedAction);
      expect(
        rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action,
      ).toBe(row.expectedAction);
    },
  );

  it.each(
    EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain_package_savings for $id', (_id, row) => {
    expect(isExplainPackageSavingsPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_PACKAGE_SAVINGS_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueSelfServiceBookingIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('explain_package_savings');
  });

  it('rejects discover, compare-services-only, and empty prompts', () => {
    expect(isExplainPackageSavingsPrompt('')).toBe(false);
    expect(isExplainPackageSavingsPrompt('What packages do you offer?')).toBe(
      false,
    );
    expect(
      isExplainPackageSavingsPrompt('Which is cheaper, manicure or pedicure?'),
    ).toBe(false);
    expect(
      isCompareServicesPrompt('Which is cheaper, manicure or pedicure?'),
    ).toBe(true);
    expect(
      isExplainPackageSavingsPrompt('Is spa package available tomorrow?'),
    ).toBe(false);
  });

  it('enriches packageName from prompt', () => {
    expect(
      enrichExplainPackageSavingsParamsFromPrompt(
        {},
        'How much do I save on the spa day package?',
      ).packageName,
    ).toBe('Spa Day');
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(EXPLAIN_PACKAGE_SAVINGS_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_EXPLAIN_PACKAGE_SAVINGS_CASES.length).toBe(
      EXPLAIN_PACKAGE_SAVINGS_PROMPTS.length +
        EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS.length +
        EXPLAIN_PACKAGE_SAVINGS_RESCUE_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_PACKAGE_SAVINGS_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
