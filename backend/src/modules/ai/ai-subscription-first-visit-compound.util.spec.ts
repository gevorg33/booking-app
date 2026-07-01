import {
  SUBSCRIPTION_FIRST_VISIT_COMPOUND_PROMPTS,
  SUBSCRIPTION_FIRST_VISIT_NEGATIVE_PROMPTS,
  SUBSCRIPTION_FIRST_VISIT_RESCUE_SCENARIOS,
} from './ai-subscription-first-visit-compound.fixtures.js';
import { SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_SCENARIOS } from './ai-subscription-first-visit-compound-multilingual.fixtures.js';
import {
  buildSubscriptionFirstVisitCompoundParams,
  decomposeSubscriptionFirstVisitCompoundPrompt,
  isSubscriptionFirstVisitCompoundPrompt,
  rescueSubscriptionFirstVisitCompoundIntent,
} from './ai-subscription-first-visit-compound.util.js';
import { isExplainMySubscriptionPrompt } from './ai-explain-my-subscription.util.js';
import { isUseSubscriptionCreditPrompt } from './ai-self-service-booking.util.js';

describe('ai-subscription-first-visit-compound.util (ai-cmd-customer-4.21.4)', () => {
  it.each(SUBSCRIPTION_FIRST_VISIT_COMPOUND_PROMPTS)(
    'isSubscriptionFirstVisitCompoundPrompt customer $id',
    ({ prompt }) => {
      expect(isSubscriptionFirstVisitCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(SUBSCRIPTION_FIRST_VISIT_COMPOUND_PROMPTS)(
    'decomposeSubscriptionFirstVisitCompoundPrompt $id',
    ({ prompt, orderedActions, serviceName, date }) => {
      const steps = decomposeSubscriptionFirstVisitCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(2);
      expect(steps[0].params.focus).toBe('overview');
      expect(steps[0].params.subscriptionFirstVisit).toBe(true);
      expect(steps[1].params.continueAfterSubscriptionExplain).toBe(true);
      expect(steps[1].params.paymentMethod).toBe('subscription_credit');
      if (serviceName) {
        expect(steps[1].params.serviceName).toBe(serviceName);
      }
      if (date) {
        expect(steps[1].params.date).toBeTruthy();
      }
    },
  );

  it.each(SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_SCENARIOS)(
    'decomposeSubscriptionFirstVisitCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeSubscriptionFirstVisitCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(SUBSCRIPTION_FIRST_VISIT_RESCUE_SCENARIOS)(
    'rescueSubscriptionFirstVisitCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueSubscriptionFirstVisitCompoundIntent(
          prompt,
          misclassifiedAction!,
        ),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'subscription_first_visit_compound',
      });
    },
  );

  it.each(SUBSCRIPTION_FIRST_VISIT_NEGATIVE_PROMPTS)(
    'does not match negative prompt $id',
    ({ prompt }) => {
      expect(isSubscriptionFirstVisitCompoundPrompt(prompt)).toBe(false);
      expect(decomposeSubscriptionFirstVisitCompoundPrompt(prompt)).toEqual([]);
    },
  );

  it('credit-only prompt stays on use_subscription_credit', () => {
    const prompt = 'Use subscription credit';
    expect(isSubscriptionFirstVisitCompoundPrompt(prompt)).toBe(false);
    expect(isUseSubscriptionCreditPrompt(prompt)).toBe(true);
  });

  it('explain-only prompt stays on explain_my_subscription', () => {
    const prompt = 'How many visits left on my plan?';
    expect(isSubscriptionFirstVisitCompoundPrompt(prompt)).toBe(false);
    expect(isExplainMySubscriptionPrompt(prompt)).toBe(true);
  });

  it('buildSubscriptionFirstVisitCompoundParams extracts service name', () => {
    const params = buildSubscriptionFirstVisitCompoundParams(
      "Use my membership for today's massage",
    );
    expect(params.serviceName).toBe('massage');
    expect(params.paymentMethod).toBe('subscription_credit');
    expect(params.subscriptionFirstVisit).toBe(true);
  });

  it('rescueSubscriptionFirstVisitCompoundIntent returns null for non-compound', () => {
    expect(
      rescueSubscriptionFirstVisitCompoundIntent(
        'Use subscription credit',
        'use_subscription_credit',
      ),
    ).toBeNull();
    expect(
      rescueSubscriptionFirstVisitCompoundIntent(
        "Use my membership for today's massage",
        'compound_intent',
      ),
    ).toBeNull();
  });

  it('rejects prompts shorter than compound minimum', () => {
    expect(isSubscriptionFirstVisitCompoundPrompt('use my plan')).toBe(false);
  });

  it('rejects membership phrasing without a book cue', () => {
    expect(
      isSubscriptionFirstVisitCompoundPrompt('Use my membership only'),
    ).toBe(false);
  });

  it('detects heuristic membership booking without fixture id', () => {
    const prompt = 'Apply my monthly plan for a haircut tomorrow';
    expect(isSubscriptionFirstVisitCompoundPrompt(prompt)).toBe(true);
    const steps = decomposeSubscriptionFirstVisitCompoundPrompt(prompt);
    expect(steps.map((step) => step.action)).toEqual([
      'explain_my_subscription',
      'use_subscription_credit',
    ]);
  });
});
