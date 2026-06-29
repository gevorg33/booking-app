import {
  EMPTY_STATE_GUIDE_CLASSIFIER_SCENARIOS,
  EMPTY_STATE_GUIDE_RESCUE_SCENARIOS,
} from './ai-product-guide-empty-state.fixtures.js';
import {
  isEmptyStateGuideIntent,
  isEmptyStateGuideIntentOnSurface,
  parseEmptyStateGuideIntentFromPrompt,
  rescueEmptyStateGuideIntent,
} from './ai-product-guide-empty-state.util.js';

describe('ai-product-guide-empty-state.util (ai-guide-1.8.9)', () => {
  it.each(EMPTY_STATE_GUIDE_RESCUE_SCENARIOS)(
    'rescueEmptyStateGuideIntent maps $id',
    (scenario) => {
      expect(
        rescueEmptyStateGuideIntent(
          scenario.samplePrompt,
          scenario.fromActions?.[0] ?? 'unknown',
          scenario.surface,
        ),
      ).toBe(scenario.intent);
    },
  );

  it.each(EMPTY_STATE_GUIDE_CLASSIFIER_SCENARIOS)(
    'parseEmptyStateGuideIntentFromPrompt accepts $id',
    ({ intent, surface, prompt }) => {
      expect(parseEmptyStateGuideIntentFromPrompt(intent, prompt, surface)).toBe(true);
      expect(isEmptyStateGuideIntent(intent)).toBe(true);
      expect(isEmptyStateGuideIntentOnSurface(intent, surface)).toBe(true);
    },
  );

  it('does not expose explain_visibility_block on customer/public', () => {
    expect(
      isEmptyStateGuideIntentOnSurface('explain_visibility_block', 'customer'),
    ).toBe(false);
    expect(
      isEmptyStateGuideIntentOnSurface('explain_stripe_not_connected', 'dashboard'),
    ).toBe(true);
  });

  it('does not steal explain_why_stripe_required customer checkout prompts', () => {
    expect(
      rescueEmptyStateGuideIntent(
        'Why is Stripe checkout required for this booking?',
        'explain_why_stripe_required',
        'customer',
      ),
    ).toBe('explain_why_stripe_required');
  });
});
