import { EN_CONSUMER_CHECKOUT_SUCCESS_EVAL_SCENARIOS } from './ai-consumer-checkout-success-en.fixtures.js';
import {
  isExplainConsumerCheckoutSuccessPrompt,
  parseExplainConsumerCheckoutSuccessFromPrompt,
  rescueExplainConsumerCheckoutSuccessIntent,
} from './ai-consumer-checkout-success.util.js';
import { AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_EN_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-consumer-checkout-success-en (ai-cmd-rec-7)', () => {
  it.each(EN_CONSUMER_CHECKOUT_SUCCESS_EVAL_SCENARIOS)(
    'detects EN consumer success/dismiss prompt $id',
    ({ prompt, aspect }) => {
      expect(isExplainConsumerCheckoutSuccessPrompt(prompt)).toBe(true);
      expect(parseExplainConsumerCheckoutSuccessFromPrompt(prompt)?.aspect).toBe(
        aspect,
      );
      expect(rescueExplainConsumerCheckoutSuccessIntent(prompt, 'unknown')).toEqual(
        {
          action: 'explain_consumer_checkout_success',
          rescueReason: 'explain_consumer_checkout_success',
        },
      );
    },
  );

  it('does not treat bare dismiss imperative as explain', () => {
    expect(isExplainConsumerCheckoutSuccessPrompt('Dismiss recommendations')).toBe(
      false,
    );
  });

  it('passes deterministic EN eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_EN_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
