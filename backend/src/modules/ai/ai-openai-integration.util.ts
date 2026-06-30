import type { UpdateOpenAiIntegrationDto } from '../integrations/dto/update-openai-integration.dto.js';

/** Dashboard mutate intent (ai-cmd-ext-2.21). */
export const CONFIGURE_OPENAI_INTEGRATION_INTENT =
  'configure_openai_integration' as const;

export const DASHBOARD_OPENAI_INTEGRATION_MUTATE_INTENTS = [
  CONFIGURE_OPENAI_INTEGRATION_INTENT,
] as const;

export type DashboardOpenaiIntegrationMutateIntent =
  (typeof DASHBOARD_OPENAI_INTEGRATION_MUTATE_INTENTS)[number];

export type OpenaiIntegrationAccessTier = 'M';

export function resolveOpenaiIntegrationAccessTier(
  action: string,
): OpenaiIntegrationAccessTier | null {
  return action === CONFIGURE_OPENAI_INTEGRATION_INTENT ? 'M' : null;
}

export const OPENAI_INTEGRATION_CLASSIFIER_RULES = `- configure_openai_integration: MUTATE — admin-only OpenAI API setup on Settings → OpenAI (business.settings.integrations.openai). Connection mode: usePlatformDefault (platform shared key vs tenant BYOK). Fields: usePlatformDefault (boolean), apiKey (plaintext sk-… — encrypted server-side). NOT explain_ai_settings (read-only help about where AI settings live), NOT explain_integration_health (read-only connected/configured status), NOT rotate_api_key (Booking REST API keys), NOT configure_zapier, NOT list_integration_health (bulk status list).
- Examples:
  - "Configure OpenAI integration for the salon" → configure_openai_integration
  - "Use platform default OpenAI API" → usePlatformDefault=true
  - "Connect our own OpenAI API key" → usePlatformDefault=false
  - "Set OpenAI API key sk-…" → apiKey=sk-…
  - "Bring your own OpenAI key for the business" → usePlatformDefault=false`;

export type ConfigureOpenaiIntegrationPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof CONFIGURE_OPENAI_INTEGRATION_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const CONFIGURE_OPENAI_INTEGRATION_PROMPTS: ConfigureOpenaiIntegrationPromptFixture[] =
  [
    {
      id: 'configure-integration',
      prompt: 'Configure OpenAI integration for the salon',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
    },
    {
      id: 'platform-default',
      prompt: 'Use platform default OpenAI API',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
      paramsPartial: { usePlatformDefault: true },
    },
    {
      id: 'own-key',
      prompt: 'Connect our own OpenAI API key',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
      paramsPartial: { usePlatformDefault: false },
    },
    {
      id: 'set-api-key',
      prompt: 'Set OpenAI API key sk-testkey123456789012345678901234',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
      paramsPartial: { apiKey: 'sk-testkey123456789012345678901234' },
    },
    {
      id: 'byok',
      prompt: 'Bring your own OpenAI key for the business',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
      paramsPartial: { usePlatformDefault: false },
    },
    {
      id: 'switch-platform',
      prompt: 'Switch to platform OpenAI connection',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
      paramsPartial: { usePlatformDefault: true },
    },
    {
      id: 'update-settings',
      prompt: 'Update OpenAI integration settings',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
    },
    {
      id: 'integrations-page',
      prompt: 'Configure OpenAI on the integrations settings page',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
    },
    {
      id: 'enable-custom-key',
      prompt: 'Enable custom OpenAI API key for AI assistant',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
      paramsPartial: { usePlatformDefault: false },
    },
    {
      id: 'shared-platform',
      prompt: 'Use shared platform OpenAI for command bar',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
      paramsPartial: { usePlatformDefault: true },
    },
    {
      id: 'tenant-openai',
      prompt: 'Set up tenant OpenAI API key',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
      paramsPartial: { usePlatformDefault: false },
    },
    {
      id: 'connect-assistant',
      prompt: 'Connect OpenAI for the dashboard assistant',
      surface: 'dashboard',
      expectedAction: CONFIGURE_OPENAI_INTEGRATION_INTENT,
    },
  ];

export type ParsedOpenaiIntegrationConfig = Partial<
  Pick<UpdateOpenAiIntegrationDto, 'usePlatformDefault' | 'apiKey'>
>;

const MUTATE_VERB =
  /\b(configure|set|update|connect|enable|link|switch|use|change|bring)\b/i;

const OPENAI_INTEGRATION_SIGNAL =
  /\b(openai\s+integration|openai\s+api\s+key|openai\s+connection|connect\s+openai|platform\s+default\s+openai|shared\s+platform\s+openai|tenant\s+openai|bring\s+your\s+own\s+openai|custom\s+openai|integrations\s+openai|byok\s+openai)\b/i;

