export type AssistantMode = 'guide' | 'act';

/**
 * e2e-bug.233 — Help chip off → explicit `act` (do not omit and let "How do…"
 * infer guide / steal loyalty into guide_user_flow).
 */
export function resolveAssistantModePayload(guideMode: boolean): AssistantMode {
  return guideMode ? 'guide' : 'act';
}

export function withAssistantModeContext<T extends Record<string, unknown>>(
  context: T,
  guideMode: boolean,
): T & { assistantMode: AssistantMode } {
  return { ...context, assistantMode: resolveAssistantModePayload(guideMode) };
}

export function withGuideTopicSeedContext<T extends Record<string, unknown>>(
  context: T,
  guideTopicId?: string | null,
): T & { guideTopicId?: string } {
  const topicId = guideTopicId?.trim();
  return topicId ? { ...context, guideTopicId: topicId } : context;
}
