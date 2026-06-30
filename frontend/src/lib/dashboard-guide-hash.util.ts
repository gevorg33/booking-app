import type { AiTranslateFn } from '@/lib/ai-assistant-i18n';
import { fireOrchestrixRun } from '@/lib/orchestrix-events';
import {
  buildGuideTopicAskPrompt,
  resolveGuideTopicIdFromAnchor,
  type GuideCorpusTopicId,
} from './dashboard-guide-corpus.util';

export function readGuidePageHashAnchor(
  hash: string | null | undefined = typeof window !== 'undefined' ? window.location.hash : '',
): string | null {
  const normalized = (hash ?? '').replace(/^#/, '').trim();
  return normalized || null;
}

export function resolveGuideAssistantSeedFromAnchor(
  anchor: string | null | undefined,
): { topicId: GuideCorpusTopicId; anchor: string } | null {
  const normalized = anchor?.replace(/^#/, '').trim();
  if (!normalized) return null;
  const topicId = resolveGuideTopicIdFromAnchor(normalized);
  if (!topicId) return null;
  return { topicId, anchor: normalized };
}

export function fireGuideAssistantSeedForTopic(topicId: string, t: AiTranslateFn): void {
  fireOrchestrixRun(buildGuideTopicAskPrompt(topicId, t), true, {
    assistantMode: 'guide',
    guideTopicId: topicId,
  });
}

/** Launch guide-mode Orchestrix from `/dashboard/guide#…` (ai-guide-1.3.4). */
export function fireGuideAssistantSeedFromHash(
  t: AiTranslateFn,
  hash?: string | null,
): boolean {
  const seed = resolveGuideAssistantSeedFromAnchor(
    hash === undefined ? readGuidePageHashAnchor() : hash,
  );
  if (!seed) return false;
  fireGuideAssistantSeedForTopic(seed.topicId, t);
  return true;
}
