import type { AiTranslateFn } from '@/lib/ai-assistant-i18n';
import crossLinkIndex from './dashboard-guide-corpus.index.json';

/** Synced from backend manifest via `npm run sync:guide-corpus-cross-link` (ai-guide-1.3.4). */
export const GUIDE_CORPUS_TOPICS = crossLinkIndex;

export type GuideCorpusTopicId = (typeof GUIDE_CORPUS_TOPICS)[number]['topicId'];
export type GuideCorpusAnchor = (typeof GUIDE_CORPUS_TOPICS)[number]['anchor'];

export const GUIDE_CORPUS_ANCHOR_TO_TOPIC_ID: Readonly<Record<string, GuideCorpusTopicId>> =
  Object.fromEntries(GUIDE_CORPUS_TOPICS.map((topic) => [topic.anchor, topic.topicId])) as Record<
    string,
    GuideCorpusTopicId
  >;

export const GUIDE_CORPUS_TOPIC_ID_TO_ANCHOR: Readonly<Record<string, GuideCorpusAnchor>> =
  Object.fromEntries(GUIDE_CORPUS_TOPICS.map((topic) => [topic.topicId, topic.anchor])) as Record<
    string,
    GuideCorpusAnchor
  >;

export const GUIDE_CORPUS_TOPIC_TITLE_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
  GUIDE_CORPUS_TOPICS.map((topic) => [topic.topicId, topic.titleKey]),
);

export function resolveGuideTopicIdFromAnchor(
  anchor: string | null | undefined,
): GuideCorpusTopicId | null {
  if (!anchor) return null;
  const normalized = anchor.replace(/^#/, '').trim();
  return GUIDE_CORPUS_ANCHOR_TO_TOPIC_ID[normalized] ?? null;
}

export function resolveGuideAnchorFromTopicId(
  topicId: string | null | undefined,
): GuideCorpusAnchor | null {
  if (!topicId) return null;
  return GUIDE_CORPUS_TOPIC_ID_TO_ANCHOR[topicId] ?? null;
}

export function buildDashboardGuideTopicUrl(topicId: string): string {
  const anchor = resolveGuideAnchorFromTopicId(topicId);
  return anchor ? `/dashboard/guide#${anchor}` : '/dashboard/guide';
}

export function buildGuideTopicAskPrompt(topicId: string, t: AiTranslateFn): string {
  const titleKey = GUIDE_CORPUS_TOPIC_TITLE_KEYS[topicId];
  const topic = titleKey ? t(titleKey) : topicId;
  return t('ai.guidePrompts.walkThroughTopic', { topic });
}

export function assertGuideCorpusAnchorParity(): void {
  const anchors = new Set(GUIDE_CORPUS_TOPICS.map((topic) => topic.anchor));
  if (anchors.size !== GUIDE_CORPUS_TOPICS.length) {
    throw new Error('Duplicate guide corpus anchors detected');
  }
  for (const topic of GUIDE_CORPUS_TOPICS) {
    if (GUIDE_CORPUS_TOPIC_ID_TO_ANCHOR[topic.topicId] !== topic.anchor) {
      throw new Error(`Guide corpus topic drift for ${topic.topicId}`);
    }
  }
}
