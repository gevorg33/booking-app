import {
  PRODUCT_GUIDE_HANDLER_SCENARIOS,
  PRODUCT_GUIDE_HANDOFF_SCENARIOS,
} from './ai-product-guide.fixtures.js';
import {
  buildGuideResponseFromCorpus,
  handleExplainAppFeatureLogic,
  handleExplainCurrentScreenLogic,
  handleGuideUserFlowLogic,
  handleProductGuideIntentLogic,
} from './ai-product-guide.logic.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import {
  getGuideCorpusTopic,
  resolveGuideCorpusTopic,
} from './guide/ai-guide-corpus.util.js';
import { isGuideResponse } from './ai-product-guide.util.js';

describe('ai-product-guide.logic (ai-guide-1.2.3)', () => {
  it.each(PRODUCT_GUIDE_HANDLER_SCENARIOS)(
    'returns deterministic guide for $id',
    ({ intent, prompt, route, topicId, expectedTopicId, minSteps = 1 }) => {
      const handler =
        intent === 'explain_app_feature'
          ? handleExplainAppFeatureLogic
          : intent === 'explain_current_screen'
            ? handleExplainCurrentScreenLogic
            : handleGuideUserFlowLogic;

      const result = handler({
        businessId: 'biz-1',
        prompt,
        route,
        params: topicId ? { topicId } : undefined,
        locale: 'en',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe(intent);
      expect(isGuideResponse(result.guide)).toBe(true);
      expect(result.guide?.topicId).toBe(expectedTopicId);
      expect(result.guide?.steps.length).toBeGreaterThanOrEqual(minSteps);
      expect(result.details.deterministic).toBe(true);
      expect(result.details.confidence).toBeGreaterThanOrEqual(0.55);
    },
  );

  it('clarifies when corpus match confidence is below threshold', () => {
    const result = handleProductGuideIntentLogic('guide_user_flow', {
      businessId: 'biz-1',
      prompt: 'xyzzy',
      locale: 'en',
    });
    expect(result.success).toBe(false);
    expect(result.details.clarify).toBe(true);
  });

  it('builds navigate targets from corpus topics', () => {
    const messages = getFrontendGuideCorpusMessages('en');
    const topic = getGuideCorpusTopic('dashboard.core.schedule');
    const resolved = resolveGuideCorpusTopic('dashboard.core.schedule', messages);
    expect(topic).toBeTruthy();
    expect(resolved).toBeTruthy();
    const guide = buildGuideResponseFromCorpus(resolved!, topic!);
    expect(guide.navigate?.path).toBe('/dashboard/schedule');
    expect(guide.sources?.[0]?.topicId).toBe('dashboard.core.schedule');
  });

  it.each(PRODUCT_GUIDE_HANDOFF_SCENARIOS)(
    'ai-guide-1.2.5 — attaches Do-this-for-me handoff for $id',
    ({ prompt, expectedAction, expectedTopicId }) => {
      const result = handleGuideUserFlowLogic({
        businessId: 'biz-1',
        prompt,
        locale: 'en',
        params: { topicId: expectedTopicId },
      });
      expect(result.success).toBe(true);
      expect(result.guide?.relatedActions?.some((row) => row.action === expectedAction)).toBe(
        true,
      );
    },
  );

  it('ai-guide-1.7.1 — attaches optional help-center / Zendesk article refs', () => {
    const result = handleGuideUserFlowLogic({
      businessId: 'biz-1',
      prompt: 'How do I set up weekly schedule templates?',
      route: '/dashboard/schedule',
      locale: 'en',
      params: { topicId: 'dashboard.core.schedule' },
    });
    expect(result.success).toBe(true);
    expect(result.guide?.helpArticle).toEqual({
      helpCenterTopicId: 'schedule',
      zendeskArticleId: '360010001',
    });
  });

  it('ai-guide-1.7.2 — attaches Still stuck? support handoff snapshot (no PII)', () => {
    const result = handleGuideUserFlowLogic({
      businessId: 'biz-1',
      prompt: 'How do I set up weekly schedule templates for Anna?',
      route: '/dashboard/schedule',
      locale: 'en',
      surface: 'dashboard',
      params: { topicId: 'dashboard.core.schedule' },
    });
    expect(result.success).toBe(true);
    expect(result.guide?.supportHandoff).toEqual({
      action: 'create_support_ticket',
      label: 'Still stuck?',
      snapshot: {
        surface: 'dashboard',
        route: '/dashboard/schedule',
        topicId: 'dashboard.core.schedule',
        locale: 'en',
      },
      ticket: {
        subject: 'Product guide help — dashboard.core.schedule (dashboard)',
        body: expect.stringContaining('Product guide support handoff (no PII)'),
        tags: expect.arrayContaining([
          'product-guide',
          'guide-dashboard',
          'guide-topic-dashboard.core.schedule',
        ]),
      },
    });
    expect(result.guide?.supportHandoff?.ticket.body).not.toContain('Anna');
  });

  it('ai-guide-1.7.3 — records topic opened telemetry on successful guide', () => {
    const recordTopicOpened = jest.fn();
    const recordGroundingFailure = jest.fn();
    const result = handleGuideUserFlowLogic({
      businessId: 'biz-1',
      prompt: 'How do I set up weekly schedule templates?',
      route: '/dashboard/schedule',
      locale: 'en',
      surface: 'dashboard',
      params: { topicId: 'dashboard.core.schedule' },
      telemetry: { recordTopicOpened, recordGroundingFailure },
    });
    expect(result.success).toBe(true);
    expect(recordTopicOpened).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        topicId: 'dashboard.core.schedule',
        totalSteps: result.guide?.steps.length,
      }),
    );
    expect(recordGroundingFailure).not.toHaveBeenCalled();
  });
});
