import {
  CUSTOMER_PUBLIC_EXPLAIN_AMOUNT_DUE_NOW_CLASSIFIER_RULES,
  EXPLAIN_AMOUNT_DUE_NOW_PROMPTS,
  detectExplainAmountDueNowAction,
  enrichExplainAmountDueNowParamsFromPrompt,
  isExplainAmountDueNowPrompt,
  rescueExplainAmountDueNowIntent,
} from './ai-explain-amount-due-now.util.js';
import { EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_SCENARIOS } from './ai-explain-amount-due-now-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_EXPLAIN_AMOUNT_DUE_NOW_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { isExplainCheckoutTotalPrompt } from './ai-payments.util.js';

describe('ai-explain-amount-due-now.util (ai-cmd-customer-4.2.1)', () => {
  it('exports classifier rules for explain_amount_due_now', () => {
    expect(CUSTOMER_PUBLIC_EXPLAIN_AMOUNT_DUE_NOW_CLASSIFIER_RULES).toContain(
      'explain_amount_due_now',
    );
    expect(CUSTOMER_PUBLIC_EXPLAIN_AMOUNT_DUE_NOW_CLASSIFIER_RULES).toContain(
      'How much do I pay today?',
    );
  });

  it.each(EXPLAIN_AMOUNT_DUE_NOW_PROMPTS.map((row) => [row.id, row] as const))(
    'detects amount-due-now prompt $id',
    (_id, row) => {
      expect(isExplainAmountDueNowPrompt(row.prompt)).toBe(true);
      expect(detectExplainAmountDueNowAction(row.prompt)).toBe(
        row.expectedAction,
      );
    },
  );

  it.each(
    EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual amount-due-now prompt $id', (_id, row) => {
    expect(isExplainAmountDueNowPrompt(row.prompt)).toBe(true);
    expect(rescueExplainAmountDueNowIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_amount_due_now',
    );
  });

  it.each(EXPLAIN_AMOUNT_DUE_NOW_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues amount-due-now prompt $id from unknown',
    (_id, row) => {
      const rescued = rescueExplainAmountDueNowIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
      expect(rescued?.rescueReason).toBe(row.rescueReason);
      expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
        'explain_amount_due_now',
      );
    },
  );

  it('enriches serviceName params', () => {
    const enriched = enrichExplainAmountDueNowParamsFromPrompt(
      {},
      'How much do I pay today for massage?',
      extractServiceNameFromPrompt,
    );
    expect(enriched.serviceName).toBe('massage');
  });

  it('disambiguates budget browse and checkout total breakdown', () => {
    expect(isExplainAmountDueNowPrompt('How much do I pay today?')).toBe(true);
    expect(isExplainAmountDueNowPrompt('What can I book with $50?')).toBe(
      false,
    );
    expect(
      isExplainAmountDueNowPrompt('Explain checkout total for haircut'),
    ).toBe(false);
    expect(
      isExplainCheckoutTotalPrompt('Explain checkout total for haircut'),
    ).toBe(true);
    expect(isExplainAmountDueNowPrompt('Why must I pay now for massage?')).toBe(
      false,
    );
  });

  it.each(AI_COMMAND_EVAL_EXPLAIN_AMOUNT_DUE_NOW_CASES)(
    'eval golden case $id passes deterministic rescue',
    (evalCase) => {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    },
  );
});
