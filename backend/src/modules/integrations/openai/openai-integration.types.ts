import { AiKeySource } from './openai.types.js';

export interface BusinessOpenAiIntegration {
  apiKeyEnc?: string;
}

export interface OpenAiIntegrationPublicView {
  configured: boolean;
  source: AiKeySource | null;
  hasApiKey: boolean;
  apiKeyHint?: string;
  usingPlatformDefault: boolean;
}

export function getBusinessOpenAiIntegration(
  settings?: Record<string, unknown>,
): BusinessOpenAiIntegration {
  const integrations = settings?.integrations as Record<string, unknown> | undefined;
  const raw = integrations?.openai as Record<string, unknown> | undefined;
  if (!raw) return {};
  return {
    apiKeyEnc: typeof raw.apiKeyEnc === 'string' ? raw.apiKeyEnc : undefined,
  };
}
