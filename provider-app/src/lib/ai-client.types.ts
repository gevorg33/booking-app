/** Shared AI types (aligned with dashboard frontend/src/lib/ai-client.types.ts). */

export type AiSurface = 'dashboard' | 'provider';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiCommandResult {
  success: boolean;
  action?: string;
  summary?: string;
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
