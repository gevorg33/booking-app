import {
  CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS,
  CONSUMER_CHECKOUT_SUCCESS_EN_SCENARIO_IDS,
} from './ai-consumer-checkout-success-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CASES,
  consumerCheckoutSuccessMultilingualEvalCaseId,
  listConsumerCheckoutSuccessEvalLocaleParityGaps,
} from './ai-consumer-checkout-success-multilingual.eval.util.js';
import {
  isExplainConsumerCheckoutSuccessPrompt,
  parseExplainConsumerCheckoutSuccessFromPrompt,
  rescueExplainConsumerCheckoutSuccessIntent,
} from './ai-consumer-checkout-success.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { listConsumerCheckoutSuccessDeferredLocaleParityGaps } from './ai-customer-deferred-locale-parity.util.js';

describe('ai-consumer-checkout-success-multilingual (ai-cmd-customer-4.3.5)', () => {
  it('covers HY/RU for every EN checkout-success scenario', () => {
    expect(listConsumerCheckoutSuccessDeferredLocaleParityGaps()).toEqual([]);
  });

  it('registers eval cases for every multilingual scenario', () => {
    expect(
      listConsumerCheckoutSuccessEvalLocaleParityGaps(
        AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CASES,
      ),
    ).toEqual([]);
    expect(CONSUMER_CHECKOUT_SUCCESS_EN_SCENARIO_IDS.length).toBe(30);
    expect(CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS.length).toBe(60);
  });

  it('reports missing eval parity gaps when cases are absent', () => {
    const gaps = listConsumerCheckoutSuccessEvalLocaleParityGaps([]);
    expect(gaps.length).toBe(60);
    expect(gaps[0]).toContain('missing eval case');
  });

  it.each(CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS)(
    'detects HY/RU prompt $id',
    (scenario) => {
      expect(isExplainConsumerCheckoutSuccessPrompt(scenario.prompt)).toBe(
        true,
      );
      expect(
        parseExplainConsumerCheckoutSuccessFromPrompt(scenario.prompt),
      ).toEqual({ aspect: scenario.aspect });
      expect(
        rescueExplainConsumerCheckoutSuccessIntent(scenario.prompt, 'unknown'),
      ).toEqual({
        action: 'explain_consumer_checkout_success',
        rescueReason: 'explain_consumer_checkout_success',
      });
    },
  );

  it('passes deterministic HY/RU eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
      expect(evalCase.surface).toBe('customer');
      expect(evalCase.expect.needsMultilingual).toBe(true);
      expect(evalCase.id).toBe(
        consumerCheckoutSuccessMultilingualEvalCaseId(
          CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS.find(
            (row) =>
              consumerCheckoutSuccessMultilingualEvalCaseId(row) ===
              evalCase.id,
          )!,
        ),
      );
    }
  });
});
