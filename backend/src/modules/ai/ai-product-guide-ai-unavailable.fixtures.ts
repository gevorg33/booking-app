import type { CommandSurface } from './ai-command-registry.types.js';

/** ai-guide-1.8.10 — static guide when OpenAI disabled or quota exceeded (ai-0.2). */
export const AI_UNAVAILABLE_GUIDE_PIPE_MARKER = 'ai-guide-1.8.10';

export type AiUnavailableReason = 'openai_not_configured' | 'quota_exceeded';

/** Provider offline suggestion cache section (cross-ref ai-cmd-provider-5.24.1). */
export const PROVIDER_OFFLINE_GUIDE_TOPIC_ID = 'provider-assistant';

export const AI_UNAVAILABLE_GUIDE_CLASSIFIER_RULES = `- explain_ai_unavailable: READ — when conversational AI is disabled or monthly quota is exceeded, return deterministic guide corpus + native guide screen link (/dashboard/guide#…, mobile guide?topicId=). Triggers: automatic when OpenAI unavailable on guide-mode prompts; NOT configure_* mutates.`;

export interface AiUnavailableGuideScenario {
  id: string;
  surface: CommandSurface;
  reason: AiUnavailableReason;
  prompt: string;
  route?: string;
  assistantMode?: 'guide' | 'act';
  expectGuide: boolean;
  expectNativeNavigate: boolean;
}

export const AI_UNAVAILABLE_GUIDE_SCENARIOS: readonly AiUnavailableGuideScenario[] =
  [
    {
      id: 'dashboard-openai-guide-prompt',
      surface: 'dashboard',
      reason: 'openai_not_configured',
      prompt: 'How do I set up weekly schedule templates?',
      route: '/dashboard/schedule',
      assistantMode: 'guide',
      expectGuide: true,
      expectNativeNavigate: true,
    },
    {
      id: 'dashboard-quota-screen-help',
      surface: 'dashboard',
      reason: 'quota_exceeded',
      prompt: 'What can I do on this page?',
      route: '/dashboard/calendar',
      assistantMode: 'guide',
      expectGuide: true,
      expectNativeNavigate: true,
    },
    {
      id: 'provider-openai-offline-cache',
      surface: 'provider',
      reason: 'openai_not_configured',
      prompt: 'What are the Today tab suggestion cards?',
      route: '/tabs/today',
      expectGuide: true,
      expectNativeNavigate: true,
    },
    {
      id: 'customer-openai-booking-guide',
      surface: 'customer',
      reason: 'openai_not_configured',
      prompt: 'How do I book my first appointment?',
      route: '/s/book',
      expectGuide: true,
      expectNativeNavigate: true,
    },
    {
      id: 'public-openai-booking-help',
      surface: 'public',
      reason: 'openai_not_configured',
      prompt: 'Walk me through booking step by step',
      route: '/book/services',
      expectGuide: true,
      expectNativeNavigate: true,
    },
    {
      id: 'dashboard-act-no-guide',
      surface: 'dashboard',
      reason: 'openai_not_configured',
      prompt: 'Book Anna tomorrow at 3pm',
      route: '/dashboard/calendar',
      assistantMode: 'act',
      expectGuide: false,
      expectNativeNavigate: false,
    },
  ] as const;
