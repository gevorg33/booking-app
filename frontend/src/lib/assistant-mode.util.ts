import type { AssistantMode } from '@/lib/ai-orchestration';

export type { AssistantMode };

/** When guide chip is off, omit flag so backend infers from prompt (ai-guide-1.0.3). */
export function resolveAssistantModePayload(
  guideMode: boolean,
): AssistantMode | undefined {
  return guideMode ? 'guide' : undefined;
}

export function withAssistantModeContext<T extends Record<string, unknown>>(
  context: T,
  guideMode: boolean,
): T & { assistantMode?: AssistantMode } {
  const mode = resolveAssistantModePayload(guideMode);
  return mode ? { ...context, assistantMode: mode } : context;
}
