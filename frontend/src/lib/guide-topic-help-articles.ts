import {
  HELP_TOPIC_CORPUS_TOPIC_IDS,
  type HelpTopicId,
} from '@/lib/help-center-topics';

/** Optional help-center / Zendesk article refs (ai-guide-1.7.1). */
export interface GuideHelpArticleRef {
  helpCenterTopicId?: string;
  zendeskArticleId?: string;
}

/** Keep in sync with backend `GUIDE_TOPIC_ZENDESK_ARTICLE_IDS`. */
export const GUIDE_TOPIC_ZENDESK_ARTICLE_IDS: Readonly<Record<string, string>> = {
  'dashboard.core.schedule': '360010001',
  'dashboard.core.calendar': '360010002',
  'dashboard.core.employees': '360010003',
  'dashboard.operations.inventory': '360010004',
  'dashboard.ai.command-bar': '360010010',
  'dashboard.ai.ops': '360010011',
  'provider-staff-invite': '360010101',
  'provider-today-calendar': '360010102',
  'provider-appointments': '360010103',
  'consumer-getting-started': '360010201',
  'consumer-packages-gift-cards': '360010202',
  'consumer-activation-welcome': '360010203',
  'public-booking-funnel': '360010301',
  'public-checkout': '360010302',
  'public-availability': '360010303',
} as const;

const CORPUS_TOPIC_TO_HELP_CENTER_TOPIC_ID = Object.fromEntries(
  Object.entries(HELP_TOPIC_CORPUS_TOPIC_IDS).map(([helpTopicId, corpusTopicId]) => [
    corpusTopicId,
    helpTopicId,
  ]),
) as Record<string, HelpTopicId>;

export function buildZendeskHelpCenterArticleUrl(
  subdomain: string,
  articleId: string,
  locale = 'en-us',
): string {
  let normalizedSubdomain = subdomain.trim().toLowerCase();
  normalizedSubdomain = normalizedSubdomain.replace(/^https?:\/\//, '');
  normalizedSubdomain = normalizedSubdomain.replace(/\.zendesk\.com\/?.*$/, '');
  normalizedSubdomain = normalizedSubdomain.split('/')[0] ?? normalizedSubdomain;
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

export function resolveGuideTopicHelpArticle(
  topicId: string | undefined,
): GuideHelpArticleRef | undefined {
  if (!topicId?.trim()) return undefined;
  const helpCenterTopicId = CORPUS_TOPIC_TO_HELP_CENTER_TOPIC_ID[topicId];
  const zendeskArticleId = GUIDE_TOPIC_ZENDESK_ARTICLE_IDS[topicId];
  if (!helpCenterTopicId && !zendeskArticleId) return undefined;
  return {
    ...(helpCenterTopicId ? { helpCenterTopicId } : {}),
    ...(zendeskArticleId ? { zendeskArticleId } : {}),
  };
}

export function resolveHelpTopicZendeskArticleId(topicId: HelpTopicId): string | undefined {
  const corpusTopicId = HELP_TOPIC_CORPUS_TOPIC_IDS[topicId];
  return GUIDE_TOPIC_ZENDESK_ARTICLE_IDS[corpusTopicId];
}

export function resolveGuideHelpArticleUrl(
  helpArticle: GuideHelpArticleRef | undefined,
  subdomain: string | undefined,
  locale?: string,
): string | null {
  if (!helpArticle?.zendeskArticleId || !subdomain?.trim()) return null;
  return buildZendeskHelpCenterArticleUrl(subdomain, helpArticle.zendeskArticleId, locale);
}
