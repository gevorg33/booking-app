export type AiKeySource = 'platform' | 'business';

export type AiUsageSurface =
  | 'dashboard'
  | 'provider_mobile'
  | 'public_booking'
  | 'onboarding'
  | 'agent';

export type AiActorType = 'owner' | 'manager' | 'provider' | 'customer' | 'system';

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
