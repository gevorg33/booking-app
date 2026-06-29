export type AssistantMode = 'guide' | 'act';

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
