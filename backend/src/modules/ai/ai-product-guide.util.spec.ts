import {
  APP_GUIDE_INTENT_BUCKET_SCENARIOS,
  PRODUCT_GUIDE_DISAMBIGUATION_SCENARIOS,
  PRODUCT_GUIDE_MISROUTE_SCENARIOS,
  PRODUCT_GUIDE_PROMPT_SCENARIOS,
  PRODUCT_GUIDE_TAXONOMY_SCENARIOS,
  SAMPLE_GUIDE_RESPONSE,
} from './ai-product-guide.fixtures.js';
import {
  buildGuideCommandResult,
  classifyPromptIntentBucket,
  getProductGuideIntentBucket,
  inferProductGuideIntentFromPrompt,
  isAppGuideIntent,
  isDomainExplainIntent,
  isGuideResponse,
  isProductGuidePrompt,
  isBulkMutateIntent,
  lookupProductGuideDisambiguationRow,
  mergeProductGuideParams,
  PRODUCT_GUIDE_BULK_MUTATE_ACTIONS,
  PRODUCT_GUIDE_DISAMBIGUATION_TABLE,
  PRODUCT_GUIDE_TAXONOMY_SUMMARY,
  rescueProductGuideMisroute,
  resolveProductGuideDisambiguation,
  resolveProductGuidePromptMatch,
  resolveProductGuideSessionContext,
} from './ai-product-guide.util.js';

describe('ai-product-guide.util (ai-guide-1.0.1)', () => {
  it('documents taxonomy summary for classifier appendix', () => {
    expect(PRODUCT_GUIDE_TAXONOMY_SUMMARY).toContain('guide_user_flow');
    expect(PRODUCT_GUIDE_TAXONOMY_SUMMARY).toContain('domain explain');
  });

  it.each(APP_GUIDE_INTENT_BUCKET_SCENARIOS)(
    'maps action $id to bucket $expectedBucket',
    ({ action, expectedBucket }) => {
      expect(getProductGuideIntentBucket(action)).toBe(expectedBucket);
    },
  );

  it('treats all APP_GUIDE_INTENTS as guide bucket', () => {
    expect(isAppGuideIntent('explain_app_feature')).toBe(true);
    expect(isAppGuideIntent('guide_user_flow')).toBe(true);
    expect(isAppGuideIntent('explain_current_screen')).toBe(true);
    expect(isAppGuideIntent('explain_checkout_tax')).toBe(false);
  });

  it('treats domain explain_* separately from app guide ids', () => {
    expect(isDomainExplainIntent('explain_checkout_tax')).toBe(true);
    expect(isDomainExplainIntent('explain_app_feature')).toBe(false);
    expect(isDomainExplainIntent('create_booking')).toBe(false);
  });

  it.each(PRODUCT_GUIDE_TAXONOMY_SCENARIOS)(
    'classifies prompt bucket for $id',
    ({ prompt, expectedBucket, classifiedAction }) => {
      expect(classifyPromptIntentBucket(prompt, { classifiedAction })).toBe(
        expectedBucket,
      );
    },
  );

  it.each(PRODUCT_GUIDE_DISAMBIGUATION_SCENARIOS)(
    'disambiguates misroutes for $id',
    ({ prompt, classifiedAction, expectedAction, expectedReason }) => {
      const resolved = resolveProductGuideDisambiguation(
        prompt,
        classifiedAction,
      );
      if (expectedAction === null) {
        expect(resolved).toBeNull();
        return;
      }
      expect(resolved).toEqual({
        action: expectedAction,
        rescueReason: expectedReason ?? expect.any(String),
      });
    },
  );

  it('exposes stable disambiguation table ids', () => {
    expect(PRODUCT_GUIDE_DISAMBIGUATION_TABLE.length).toBeGreaterThanOrEqual(7);
    expect(
      lookupProductGuideDisambiguationRow('nav-vs-configure-online-payment'),
    ).toMatchObject({
      preferredIntent: 'guide_user_flow',
    });
  });

  it('prefers domain explain when tax topic lacks navigation cue', () => {
    expect(
      classifyPromptIntentBucket('Why is there VAT on my checkout total?'),
    ).toBe('domain_explain');
    expect(
      resolveProductGuideDisambiguation(
        'Why is there VAT on my checkout total?',
        'configure_service_online_payment',
      ),
    ).toBeNull();
  });
});

