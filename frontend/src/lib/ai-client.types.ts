/** Shared AI command / gateway types (dashboard + provider surfaces). */

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

export interface AiSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  prompt: string;
  category: string;
  intentHint?: string;
}

export interface AiCapabilities {
  surface: AiSurface;
  accessTier: string;
  planTierId: string;
  allowedIntents: readonly string[];
  planDeniedIntents: readonly string[];
  hints: string;
  usage?: {
    providerSeats: number;
    aiCommandsThisMonth: number;
  };
  atAiLimit?: boolean;
  aiUsageWarning?: boolean;
}
