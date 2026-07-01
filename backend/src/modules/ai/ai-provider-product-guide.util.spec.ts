import {
  PROVIDER_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS,
  PROVIDER_PRODUCT_GUIDE_RESCUE_SCENARIOS,
} from './ai-provider-product-guide.fixtures.js';
import {
  isProviderProductGuideIntent,
  rescueProviderProductGuideIntent,
  resolveProviderProductGuideAppIntent,
  resolveProviderProductGuideTopicId,
} from './ai-provider-product-guide.util.js';

describe('ai-provider-product-guide.util (ai-guide-1.4.1)', () => {
  it.each(PROVIDER_PRODUCT_GUIDE_RESCUE_SCENARIOS)(
    'rescueProviderProductGuideIntent for $id',
    ({ samplePrompt, intent, fromActions }) => {
      const source = fromActions?.[0] ?? 'unknown';
      expect(rescueProviderProductGuideIntent(samplePrompt, source)).toBe(
        intent,
      );
    },
  );

  it.each(PROVIDER_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS)(
    'maps $id to playbook topicId',
    ({ intent, prompt }) => {
      expect(isProviderProductGuideIntent(intent)).toBe(true);
      expect(resolveProviderProductGuideTopicId(intent)).toMatch(/^provider-/);
      expect(rescueProviderProductGuideIntent(prompt, 'unknown')).toBe(intent);
      expect(resolveProviderProductGuideAppIntent(intent)).toMatch(
        /explain_app_feature|guide_user_flow/,
      );
    },
  );

  it('does not rescue operational show_appointments prompts', () => {
    expect(
      rescueProviderProductGuideIntent('Show my appointments today', 'unknown'),
    ).toBe('unknown');
  });

  it('preserves already-classified provider guide intents', () => {
    expect(
      rescueProviderProductGuideIntent('anything', 'explain_staff_invite'),
    ).toBe('explain_staff_invite');
  });
});
