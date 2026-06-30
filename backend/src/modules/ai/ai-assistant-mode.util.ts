import type { CommandSurface } from './ai-command-registry.types.js';
import { isProductGuidePrompt } from './ai-product-guide.util.js';

export const ASSISTANT_MODE_VALUES = ['guide', 'act'] as const;

export type AssistantMode = (typeof ASSISTANT_MODE_VALUES)[number];

export const ASSISTANT_MODE_CONTEXT_KEY = 'assistantMode';

export function isAssistantMode(value: unknown): value is AssistantMode {
  return (
    value === 'guide' ||
    value === 'act'
  );
}

export function parseAssistantMode(value: unknown): AssistantMode | undefined {
  return isAssistantMode(value) ? value : undefined;
}

export function readAssistantModeFromContext(
  context?: Record<string, unknown>,
): AssistantMode | undefined {
  return parseAssistantMode(context?.[ASSISTANT_MODE_CONTEXT_KEY]);
}

/**
 * ai-guide-1.0.3 — explicit request flag wins; otherwise infer guide vs act from prompt heuristics.
 */
export function resolveAssistantMode(input: {
  prompt: string;
  surface?: CommandSurface;
  explicit?: unknown;
}): AssistantMode {
  const parsed = parseAssistantMode(input.explicit);
  if (parsed) return parsed;
  return isProductGuidePrompt(input.prompt, { surface: input.surface })
    ? 'guide'
    : 'act';
}

export function resolveAssistantModeFromSession(input: {
  prompt: string;
  surface?: CommandSurface;
  sessionContext?: Record<string, unknown>;
}): AssistantMode {
  return resolveAssistantMode({
    prompt: input.prompt,
    surface: input.surface,
    explicit: readAssistantModeFromContext(input.sessionContext),
  });
}

export function shouldApplyProductGuideRouting(
  assistantMode?: AssistantMode,
): boolean {
  return assistantMode !== 'act';
}

export function shouldForceProductGuideRouting(
  assistantMode?: AssistantMode,
): boolean {
  return assistantMode === 'guide';
}
