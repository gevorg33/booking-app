import {
  DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS,
  DECLINE_ONLINE_PAYMENT_CATEGORY_RESCUE_SCENARIOS,
} from './ai-decline-online-payment-category-compound.fixtures.js';
import {
  AI_COMMAND_EVAL_DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_CASES,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  decomposeDeclineOnlinePaymentCategoryCompoundPrompt,
  extractDeclineAcceptCategoryRowsFromPrompt,
  hasDeclineAndAcceptCategorySplit,
  isDeclineOnlinePaymentCategoryCompoundPrompt,
  rescueDeclineOnlinePaymentCategoryCompoundIntent,
} from './ai-decline-online-payment-category-compound.util.js';

describe('ai-decline-online-payment-category-compound.util (ai-cmd-ext-4.7)', () => {
  it.each(DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS)(
    'isDeclineOnlinePaymentCategoryCompoundPrompt $id',
    ({ prompt }) => {
      expect(isDeclineOnlinePaymentCategoryCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS)(
    'decomposeDeclineOnlinePaymentCategoryCompoundPrompt $id',
    ({ prompt, orderedActions, categorySteps }) => {
      const steps = decomposeDeclineOnlinePaymentCategoryCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(categorySteps.length);
      categorySteps.forEach((expected, index) => {
        expect(steps[index].params.categoryName).toBe(expected.categoryName);
        expect(steps[index].params.prepaymentMode).toBe(expected.prepaymentMode);
        if (expected.depositPercent != null) {
          expect(steps[index].params.depositPercent).toBe(expected.depositPercent);
        }
      });
    },
  );

  it.each(DECLINE_ONLINE_PAYMENT_CATEGORY_RESCUE_SCENARIOS)(
    'rescueDeclineOnlinePaymentCategoryCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueDeclineOnlinePaymentCategoryCompoundIntent(
          prompt,
          misclassifiedAction!,
        ),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'decline_online_payment_category_compound',
      });
    },
  );

  it('does not treat single-category decline as compound', () => {
    expect(
      isDeclineOnlinePaymentCategoryCompoundPrompt(
        'Decline online payment on public booking for massage services',
      ),
    ).toBe(false);
    expect(
      decomposeDeclineOnlinePaymentCategoryCompoundPrompt(
        'Decline online payment on public booking for massage services',
      ),
    ).toEqual([]);
  });

  it('does not treat payment matrix with cash as decline compound', () => {
    expect(
      isDeclineOnlinePaymentCategoryCompoundPrompt(
        'Configure services payment matrix — full prepayment for massage services and 50% deposit for hair services; enable cash at venue',
      ),
    ).toBe(false);
  });

  it('hasDeclineAndAcceptCategorySplit detects mixed rows', () => {
    const rows = extractDeclineAcceptCategoryRowsFromPrompt(
      'Decline online payment for dental services but accept full prepayment for massage services',
    );
    expect(hasDeclineAndAcceptCategorySplit(rows)).toBe(true);
  });

  it('eval compound cases pass deterministic runner', () => {
    const failures: string[] = [];
    for (const evalCase of AI_COMMAND_EVAL_DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      if (!result.passed) {
        failures.push(`${evalCase.id}: ${result.errors.join('; ')}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
