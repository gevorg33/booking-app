export type AiKeySource = 'platform' | 'business';

/** Default chat model for all OpenAI gateway calls unless overridden per request or via OPENAI_MODEL. */
export const DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini';

export type AiUsageSurface =
  | 'dashboard'
  | 'provider_mobile'
  | 'public_booking'
  | 'customer'
  | 'onboarding'
  | 'agent';

export type AiActorType =
  | 'owner'
  | 'manager'
  | 'provider'
  | 'customer'
  | 'system';

export interface AiCallContext {
  businessId: string;
  surface: AiUsageSurface;
  operation: string;
  actorType: AiActorType;
  userId?: string;
}

export interface OpenAiRuntimeConfig {
  source: AiKeySource;
  apiKey: string;
}

export interface AiUsageSummary {
  period: 'month';
  periodStart: string;
  periodEnd: string;
  totalRequests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Billable platform-key usage only (USD) */
  estimatedPlatformCostUsd: number;
  bySurface: Array<{
    surface: AiUsageSurface;
    requests: number;
    totalTokens: number;
    platformCostUsd: number;
  }>;
  byActorType: Array<{
    actorType: AiActorType;
    requests: number;
    totalTokens: number;
  }>;
}
