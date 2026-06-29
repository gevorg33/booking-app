import { getGuideCorpusTopic } from './ai-guide-corpus.util.js';
import type { GuideResponse } from '../command-completion.types.js';
import { normalizeZendeskSubdomain } from '../../integrations/zendesk/zendesk-subdomain.util.js';
import {
  GUIDE_TOPIC_HELP_ARTICLE_OVERRIDES,
  GUIDE_TOPIC_ZENDESK_ARTICLE_IDS,
} from './guide-topic-help-articles.manifest.js';
import type {
  GuideHelpArticleRef,
  GuideTopicHelpArticleMapping,
} from './guide-topic-help-articles.types.js';

export function buildZendeskHelpCenterArticleUrl(
  subdomain: string,
  articleId: string,
  locale = 'en-us',
): string {
  const normalizedSubdomain = normalizeZendeskSubdomain(subdomain);
  const hcLocale =
    locale === 'ru' || locale.startsWith('ru-')
      ? 'ru'
      : locale === 'hy' || locale.startsWith('hy-')
        ? 'en-us'
        : locale.includes('-')
          ? locale.toLowerCase()
          : `${locale.toLowerCase()}-us`;
  return `https://${normalizedSubdomain}.zendesk.com/hc/${hcLocale}/articles/${articleId}`;
}

export function lookupGuideTopicHelpArticleOverride(
  topicId: string,
): GuideTopicHelpArticleMapping | undefined {
  return GUIDE_TOPIC_HELP_ARTICLE_OVERRIDES[topicId];
}

/** Resolve optional help-center / Zendesk article refs for a guide topicId. */
export function resolveGuideTopicHelpArticle(
  topicId: string | undefined,
): GuideHelpArticleRef | undefined {
  if (!topicId?.trim()) return undefined;

  const override = lookupGuideTopicHelpArticleOverride(topicId);
  const corpusTopic = getGuideCorpusTopic(topicId);
  const helpCenterTopicId =
    override?.helpCenterTopicId ?? corpusTopic?.helpCenterTopicId;
  const zendeskArticleId =
    override?.zendeskArticleId ?? GUIDE_TOPIC_ZENDESK_ARTICLE_IDS[topicId];

  if (!helpCenterTopicId && !zendeskArticleId) return undefined;

  return {
    ...(helpCenterTopicId ? { helpCenterTopicId } : {}),
    ...(zendeskArticleId ? { zendeskArticleId } : {}),
  };
}

/** Attach optional helpArticle metadata to a guide response (ai-guide-1.7.1). */
export function enrichGuideResponseHelpArticles(guide: GuideResponse): GuideResponse {
  const helpArticle = resolveGuideTopicHelpArticle(guide.topicId);
  if (!helpArticle) return guide;
  if (
    guide.helpArticle?.helpCenterTopicId === helpArticle.helpCenterTopicId &&
    guide.helpArticle?.zendeskArticleId === helpArticle.zendeskArticleId
  ) {
    return guide;
  }
  return { ...guide, helpArticle };
}
