import {
  META_PRODUCT_GUIDE_RESCUE_SCENARIOS,
  META_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS,
} from './ai-meta-product-guide.fixtures.js';
import {
  DASHBOARD_SUGGESTION_CHIP_GUIDE,
  META_GUIDE_TOPIC_BY_INTENT,
  PROVIDER_SUGGESTION_CHIP_GUIDE,
  isMetaProductGuideIntent,
  isProviderMetaGuideIntent,
  rescueMetaProductGuideIntent,
  resolveMetaGuideStepIndex,
  resolveMetaGuideTopicId,
  resolveSuggestionChipGuideTarget,
} from './ai-meta-product-guide.util.js';

describe('ai-meta-product-guide.util (ai-guide-1.8.7)', () => {
  it.each(META_PRODUCT_GUIDE_RESCUE_SCENARIOS)(
    'rescueMetaProductGuideIntent for $id',
    (scenario) => {
      const rescued = rescueMetaProductGuideIntent(
        scenario.samplePrompt,
        scenario.fromActions?.[0] ?? 'unknown',
        scenario.surface,
      );
      expect(rescued).toBe(scenario.intent);
    },
  );

  it.each(META_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS)(
    'maps $id to meta guide intent on $surface',
    ({ intent, surface }) => {
      expect(isMetaProductGuideIntent(intent)).toBe(true);
      if (surface === 'provider') {
        expect(isProviderMetaGuideIntent(intent)).toBe(true);
      }
      if (intent === 'explain_ai_settings') {
        expect(isProviderMetaGuideIntent(intent)).toBe(false);
      }
    },
  );

  it('maps dashboard suggestion chip ids to playbook steps', () => {
    expect(DASHBOARD_SUGGESTION_CHIP_GUIDE['apply-week']).toEqual({
      topicId: 'dashboard.core.schedule',
      stepIndex: 0,
    });
    expect(
      resolveMetaGuideTopicId('explain_ai_suggestions', 'dashboard', {
        suggestionId: 'fill-gaps',
      }),
    ).toBe('dashboard.core.schedule');
    expect(
      resolveMetaGuideStepIndex('explain_ai_suggestions', 'dashboard', {
        suggestionId: 'fill-gaps',
      }),
    ).toBe(2);
  });

  it('maps provider suggestion chip ids to playbook steps', () => {
    expect(PROVIDER_SUGGESTION_CHIP_GUIDE['unpaid-today']).toEqual({
      topicId: 'provider-appointments',
      stepIndex: 2,
    });
    expect(
      resolveSuggestionChipGuideTarget('provider', 'gaps-today')?.topicId,
    ).toBe('provider-schedule-blocks');
  });

  it('resolves approval topics per surface', () => {
    expect(
      resolveMetaGuideTopicId('explain_assistant_approval', 'dashboard', {}),
    ).toBe(META_GUIDE_TOPIC_BY_INTENT.explain_assistant_approval.dashboard);
    expect(
      resolveMetaGuideTopicId('explain_assistant_approval', 'provider', {}),
    ).toBe(META_GUIDE_TOPIC_BY_INTENT.explain_assistant_approval.provider);
  });

  it('is idempotent for meta guide intents', () => {
    for (const intent of [
      'explain_ai_settings',
      'explain_ai_suggestions',
      'explain_assistant_approval',
    ] as const) {
      expect(
        rescueMetaProductGuideIntent('help', intent, 'dashboard'),
      ).toBe(intent);
    }
  });
});
