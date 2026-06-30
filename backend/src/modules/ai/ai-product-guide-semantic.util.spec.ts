import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { PRODUCT_GUIDE_SEMANTIC_SCENARIOS } from './ai-product-guide.fixtures.js';
import {
  GUIDE_SEMANTIC_EMBEDDING_THRESHOLD,
  GUIDE_SEMANTIC_MATCH_THRESHOLD,
  rankGuideCorpusTopicsSemanticDeterministic,
  resolveGuideCorpusMatch,
  shouldEscalateGuideCorpusToSemantic,
} from './ai-product-guide-semantic.util.js';
import {
  GUIDE_CORPUS_MATCH_THRESHOLD,
  pickBestGuideCorpusTopic,
} from './ai-product-guide-ranking.util.js';

describe('ai-product-guide-semantic.util (ai-guide-1.2.3)', () => {
  const messages = getFrontendGuideCorpusMessages('en');

  it.each(PRODUCT_GUIDE_SEMANTIC_SCENARIOS)(
    '$id — deterministic semantic resolves $expectedTopicId',
    async ({ prompt, intent, route, expectedTopicId }) => {
      const keywordBest = pickBestGuideCorpusTopic(
        { prompt, intent, route, locale: 'en' },
        messages,
      );
      expect(shouldEscalateGuideCorpusToSemantic(keywordBest)).toBe(true);

      const resolution = await resolveGuideCorpusMatch(
        { prompt, intent, route, locale: 'en' },
        messages,
      );
      expect(resolution.best?.topicId).toBe(expectedTopicId);
      expect(resolution.retrievalPath).not.toBe('keyword');
      expect(resolution.best?.score).toBeGreaterThanOrEqual(
        GUIDE_CORPUS_MATCH_THRESHOLD,
      );
    },
  );

  it('keeps confident keyword matches on keyword path', async () => {
    const prompt = 'How do I set up weekly schedule templates?';
    const resolution = await resolveGuideCorpusMatch(
      {
        prompt,
        intent: 'guide_user_flow',
        route: '/dashboard/schedule',
        locale: 'en',
      },
      messages,
    );
    expect(resolution.retrievalPath).toBe('keyword');
    expect(resolution.best?.topicId).toBe('dashboard.core.schedule');
  });

  it('semantic rank ignores low-similarity topics', () => {
    const ranked = rankGuideCorpusTopicsSemanticDeterministic(
      { prompt: 'xyzzy nonsense', intent: 'guide_user_flow', locale: 'en' },
      messages,
    );
    expect(ranked.length).toBe(0);
  });

  it('exports semantic thresholds for deterministic and embedding paths', () => {
    expect(GUIDE_SEMANTIC_MATCH_THRESHOLD).toBeGreaterThan(0);
    expect(GUIDE_SEMANTIC_EMBEDDING_THRESHOLD).toBeGreaterThan(0);
  });
});
