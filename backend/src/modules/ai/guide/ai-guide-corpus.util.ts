import {
  DASHBOARD_GUIDE_CORPUS_TOC,
  DASHBOARD_GUIDE_CORPUS_TOPIC_IDS,
  DASHBOARD_GUIDE_CORPUS_TOPICS,
  DASHBOARD_GUIDE_PAGE_ANCHORS,
  GUIDE_CORPUS_ANCHOR_TO_TOPIC_ID,
  HELP_CENTER_TOPIC_TO_CORPUS_TOPIC_ID,
  buildDashboardGuideTopicUrl,
} from './dashboard-guide-corpus.manifest.js';
import { resolveGuideCorpusI18nKey } from './ai-guide-corpus-i18n.util.js';
import type {
  GuideCorpusGroup,
  GuideCorpusTopic,
  GuideCorpusTopicId,
  ResolvedGuideCorpusTopic,
} from './ai-guide-corpus.types.js';

type MessageTree = { [key: string]: string | MessageTree };

const TOPIC_BY_ID = new Map<string, GuideCorpusTopic>(
  DASHBOARD_GUIDE_CORPUS_TOPICS.map((topic) => [topic.topicId, topic]),
);

export {
  DASHBOARD_GUIDE_CORPUS_TOC,
  DASHBOARD_GUIDE_CORPUS_TOPIC_IDS,
  DASHBOARD_GUIDE_CORPUS_TOPICS,
  DASHBOARD_GUIDE_PAGE_ANCHORS,
  GUIDE_CORPUS_ANCHOR_TO_TOPIC_ID,
  HELP_CENTER_TOPIC_TO_CORPUS_TOPIC_ID,
  buildDashboardGuideTopicUrl,
};
export type { ResolvedGuideCorpusTopic } from './ai-guide-corpus.types.js';

export function isGuideCorpusTopicId(
  value: string,
): value is GuideCorpusTopicId {
  return TOPIC_BY_ID.has(value);
}

export function getGuideCorpusTopic(
  topicId: GuideCorpusTopicId,
): GuideCorpusTopic | undefined {
  return TOPIC_BY_ID.get(topicId);
}

export function getGuideCorpusTopicByAnchor(
  anchor: string,
): GuideCorpusTopic | undefined {
  const topicId = GUIDE_CORPUS_ANCHOR_TO_TOPIC_ID[anchor];
  return topicId ? getGuideCorpusTopic(topicId) : undefined;
}

export function getGuideCorpusTopicByHelpCenterId(
  helpCenterTopicId: string,
): GuideCorpusTopic | undefined {
  const topicId = HELP_CENTER_TOPIC_TO_CORPUS_TOPIC_ID[helpCenterTopicId];
  return topicId ? getGuideCorpusTopic(topicId) : undefined;
}

export function listGuideCorpusTopics(filter?: {
  group?: GuideCorpusGroup;
  surface?: GuideCorpusTopic['surface'];
}): readonly GuideCorpusTopic[] {
  return DASHBOARD_GUIDE_CORPUS_TOPICS.filter((topic) => {
    if (filter?.group && topic.group !== filter.group) return false;
    if (filter?.surface && topic.surface !== filter.surface) return false;
    return true;
  });
}

export function listGuideCorpusI18nKeys(
  topicId?: GuideCorpusTopicId,
): readonly string[] {
  const topics = topicId
    ? [getGuideCorpusTopic(topicId)].filter(Boolean)
    : DASHBOARD_GUIDE_CORPUS_TOPICS;
  const keys = new Set<string>();
  for (const topic of topics) {
    if (!topic) continue;
    for (const slot of topic.content) {
      keys.add(slot.i18nKey);
    }
  }
  return [...keys].sort();
}

export function listAllGuideCorpusI18nKeys(): readonly string[] {
  const keys = new Set<string>(listGuideCorpusI18nKeys());
  for (const group of DASHBOARD_GUIDE_CORPUS_TOC) {
    keys.add(group.navLabelKey);
  }
  keys.add('guide.title');
  keys.add('guide.subtitle');
  return [...keys].sort();
}

/** Resolve localized corpus text from a frontend message tree (AiProductGuideService input). */
export function resolveGuideCorpusTopic(
  topicId: GuideCorpusTopicId,
  messages: MessageTree,
): ResolvedGuideCorpusTopic | null {
  const topic = getGuideCorpusTopic(topicId);
  if (!topic) return null;

  const resolvedContent = topic.content
    .map((slot) => {
      const text = resolveGuideCorpusI18nKey(messages, slot.i18nKey);
      if (!text) return null;
      return { kind: slot.kind, i18nKey: slot.i18nKey, text };
    })
    .filter(Boolean) as ResolvedGuideCorpusTopic['content'];

  const title =
    resolvedContent.find((row) => row.kind === 'title')?.text ?? topic.topicId;
  const summary = resolvedContent.find((row) => row.kind === 'summary')?.text;
  const body = resolvedContent.find((row) => row.kind === 'body')?.text;
  const steps = resolvedContent
    .filter((row) => row.kind === 'step')
    .map((row) => row.text);
  const bullets = resolvedContent
    .filter((row) => row.kind === 'bullet')
    .map((row) => row.text);

  return {
    topicId: topic.topicId,
    anchor: topic.anchor,
    group: topic.group,
    title,
    summary,
    body,
    steps,
    bullets,
    navigate: topic.navigate,
    content: resolvedContent,
  };
}

export function assertGuideCorpusIntegrity(): void {
  const topicIds = new Set<string>();
  const anchors = new Set<string>();

  for (const topic of DASHBOARD_GUIDE_CORPUS_TOPICS) {
    if (topicIds.has(topic.topicId)) {
      throw new Error(`duplicate guide corpus topicId: ${topic.topicId}`);
    }
    topicIds.add(topic.topicId);

    if (anchors.has(topic.anchor)) {
      throw new Error(`duplicate guide corpus anchor: ${topic.anchor}`);
    }
    anchors.add(topic.anchor);

    if (!topic.topicId.startsWith(`dashboard.${topic.group}.`)) {
      throw new Error(
        `topicId ${topic.topicId} must start with dashboard.${topic.group}.`,
      );
    }
  }

  const tocTopicIds = DASHBOARD_GUIDE_CORPUS_TOC.flatMap(
    (group) => group.topicIds,
  );
  if (tocTopicIds.length !== DASHBOARD_GUIDE_CORPUS_TOPICS.length) {
    throw new Error('guide corpus TOC does not cover every topic');
  }
  for (const topicId of DASHBOARD_GUIDE_CORPUS_TOPIC_IDS) {
    if (!tocTopicIds.includes(topicId)) {
      throw new Error(`topic ${topicId} missing from TOC groups`);
    }
  }
}
