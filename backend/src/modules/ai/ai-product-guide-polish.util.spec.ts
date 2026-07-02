import { PRODUCT_GUIDE_POLISH_SCENARIOS } from './ai-product-guide.fixtures.js';
import {
  buildGuidePolishUserPrompt,
  mergePolishedGuideResponse,
  polishGuideResponseWithLlm,
} from './ai-product-guide-polish.util.js';
import type { GuideResponse } from './command-completion.types.js';

describe('ai-product-guide-polish.util (ai-guide-1.2.3)', () => {
  function buildBaseGuide(stepCount: number, summary: string): GuideResponse {
    return {
      topicId: 'dashboard.core.schedule',
      summary,
      steps: Array.from({ length: stepCount }, (_, index) => ({
        title: `Step ${index + 1}`,
        body: `Corpus body ${index + 1}`,
        navigate: index === 0 ? { path: '/dashboard/schedule' } : undefined,
      })),
      navigate: { path: '/dashboard/schedule' },
      sources: [{ topicId: 'dashboard.core.schedule', kind: 'topic' }],
    };
  }

  it.each(PRODUCT_GUIDE_POLISH_SCENARIOS)(
    '$id — mergePolishedGuideResponse preserves navigates and topicId',
    ({ baseSummary, polishedSummary, stepCount }) => {
      const base = buildBaseGuide(stepCount, baseSummary);
      const merged = mergePolishedGuideResponse(base, {
        summary: polishedSummary,
        steps: base.steps.map((step, index) => ({
          title: `Polished ${index + 1}`,
          body: `Polished body ${index + 1}`,
        })),
      });

      expect(merged.summary).toBe(polishedSummary);
      expect(merged.topicId).toBe(base.topicId);
      expect(merged.navigate).toEqual(base.navigate);
      expect(merged.steps[0].navigate).toEqual(base.steps[0].navigate);
      expect(merged.steps.length).toBe(stepCount);
    },
  );

  it('buildGuidePolishUserPrompt includes corpus topic and steps', () => {
    const base = buildBaseGuide(2, 'Original summary');
    const prompt = buildGuidePolishUserPrompt({
      businessId: 'biz-1',
      prompt: 'How do I set up weekly templates?',
      intent: 'guide_user_flow',
      locale: 'en',
      baseGuide: base,
      corpusTitle: 'Schedule templates',
      matchConfidence: 0.7,
    });
    expect(prompt).toContain('Schedule templates');
    expect(prompt).toContain('dashboard.core.schedule');
    expect(prompt).toContain('Original summary');
  });

  it('polishGuideResponseWithLlm falls back when LLM unavailable', async () => {
    const base = buildBaseGuide(2, 'Original summary');
    const result = await polishGuideResponseWithLlm(
      {
        businessId: 'biz-1',
        prompt: 'How do I set up weekly templates?',
        intent: 'guide_user_flow',
        locale: 'en',
        baseGuide: base,
        corpusTitle: 'Schedule templates',
        matchConfidence: 0.7,
      },
      {
        isAvailableForBusiness: async () => false,
        completeJson: async () => null,
      },
    );
    expect(result.polished).toBe(false);
    expect(result.guide).toBe(base);
  });

  it('polishGuideResponseWithLlm applies grounded LLM copy', async () => {
    const base = buildBaseGuide(2, 'Original summary');
    const result = await polishGuideResponseWithLlm(
      {
        businessId: 'biz-1',
        prompt: 'How do I set up weekly templates?',
        intent: 'guide_user_flow',
        locale: 'en',
        baseGuide: base,
        corpusTitle: 'Schedule templates',
        matchConfidence: 0.7,
      },
      {
        isAvailableForBusiness: async () => true,
        completeJson: async () => ({
          summary: 'Polished summary for weekly templates.',
          steps: [
            { title: 'Open schedule', body: 'Go to Schedule in the sidebar.' },
            { title: 'Add template', body: 'Create a weekly template row.' },
          ],
        }),
      },
    );
    expect(result.polished).toBe(true);
    expect(result.guide.summary).toBe('Polished summary for weekly templates.');
    expect(result.guide.steps[0].navigate).toEqual({
      path: '/dashboard/schedule',
    });
  });

  it('polishGuideResponseWithLlm rejects ungrounded settings paths', async () => {
    const base = buildBaseGuide(1, 'Original summary');
    const result = await polishGuideResponseWithLlm(
      {
        businessId: 'biz-1',
        prompt: 'How do I set up weekly templates?',
        intent: 'guide_user_flow',
        locale: 'en',
        baseGuide: base,
        corpusTitle: 'Schedule templates',
        matchConfidence: 0.7,
        corpusSettingsPaths: [],
      },
      {
        isAvailableForBusiness: async () => true,
        completeJson: async () => ({
          summary:
            'Enable settings.fakePaymentToggle in business.settings.fakePaymentToggle.',
          steps: [{ title: 'Bad', body: 'Toggle settings.fakePaymentToggle.' }],
        }),
      },
    );
    expect(result.polished).toBe(false);
    expect(result.guide).toBe(base);
  });

  it('polishGuideResponseWithLlm rejects ungrounded LLM output', async () => {
    const base = buildBaseGuide(1, 'Original summary');
    const result = await polishGuideResponseWithLlm(
      {
        businessId: 'biz-1',
        prompt: 'How do I set up weekly templates?',
        intent: 'guide_user_flow',
        locale: 'en',
        baseGuide: base,
        corpusTitle: 'Schedule templates',
        matchConfidence: 0.7,
      },
      {
        isAvailableForBusiness: async () => true,
        completeJson: async () => ({
          summary: 'Open configure_fake_payment_toggle on /dashboard/unknown.',
          steps: [{ title: 'Bad', body: 'Use configure_fake_payment_toggle.' }],
        }),
      },
    );
    expect(result.polished).toBe(false);
    expect(result.guide).toBe(base);
  });
});
