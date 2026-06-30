import {
  CUSTOMER_GROWTH_LOOPS_CLASSIFIER_RULES,
  GROWTH_LOOPS_CUSTOMER_PROMPTS,
  MULTILINGUAL_GROWTH_LOOPS_EVAL_SCENARIOS,
} from './ai-growth-loops-customer.fixtures.js';
import { AI_COMMAND_EVAL_GROWTH_LOOPS_CUSTOMER_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import {
  detectGrowthLoopsCustomerAction,
  isGrowthLoopsCustomerPrompt,
  isReferAFriendPrompt,
  isShareSalonLinkPrompt,
  rescueGrowthLoopsCustomerIntent,
} from './ai-growth-loops-customer.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';

describe('ai-growth-loops-customer.util (ai-cmd-customer-4.0 P3)', () => {
  it('exports classifier rules for growth loops', () => {
    expect(CUSTOMER_GROWTH_LOOPS_CLASSIFIER_RULES).toContain('refer_a_friend');
    expect(CUSTOMER_GROWTH_LOOPS_CLASSIFIER_RULES).toContain('share_salon_link');
  });

  it.each(
    GROWTH_LOOPS_CUSTOMER_PROMPTS.map((row) => [row.id, row] as const),
  )('detects growth loops prompt $id', (_id, row) => {
    expect(detectGrowthLoopsCustomerAction(row.prompt)).toBe(row.expectedAction);
    expect(isGrowthLoopsCustomerPrompt(row.prompt)).toBe(true);
  });

  it.each(
    MULTILINGUAL_GROWTH_LOOPS_EVAL_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues multilingual growth loops scenario $id', (_id, row) => {
    expect(detectGrowthLoopsCustomerAction(row.prompt)).toBe(row.expectedAction);
  });

  it.each(
    GROWTH_LOOPS_CUSTOMER_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues growth loops prompt $id from unknown', (_id, row) => {
    const rescued = rescueGrowthLoopsCustomerIntent(row.prompt, 'unknown');
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
  });

  it('routes through consumer adoption rescue for refer and share salon', () => {
    expect(
      rescueConsumerAdoptionIntent('How do I refer a friend?', 'unknown')?.action,
    ).toBe('refer_a_friend');
    expect(
      rescueConsumerAdoptionIntent('Share this salon link', 'unknown')?.action,
    ).toBe('share_salon_link');
  });

  it('does not steal promo code help or booking share prompts', () => {
    expect(
      detectGrowthLoopsCustomerAction('How do promo codes work at checkout?'),
    ).toBeNull();
    expect(
      rescueMarketingGrowthIntent('How do promo codes work at checkout?', 'unknown')
        ?.action,
    ).toBe('promo_code_help');
    expect(detectGrowthLoopsCustomerAction('Share my booking')).toBeNull();
    expect(isReferAFriendPrompt('Share my referral link')).toBe(true);
    expect(isShareSalonLinkPrompt('Share my referral link')).toBe(false);
  });

  it('maps growth loops fixtures to passing eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_GROWTH_LOOPS_CUSTOMER_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