describe('ai-product-guide.util (ai-guide-1.0.2 pipe-1.2)', () => {
  it.each(PRODUCT_GUIDE_PROMPT_SCENARIOS)(
    'isProductGuidePrompt for $id',
    ({ prompt, surface, expectedMatch, expectedIntent, expectedCue }) => {
      expect(isProductGuidePrompt(prompt, { surface })).toBe(expectedMatch);
      const match = resolveProductGuidePromptMatch(prompt, { surface });
      expect(match.matched).toBe(expectedMatch);
      if (expectedMatch) {
        expect(match.intent).toBe(expectedIntent);
        expect(match.cue).toBe(expectedCue);
        expect(inferProductGuideIntentFromPrompt(prompt)).toBe(expectedIntent);
      }
    },
  );
});

describe('ai-product-guide.util (ai-guide-1.0.4 GuideResponse)', () => {
  it('validates GuideResponse shape', () => {
    expect(isGuideResponse(SAMPLE_GUIDE_RESPONSE)).toBe(true);
    expect(isGuideResponse({ summary: 'x', steps: [] })).toBe(true);
    expect(isGuideResponse({ summary: 'x', steps: [{ title: 'a' }] })).toBe(
      false,
    );
  });

  it('buildGuideCommandResult attaches guide payload', () => {
    const result = buildGuideCommandResult(
      'guide_user_flow',
      SAMPLE_GUIDE_RESPONSE,
    );
    expect(result.guide).toEqual(SAMPLE_GUIDE_RESPONSE);
    expect(result.summary).toBe(SAMPLE_GUIDE_RESPONSE.summary);
    expect(result.action).toBe('guide_user_flow');
  });

  it('resolveProductGuideSessionContext reads dashboard page context', () => {
    expect(
      resolveProductGuideSessionContext(
        {
          context: {
            route: '/dashboard/calendar',
            locale: 'ru',
            _accessTier: 'owner',
          },
        },
        'dashboard',
      ),
    ).toEqual({
      route: '/dashboard/calendar',
      locale: 'ru',
      vertical: undefined,
      businessType: undefined,
      role: 'owner',
      roleProfile: 'owner',
      retailPosEnabled: undefined,
      enabledModules: undefined,
      planTierId: 'solo',
      mobileRoute: undefined,
      screenTab: undefined,
      surface: 'dashboard',
    });
  });

  it('mergeProductGuideParams injects guideTopicId from session context', () => {
    expect(
      mergeProductGuideParams(
        { employee: 'Anna' },
        { context: { guideTopicId: 'dashboard.core.schedule' } },
      ),
    ).toEqual({
      employee: 'Anna',
      topicId: 'dashboard.core.schedule',
    });
    expect(
      mergeProductGuideParams(
        { topicId: 'dashboard.ai.ops' },
        { context: { guideTopicId: 'dashboard.core.schedule' } },
      ),
    ).toEqual({ topicId: 'dashboard.ai.ops' });
  });
});

describe('ai-product-guide.util (ai-guide-1.0.5 misroute guard)', () => {
  it('tracks bulk mutate actions aligned with swipe-confirm set', () => {
    expect(PRODUCT_GUIDE_BULK_MUTATE_ACTIONS).toContain('cancel_bookings');
    expect(PRODUCT_GUIDE_BULK_MUTATE_ACTIONS).toContain('payment_sweep');
    expect(isBulkMutateIntent('cancel_bookings')).toBe(true);
    expect(isBulkMutateIntent('list_services')).toBe(false);
  });

  it.each(PRODUCT_GUIDE_MISROUTE_SCENARIOS)(
    'rescueProductGuideMisroute for $id',
    ({ prompt, classifiedAction, surface, expectedAction, expectedReason }) => {
      const resolved = rescueProductGuideMisroute(prompt, classifiedAction, {
        surface,
      });
      if (expectedAction === null) {
        expect(resolved).toBeNull();
        return;
      }
      expect(resolved).toEqual({
        action: expectedAction,
        rescueReason: expectedReason ?? expect.any(String),
      });
    },
  );

  it('ai-guide-1.0.3 — skips misroute rescue in act mode', () => {
    expect(
      rescueProductGuideMisroute(
        'Help me with this page — how do I clear the schedule?',
        'clear_schedule',
        { surface: 'dashboard', assistantMode: 'act' },
      ),
    ).toBeNull();
  });

  it('ai-guide-1.0.3 — forces guide rescue in guide mode', () => {
    expect(
      rescueProductGuideMisroute(
        'How many appointments today?',
        'summarize_bookings',
        {
          surface: 'dashboard',
          assistantMode: 'guide',
        },
      ),
    ).toMatchObject({
      action: 'guide_user_flow',
      rescueReason: 'assistant_mode_guide',
    });
  });
});
