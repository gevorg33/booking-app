import { describe, expect, it } from 'vitest';
import {
  buildZendeskHelpCenterArticleUrl,
  resolveGuideHelpArticleUrl,
  resolveGuideTopicHelpArticle,
  resolveHelpTopicZendeskArticleId,
} from './guide-topic-help-articles';

describe('guide-topic-help-articles (ai-guide-1.7.1)', () => {
  it('builds Zendesk Help Center URLs', () => {
    expect(buildZendeskHelpCenterArticleUrl('acme', '360010001')).toBe(
      'https://acme.zendesk.com/hc/en-us/articles/360010001',
    );
  });

  it('resolves dashboard schedule topic refs', () => {
    expect(resolveGuideTopicHelpArticle('dashboard.core.schedule')).toEqual({
      helpCenterTopicId: 'schedule',
      zendeskArticleId: '360010001',
    });
  });

  it('resolves contextual help topic Zendesk ids', () => {
    expect(resolveHelpTopicZendeskArticleId('schedule')).toBe('360010001');
  });

  it('builds article url when subdomain is configured', () => {
    expect(
      resolveGuideHelpArticleUrl(
        { zendeskArticleId: '360010001' },
        'acme',
        'en',
      ),
    ).toBe('https://acme.zendesk.com/hc/en-us/articles/360010001');
    expect(resolveGuideHelpArticleUrl({ zendeskArticleId: '360010001' }, undefined)).toBeNull();
  });
});
