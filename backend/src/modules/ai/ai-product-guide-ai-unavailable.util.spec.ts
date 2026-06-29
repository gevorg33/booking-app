import type { AiProductGuideService } from './ai-product-guide.service.js';
import { AI_UNAVAILABLE_GUIDE_SCENARIOS } from './ai-product-guide-ai-unavailable.fixtures.js';
import {
  buildAiUnavailableBannerSummary,
  resolveNativeGuideNavigateTarget,
  runAiUnavailableStaticGuideFallback,
  shouldOfferAiUnavailableGuideFallback,
} from './ai-product-guide-ai-unavailable.util.js';

function createProductGuideStub(): AiProductGuideService {
  return {
    handleExplainAppFeature: jest.fn(),
    handleExplainAppFeatureAsync: jest.fn(async () => ({
      success: true,
      action: 'explain_app_feature',
      summary: 'Offline assistant guide.',
      guide: {
        topicId: 'provider-assistant',
        summary: 'Offline assistant guide.',
        steps: [{ title: 'Step 1', body: 'Open Help & guide → AI assistant.' }],
      },
      details: { deterministic: true },
    })),
    handleExplainCurrentScreen: jest.fn(),
    handleExplainCurrentScreenAsync: jest.fn(async () => ({
      success: true,
      action: 'explain_current_screen',
      summary: 'Offline screen guide.',
      guide: {
        topicId: 'dashboard.core.calendar',
        summary: 'Offline screen guide.',
        steps: [{ title: 'Step 1', body: 'Use the calendar toolbar.' }],
      },
      details: { deterministic: true },
    })),
    handleGuideUserFlow: jest.fn(),
    handleGuideUserFlowAsync: jest.fn(async () => ({
      success: true,
      action: 'guide_user_flow',
      summary: 'Offline schedule guide.',
      guide: {
        topicId: 'dashboard.core.schedule',
        summary: 'Offline schedule guide.',
        steps: [{ title: 'Step 1', body: 'Open Schedule in the sidebar.' }],
      },
      details: { deterministic: true },
    })),
  } as unknown as AiProductGuideService;
}

describe('ai-product-guide-ai-unavailable.util (ai-guide-1.8.10)', () => {
  it.each(AI_UNAVAILABLE_GUIDE_SCENARIOS.filter((row) => row.expectGuide))(
    'runAiUnavailableStaticGuideFallback returns native guide for $id',
    async (scenario) => {
      const result = await runAiUnavailableStaticGuideFallback({
        productGuide: createProductGuideStub(),
        businessId: 'biz-1',
        prompt: scenario.prompt,
        surface: scenario.surface,
        reason: scenario.reason,
        session: {
          context: {
            route: scenario.route,
            assistantMode: scenario.assistantMode,
          },
        },
        locale: 'en',
      });

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.guide?.steps.length).toBeGreaterThan(0);
      expect(result?.details?.pipeMarker).toBe('ai-guide-1.8.10');
      expect(result?.details?.aiUnavailableFallback).toBe(true);
      if (scenario.expectNativeNavigate) {
        expect(result?.guide?.navigate).toBeTruthy();
      }
    },
  );

  it('shouldOfferAiUnavailableGuideFallback rejects act-mode booking prompts', () => {
    expect(
      shouldOfferAiUnavailableGuideFallback('Book Anna tomorrow at 3pm', 'dashboard', {
        context: { assistantMode: 'act' },
      }),
    ).toBe(false);
  });

  it('resolveNativeGuideNavigateTarget maps dashboard topic to /dashboard/guide#anchor', () => {
    expect(
      resolveNativeGuideNavigateTarget('dashboard', 'dashboard.core.schedule').path,
    ).toContain('/dashboard/guide');
  });

  it('resolveNativeGuideNavigateTarget maps provider to mobile guide path', () => {
    expect(resolveNativeGuideNavigateTarget('provider', 'provider-assistant')).toEqual({
      path: 'guide',
      query: { topicId: 'provider-assistant' },
    });
  });

  it.each(AI_UNAVAILABLE_GUIDE_SCENARIOS.filter((row) => !row.expectGuide))(
    'runAiUnavailableStaticGuideFallback returns null for $id',
    async (scenario) => {
      const result = await runAiUnavailableStaticGuideFallback({
        productGuide: createProductGuideStub(),
        businessId: 'biz-1',
        prompt: scenario.prompt,
        surface: scenario.surface,
        reason: scenario.reason,
        session: {
          context: {
            route: scenario.route,
            assistantMode: scenario.assistantMode,
          },
        },
        locale: 'en',
      });
      expect(result).toBeNull();
    },
  );

  it('appends provider offline suggestion cache step (5.24.1)', async () => {
    const result = await runAiUnavailableStaticGuideFallback({
      productGuide: createProductGuideStub(),
      businessId: 'biz-1',
      prompt: 'What are the Today tab suggestion cards?',
      surface: 'provider',
      reason: 'openai_not_configured',
      session: { context: { route: '/tabs/today' } },
      locale: 'en',
    });
    expect(result?.guide?.steps.some((step) => step.title === 'Offline suggestion cache')).toBe(
      true,
    );
    expect(result?.guide?.steps.some((step) => step.navigate?.query?.topicId === 'provider-assistant')).toBe(
      true,
    );
  });

  it('buildAiUnavailableBannerSummary covers quota reason', () => {
    expect(buildAiUnavailableBannerSummary('quota_exceeded', 'en')).toContain('quota');
  });
});
