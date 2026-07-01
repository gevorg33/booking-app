import {
  CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS,
  CASH_AND_ONLINE_PAYMENT_RESCUE_SCENARIOS,
} from './ai-cash-online-payment-compound.fixtures.js';
import {
  AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_COMPOUND_CASES,
  AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_DECLINE_CATEGORY_CASES,
  AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_RESCUE_CASES,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { decomposeDeclineOnlinePaymentCategoryCompoundPrompt } from './ai-decline-online-payment-category-compound.util.js';
import { isConfigureCashPaymentsPrompt } from './ai-payments.util.js';
import {
  decomposeCashAndDeclineAllOnlinePaymentCompoundPrompt,
  hasCashMutateCue,
  hasOnlinePaymentMutateCue,
  isCashAndDeclineAllOnlinePaymentCompoundPrompt,
  isCashAndOnlinePaymentCompoundPrompt,
  resolveCashAndOnlinePaymentCompoundRecipeId,
  rescueCashAndOnlinePaymentCompoundIntent,
} from './ai-cash-online-payment-compound.util.js';

const CASH_AND_ONLINE_ONLY_PROMPTS =
  CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS.filter(
    (row) => row.compoundRecipeId === 'cash_and_online_payment',
  );

const CASH_AND_DECLINE_CATEGORY_PROMPTS =
  CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS.filter(
    (row) => row.compoundRecipeId === 'decline_online_payment_category',
  );

describe('ai-cash-online-payment-compound.util (ai-cmd-ext-5.6)', () => {
  it.each(CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS)(
    'isCashAndOnlinePaymentCompoundPrompt $id',
    ({ prompt }) => {
      expect(isCashAndOnlinePaymentCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(CASH_AND_ONLINE_ONLY_PROMPTS)(
    'isCashAndDeclineAllOnlinePaymentCompoundPrompt $id',
    ({ prompt }) => {
      expect(isCashAndDeclineAllOnlinePaymentCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(CASH_AND_ONLINE_ONLY_PROMPTS)(
    'decomposeCashAndDeclineAllOnlinePaymentCompoundPrompt $id',
    ({ prompt, orderedActions, paramChecks }) => {
      const steps =
        decomposeCashAndDeclineAllOnlinePaymentCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      paramChecks?.forEach((check) => {
        expect(steps[check.stepIndex].params[check.key]).toBe(check.value);
      });
    },
  );

  it.each(CASH_AND_DECLINE_CATEGORY_PROMPTS)(
    'decomposeDeclineOnlinePaymentCategoryCompoundPrompt with cash $id',
    ({ prompt, orderedActions, paramChecks }) => {
      const steps = decomposeDeclineOnlinePaymentCategoryCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      paramChecks?.forEach((check) => {
        expect(steps[check.stepIndex].params[check.key]).toBe(check.value);
      });
    },
  );

  it.each(CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS)(
    'resolveCashAndOnlinePaymentCompoundRecipeId $id',
    ({ prompt, compoundRecipeId }) => {
      expect(resolveCashAndOnlinePaymentCompoundRecipeId(prompt)).toBe(
        compoundRecipeId,
      );
    },
  );

  it.each(CASH_AND_ONLINE_PAYMENT_RESCUE_SCENARIOS)(
    'rescueCashAndOnlinePaymentCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueCashAndOnlinePaymentCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'cash_and_online_payment_compound',
      });
    },
  );

  it.each(CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS)(
    'isConfigureCashPaymentsPrompt does not match cash+online compound $id',
    ({ prompt }) => {
      expect(isConfigureCashPaymentsPrompt(prompt)).toBe(false);
    },
  );

  it('detects cash and online payment mutate cues', () => {
    const prompt = 'Enable cash and decline online payment for all services';
    expect(hasCashMutateCue(prompt)).toBe(true);
    expect(hasOnlinePaymentMutateCue(prompt)).toBe(true);
  });

  it.each([
    ...AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_COMPOUND_CASES,
    ...AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_DECLINE_CATEGORY_CASES,
  ])('eval compound case $id', (evalCase) => {
    expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
  });

  it.each(AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_RESCUE_CASES)(
    'eval rescue case $id',
    (evalCase) => {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    },
  );
});
