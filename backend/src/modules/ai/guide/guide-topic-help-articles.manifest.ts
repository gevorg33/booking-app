import { TOP_APP_GUIDE_FLOWS } from '../similar-app-guide-prompts.generated.js';
import type { GuideTopicHelpArticleMapping } from './guide-topic-help-articles.types.js';

/**
 * Optional Zendesk Help Center article ids per guide `topicId` (ai-guide-1.7.1 / polish-2).
 * `helpCenterTopicId` is usually derived from dashboard corpus; override here when needed.
 */
export const GUIDE_TOPIC_HELP_ARTICLE_OVERRIDES: Readonly<
  Record<string, GuideTopicHelpArticleMapping>
> = {
  'dashboard.core.schedule': { zendeskArticleId: '360010001' },
  'dashboard.core.calendar': { zendeskArticleId: '360010002' },
  'dashboard.core.employees': { zendeskArticleId: '360010003' },
  'dashboard.operations.inventory': { zendeskArticleId: '360010004' },
  'dashboard.ai.command-bar': { zendeskArticleId: '360010010' },
  'dashboard.ai.ops': { zendeskArticleId: '360010011' },
  'provider-staff-invite': { zendeskArticleId: '360010101' },
  'provider-today-calendar': { zendeskArticleId: '360010102' },
  'provider-appointments': { zendeskArticleId: '360010103' },
  'consumer-getting-started': { zendeskArticleId: '360010201' },
  'consumer-packages-gift-cards': { zendeskArticleId: '360010202' },
  'consumer-activation-welcome': { zendeskArticleId: '360010203' },
  'public-booking-funnel': { zendeskArticleId: '360010301' },
  'public-checkout': { zendeskArticleId: '360010302' },
  'public-availability': { zendeskArticleId: '360010303' },
} as const;

/** Stable ids exported for frontend parity (ai-guide-1.7.1). */
export const GUIDE_TOPIC_ZENDESK_ARTICLE_IDS: Readonly<Record<string, string>> =
  Object.fromEntries(
    Object.entries(GUIDE_TOPIC_HELP_ARTICLE_OVERRIDES)
      .filter(([, row]) => row.zendeskArticleId)
      .map(([topicId, row]) => [topicId, row.zendeskArticleId!]),
  );

/** Every top-20 flow topic should be mappable (Zendesk id optional). */
export const GUIDE_TOP_FLOW_TOPIC_IDS: readonly string[] = TOP_APP_GUIDE_FLOWS.map(
  (flow) => flow.topicId,
);
