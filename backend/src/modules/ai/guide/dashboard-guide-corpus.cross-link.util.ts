import type {
  GuideCorpusTopic,
  GuideCorpusTopicId,
} from './ai-guide-corpus.types.js';
import { DASHBOARD_GUIDE_CORPUS_TOPICS } from './dashboard-guide-corpus.manifest.js';

/** Slim anchor ↔ topicId ↔ title key row for /dashboard/guide cross-links (ai-guide-1.3.4). */
export interface GuideCorpusCrossLinkEntry {
  topicId: GuideCorpusTopicId;
  anchor: string;
  titleKey: string;
}

export function resolveGuideCorpusTitleI18nKey(
  topic: GuideCorpusTopic,
): string {
  const title = topic.content.find((entry) => entry.kind === 'title');
  if (!title?.i18nKey) {
    throw new Error(
      `Guide corpus topic ${topic.topicId} is missing a title i18n key`,
    );
  }
  return title.i18nKey;
}

export function buildDashboardGuideCorpusCrossLinkIndex(): GuideCorpusCrossLinkEntry[] {
  return DASHBOARD_GUIDE_CORPUS_TOPICS.map((topic) => ({
    topicId: topic.topicId,
    anchor: topic.anchor,
    titleKey: resolveGuideCorpusTitleI18nKey(topic),
  }));
}

/** Canonical cross-link index — source of truth for frontend `dashboard-guide-corpus.index.json`. */
export const DASHBOARD_GUIDE_CORPUS_CROSS_LINK_INDEX =
  buildDashboardGuideCorpusCrossLinkIndex();
