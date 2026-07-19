import {
  EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS,
  EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_RESCUE_SCENARIOS,
} from './ai-explain-subscription-vs-one-time.fixtures.js';
import { EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS } from './ai-explain-subscription-vs-one-time-multilingual.fixtures.js';
import { isExplainMySubscriptionPrompt } from './ai-explain-my-subscription.util.js';
import { isDiscoverSubscriptionPlansPrompt } from './ai-customer-crm.util.js';
import {
  isSelectSubscriptionPlanPrompt,
  isUseSubscriptionCreditPrompt,
} from './ai-self-service-booking.util.js';
import {
  detectExplainSubscriptionVsOneTimeAction,
  enrichExplainSubscriptionVsOneTimeParamsFromPrompt,
  inferExplainSubscriptionVsOneTimeFocus,
  isExplainSubscriptionVsOneTimeIntent,
  isExplainSubscriptionVsOneTimePrompt,
  parseExplainSubscriptionVsOneTimeFromPrompt,
  rescueExplainSubscriptionVsOneTimeIntent,
} from './ai-explain-subscription-vs-one-time.util.js';

describe('ai-explain-subscription-vs-one-time.util (ai-cmd-customer-4.16.3)', () => {
  it.each(EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS)(
    'detects explain prompt $id',
    ({ prompt }) => {
      expect(isExplainSubscriptionVsOneTimePrompt(prompt)).toBe(true);
      expect(
        parseExplainSubscriptionVsOneTimeFromPrompt(prompt),
      ).not.toBeNull();
    },
  );

  it.each(EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS)(
    'detects multilingual explain prompt $id',
    ({ prompt }) => {
      expect(isExplainSubscriptionVsOneTimePrompt(prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_RESCUE_SCENARIOS)(
    'rescues $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainSubscriptionVsOneTimeIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: 'explain_subscription_vs_one_time',
        rescueReason: 'subscription_vs_one_time',
      });
    },
  );

  it('does not steal explain my subscription account prompts', () => {
    const prompt = 'How many visits are left on my plan?';
    expect(isExplainSubscriptionVsOneTimePrompt(prompt)).toBe(false);
    expect(isExplainMySubscriptionPrompt(prompt)).toBe(true);
  });

  it('does not steal discover subscription plans list prompts', () => {
    const prompt = 'Show available subscription plans';
    expect(isExplainSubscriptionVsOneTimePrompt(prompt)).toBe(false);
    expect(isDiscoverSubscriptionPlansPrompt(prompt)).toBe(true);
  });

  it('does not steal select subscription plan mutate prompts', () => {
    const prompt = 'Select monthly subscription plan';
    expect(isExplainSubscriptionVsOneTimePrompt(prompt)).toBe(false);
    expect(isSelectSubscriptionPlanPrompt(prompt)).toBe(true);
  });

  it('does not steal bare use subscription credit mutate prompts', () => {
    // Avoid first-visit book cues (today/service) — those are subscription_first_visit.
    const prompt = 'Use my subscription credit at checkout';
    expect(isExplainSubscriptionVsOneTimePrompt(prompt)).toBe(false);
    expect(isUseSubscriptionCreditPrompt(prompt)).toBe(true);
  });

  it('enriches serviceName from prompt', () => {
    expect(
      enrichExplainSubscriptionVsOneTimeParamsFromPrompt(
        {},
        'Which plan includes massage?',
      ).serviceName,
    ).toBe('massage');
  });

  it('detects intent helpers', () => {
    expect(
      isExplainSubscriptionVsOneTimeIntent('explain_subscription_vs_one_time'),
    ).toBe(true);
    expect(isExplainSubscriptionVsOneTimeIntent('book_package')).toBe(false);
    expect(
      detectExplainSubscriptionVsOneTimeAction(
        'Subscribe and save vs one visit?',
      ),
    ).toBe('explain_subscription_vs_one_time');
    expect(
      rescueExplainSubscriptionVsOneTimeIntent('List services', 'unknown'),
    ).toBeNull();
    expect(
      rescueExplainSubscriptionVsOneTimeIntent(
        'Subscribe and save vs one visit?',
        'explain_subscription_vs_one_time',
      ),
    ).toBeNull();
  });

  it('infers focus variants', () => {
    expect(
      inferExplainSubscriptionVsOneTimeFocus(
        'Use my subscription or pay once at checkout?',
      ),
    ).toBe('useExisting');
    expect(
      inferExplainSubscriptionVsOneTimeFocus('Which plan includes massage?'),
    ).toBe('whichPlan');
    expect(
      inferExplainSubscriptionVsOneTimeFocus(
        'Explain checkout subscription options',
      ),
    ).toBe('options');
    expect(
      inferExplainSubscriptionVsOneTimeFocus(
        'Subscribe and save vs one visit?',
      ),
    ).toBe('compare');
  });

  it('parses planName from params', () => {
    expect(
      parseExplainSubscriptionVsOneTimeFromPrompt(
        'Subscribe and save vs one visit?',
        {
          planName: 'Monthly Massage',
        },
      )?.planName,
    ).toBe('Monthly Massage');
  });

  it('infers HY/RU focus branches', () => {
    expect(
      inferExplainSubscriptionVsOneTimeFocus(
        'Օգտագործե՞լ իմ բաժանորդագրությունը թե մեկանգամյա վճարել',
      ),
    ).toBe('useExisting');
    expect(
      inferExplainSubscriptionVsOneTimeFocus('Какой план включает массаж?'),
    ).toBe('whichPlan');
    expect(
      inferExplainSubscriptionVsOneTimeFocus('Use my subscription or pay once'),
    ).toBe('useExisting');
    expect(
      inferExplainSubscriptionVsOneTimeFocus('Which plan covers facials?'),
    ).toBe('whichPlan');
    expect(
      inferExplainSubscriptionVsOneTimeFocus(
        'How do I choose checkout one-time or subscribe?',
      ),
    ).toBe('options');
  });
});