function isExplainOpenAiSettingsPrompt(prompt: string): boolean {
  if (
    /\b(configure|set|update|connect|enable|switch|use\s+platform|bring\s+your\s+own)\b/i.test(
      prompt,
    ) &&
    !/\b(where|how|what)\s+(?:do\s+i|can\s+i|to)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(where|how|what|explain|show|tell\s+me)\b/i.test(prompt) &&
    /\b(openai|ai\s+settings?|platform\s+default\s+api|bring\s+your\s+own\s+key)\b/i.test(
      prompt,
    )
  );
}

function isBookingApiKeyPrompt(prompt: string): boolean {
  return (
    /\b(rotate|renew|replace|revoke|create)\b/i.test(prompt) &&
    /\b(api\s*keys?|rest\s+api)\b/i.test(prompt) &&
    !/\bopenai\b/i.test(prompt)
  );
}

function parseConnectionMode(
  prompt: string,
  params: Record<string, unknown>,
): boolean | undefined {
  if (params.usePlatformDefault === true) return true;
  if (params.usePlatformDefault === false) return false;
  if (
    /\b(platform\s+default|use\s+platform|shared\s+platform|switch\s+to\s+platform)\b/i.test(
      prompt,
    ) &&
    /\bopenai\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(own\s+key|custom\s+(?:openai\s+)?(?:api\s+)?key|bring\s+your\s+own|tenant\s+openai|byok|connect\s+our)\b/i.test(
      prompt,
    ) &&
    /\bopenai\b/i.test(prompt)
  ) {
    return false;
  }
  return undefined;
}

function parseApiKey(
  prompt: string,
  params: Record<string, unknown>,
): string | undefined {
  if (typeof params.apiKey === 'string' && params.apiKey.trim()) {
    return params.apiKey.trim();
  }
  const skMatch = prompt.match(/\b(sk-[A-Za-z0-9_-]{8,})\b/);
  return skMatch?.[1];
}

export function isConfigureOpenaiIntegrationPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isExplainOpenAiSettingsPrompt(text)) return false;
  if (isBookingApiKeyPrompt(text)) return false;

  if (!/\bopenai\b/i.test(text)) return false;
  if (!MUTATE_VERB.test(text)) return false;

  if (OPENAI_INTEGRATION_SIGNAL.test(text)) return true;
  if (/\bsk-[A-Za-z0-9_-]{8,}\b/.test(text)) return true;

  return (
    /\b(configure|connect|set\s+up|update)\b/i.test(text) &&
    /\b(integrations?\s+settings?|settings?\s+page|assistant)\b/i.test(text)
  );
}

export function parseConfigureOpenaiIntegrationFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedOpenaiIntegrationConfig | null {
  const hasExplicitParams =
    typeof params.usePlatformDefault === 'boolean' ||
    typeof params.apiKey === 'string';

  if (
    !isConfigureOpenaiIntegrationPrompt(prompt) &&
    !hasExplicitParams &&
    params._forceOpenaiIntegration !== true
  ) {
    return null;
  }

  const config: ParsedOpenaiIntegrationConfig = {};

  if (typeof params.usePlatformDefault === 'boolean') {
    config.usePlatformDefault = params.usePlatformDefault;
  }
  if (typeof params.apiKey === 'string' && params.apiKey.trim()) {
    config.apiKey = params.apiKey.trim();
  }

  const connectionMode = parseConnectionMode(prompt, params);
  if (connectionMode !== undefined) config.usePlatformDefault = connectionMode;

  const apiKey = parseApiKey(prompt, params);
  if (apiKey) config.apiKey = apiKey;

  if (isConfigureOpenaiIntegrationPrompt(prompt)) return config;
  return Object.keys(config).length ? config : null;
}

export function describeOpenaiIntegrationPatch(
  patch: ParsedOpenaiIntegrationConfig,
): string[] {
  return Object.entries(patch).map(([key, value]) => {
    if (key === 'usePlatformDefault') {
      return `connection mode: ${value ? 'platform default' : 'tenant API key'}`;
    }
    if (key === 'apiKey') return 'OpenAI API key updated';
    return `${key}: ${String(value)}`;
  });
}

export function enrichOpenaiIntegrationParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseConfigureOpenaiIntegrationFromPrompt(prompt, params);
  if (!parsed) return params;
  return { ...params, ...parsed };
}

export function rescueConfigureOpenaiIntegrationIntent(
  prompt: string,
  action: string,
): {
  action: typeof CONFIGURE_OPENAI_INTEGRATION_INTENT;
  rescueReason: string;
} | null {
  if (action === CONFIGURE_OPENAI_INTEGRATION_INTENT) return null;
  if (!isConfigureOpenaiIntegrationPrompt(prompt)) return null;
  return {
    action: CONFIGURE_OPENAI_INTEGRATION_INTENT,
    rescueReason: CONFIGURE_OPENAI_INTEGRATION_INTENT,
  };
}
