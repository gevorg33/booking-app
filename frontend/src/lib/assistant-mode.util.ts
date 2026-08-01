import type { AssistantMode } from '@/lib/ai-orchestration';

export type { AssistantMode };

/**
 * e2e-bug.233 — when Help/guide chip is off, send explicit `act` so the backend
 * does not infer `guide` from "How do…" loyalty/referral prompts and steal into
 * `guide_user_flow`. Help chip still forces `guide`.
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
