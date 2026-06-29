/** Shared AI types (aligned with dashboard frontend/src/lib/ai-client.types.ts). */

export type AiSurface = 'dashboard' | 'provider';

export type AssistantMode = 'guide' | 'act';

export interface AiGuideStep {
  title: string;
  body: string;
  voiceSummary?: string;
  navigate?: { path: string; query?: Record<string, string>; hash?: string };
}

export interface AiGuideSupportSnapshot {
  surface: 'dashboard' | 'provider' | 'customer' | 'public';
  route?: string;
  topicId?: string;
  locale: string;
}

export interface AiGuideSupportHandoff {
  action: 'create_support_ticket';
  label: string;
  snapshot: AiGuideSupportSnapshot;
  ticket: {
    subject: string;
    body: string;
    tags: readonly string[];
  };
}

export interface AiGuideResponse {
  summary: string;
  voiceSummary?: string;
  steps: AiGuideStep[];
  navigate?: { path: string; query?: Record<string, string>; hash?: string };
  topicId?: string;
  supportHandoff?: AiGuideSupportHandoff;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiCommandResult {
  success: boolean;
  action?: string;
  summary?: string;
  guide?: AiGuideResponse;
  details?: Record<string, unknown>;
}

export interface AiCapabilities {
  surface: AiSurface;
  accessTier: string;
  planTierId: string;
  allowedIntents: readonly string[];
  planDeniedIntents: readonly string[];
  hints: string;
}
