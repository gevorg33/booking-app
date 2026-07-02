import {
  handleProductGuideIntentLogicAsync,
  type ProductGuideLogicDeps,
} from './ai-product-guide.logic.js';
import { PRODUCT_GUIDE_SEMANTIC_SCENARIOS } from './ai-product-guide.fixtures.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { resolveGuideCorpusTopic } from './guide/ai-guide-corpus.util.js';
import type { GuideCorpusTopicId } from './guide/ai-guide-corpus.types.js';

describe('ai-product-guide.logic async (ai-guide-1.2.3)', () => {
  it('uses semantic retrieval and LLM polish on async path', async () => {
    const scenario = PRODUCT_GUIDE_SEMANTIC_SCENARIOS[0];
    const messages = getFrontendGuideCorpusMessages('en');
    const resolved = resolveGuideCorpusTopic(
      scenario.expectedTopicId,
      messages,
    );
    const stepCount = Math.max(resolved?.steps.length ?? 1, 1);

    const mockDeps: ProductGuideLogicDeps = {
      llm: {
        isAvailableForBusiness: async () => true,
        completeJson: async () => ({
          summary: 'Polished async summary.',
          steps: Array.from({ length: stepCount }, (_, index) => ({
            title: `Step ${index + 1}`,
            body: `Polished body ${index + 1}`,
          })),
        }),
      },
      semantic: {
        businessId: 'biz-1',
        embedText: async () => null,
        isEmbeddingAvailable: async () => false,
      },
    };

    const result = await handleProductGuideIntentLogicAsync(
      scenario.intent,
      {
        businessId: 'biz-1',
        prompt: scenario.prompt,
        locale: 'en',
      },
      mockDeps,
    );

    expect(result.success).toBe(true);
    expect(result.guide?.topicId).toBe(scenario.expectedTopicId);
    expect(result.details.retrievalPath).not.toBe('keyword');
    expect(result.details.llmPolished).toBe(true);
    expect(result.details.deterministic).toBe(false);
    expect(result.guide?.guideSession?.guideStepIndex).toBe(0);
    expect(result.guide?.summary).toMatch(/^Step 1 of \d+:/);
  });

  it('returns deterministic result when LLM polish is skipped', async () => {
    const result = await handleProductGuideIntentLogicAsync(
      'guide_user_flow',
      {
        businessId: 'biz-1',
        prompt: 'How do I set up weekly schedule templates?',
        route: '/dashboard/schedule',
        locale: 'en',
      },
      {
        semantic: {
          businessId: 'biz-1',
          embedText: async () => null,
          isEmbeddingAvailable: async () => false,
        },
        llm: {
          isAvailableForBusiness: async () => false,
          completeJson: async () => null,
        },
      },
    );

    expect(result.success).toBe(true);
    expect(result.details.deterministic).toBe(true);
    expect(result.details.llmPolished).toBeUndefined();
  });
});
