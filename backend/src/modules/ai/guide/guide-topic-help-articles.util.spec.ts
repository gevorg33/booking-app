import { HELP_CENTER_TOPIC_TO_CORPUS_TOPIC_ID } from './dashboard-guide-corpus.manifest.js';
import {
  GUIDE_TOPIC_HELP_ARTICLE_OVERRIDES,
  GUIDE_TOP_FLOW_TOPIC_IDS,
} from './guide-topic-help-articles.manifest.js';
import {
  buildZendeskHelpCenterArticleUrl,
  enrichGuideResponseHelpArticles,
  resolveGuideTopicHelpArticle,
} from './guide-topic-help-articles.util.js';
import type { GuideResponse } from '../command-completion.types.js';

describe('guide-topic-help-articles.util (ai-guide-1.7.1)', () => {
  it('builds Zendesk Help Center URLs with locale fallbacks', () => {
    expect(buildZendeskHelpCenterArticleUrl('acme', '360010001', 'en')).toBe(
      'https://acme.zendesk.com/hc/en-us/articles/360010001',
    );
    expect(
      buildZendeskHelpCenterArticleUrl('https://acme.zendesk.com/', '42', 'ru'),
    ).toBe('https://acme.zendesk.com/hc/ru/articles/42');
    expect(buildZendeskHelpCenterArticleUrl('acme', '42', 'hy')).toBe(
      'https://acme.zendesk.com/hc/en-us/articles/42',
    );
  });

  it('derives helpCenterTopicId from dashboard corpus topics', () => {
    expect(resolveGuideTopicHelpArticle('dashboard.core.schedule')).toEqual({
      helpCenterTopicId: 'schedule',
      zendeskArticleId: '360010001',
    });
  });

  it('maps every contextual help topic to corpus topic article refs', () => {
    for (const [helpCenterTopicId, corpusTopicId] of Object.entries(
      HELP_CENTER_TOPIC_TO_CORPUS_TOPIC_ID,
    )) {
      expect(resolveGuideTopicHelpArticle(corpusTopicId)).toEqual(
        expect.objectContaining({ helpCenterTopicId }),
      );
    }
  });

  it('keeps Zendesk article ids unique when configured', () => {
    const ids = Object.values(GUIDE_TOPIC_HELP_ARTICLE_OVERRIDES)
      .map((row) => row.zendeskArticleId)
      .filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers top flow topic ids with optional Zendesk mapping hook', () => {
    expect(GUIDE_TOP_FLOW_TOPIC_IDS.length).toBeGreaterThanOrEqual(20);
    for (const topicId of GUIDE_TOP_FLOW_TOPIC_IDS) {
      expect(typeof topicId).toBe('string');
      expect(topicId.length).toBeGreaterThan(0);
    }
  });

  it('enriches guide responses idempotently', () => {
    const base: GuideResponse = {
      summary: 'Schedule templates',
      steps: [{ title: 'Open schedule', body: 'Go to Schedule.' }],
      topicId: 'dashboard.core.schedule',
    };
    const enriched = enrichGuideResponseHelpArticles(base);
    expect(enriched.helpArticle).toEqual({
      helpCenterTopicId: 'schedule',
      zendeskArticleId: '360010001',
    });
    expect(enrichGuideResponseHelpArticles(enriched)).toBe(enriched);
  });

  it('returns undefined when topic has no article mapping', () => {
    expect(
      resolveGuideTopicHelpArticle('dashboard.operations.tips'),
    ).toBeUndefined();
  });
});
