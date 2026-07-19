import { isConfigureOpenaiIntegrationPrompt } from './ai-openai-integration.util.js';
import { isConfigureWhatsappIntegrationPrompt } from './ai-whatsapp-integration.util.js';
import { isExplainServiceOnlinePaymentSetupPrompt } from './ai-service-online-payment-setup.util.js';
import type { IntegrationHealthFocus } from './ai-integration-health.snapshot.js';

/** Dashboard read intent (ai-cmd-ext-2.31). */
export const EXPLAIN_INTEGRATION_HEALTH_INTENT =
  'explain_integration_health' as const;

export const INTEGRATION_HEALTH_READ_INTENTS = [
  EXPLAIN_INTEGRATION_HEALTH_INTENT,
] as const;

export type IntegrationHealthReadIntent =
  (typeof INTEGRATION_HEALTH_READ_INTENTS)[number];

export function isIntegrationHealthReadIntent(
  action: string,
): action is IntegrationHealthReadIntent {
  return (INTEGRATION_HEALTH_READ_INTENTS as readonly string[]).includes(
    action,
  );
}

export const EXPLAIN_INTEGRATION_HEALTH_CLASSIFIER_RULES = `- explain_integration_health: READ — answer whether a specific integration is connected/configured/enabled (WhatsApp, OpenAI, Stripe Connect, Zendesk, Zapier, webhooks, API keys, accounting export) or summarize overall integration health. Uses live settings from Integrations and Settings. Triggers: is/are + connected|configured|enabled|set up + integration name; explain/describe/which + integration health|integrations connected. Optional integrationFocus param (whatsapp|openai|stripe|zendesk|zapier|webhooks|apiKeys|accounting). NOT list_integration_health (bulk "list integration health status"), NOT configure_whatsapp_integration|configure_openai_integration|configure_zendesk|configure_zapier (mutate), NOT list_webhooks|list_zapier_triggers (inventory lists), and NOT explain_tenant_app_install (consumer app QR).
- Examples:
  - "Is WhatsApp connected?" → explain_integration_health, integrationFocus=whatsapp
  - "Is OpenAI configured?" → explain_integration_health, integrationFocus=openai
  - "Is Stripe connected?" → explain_integration_health, integrationFocus=stripe
  - "Which integrations are connected?" → explain_integration_health
  - "Explain integration health" → explain_integration_health`;

export type ExplainIntegrationHealthFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof EXPLAIN_INTEGRATION_HEALTH_INTENT;
  paramsPartial?: { integrationFocus?: IntegrationHealthFocus };
};

export const EXPLAIN_INTEGRATION_HEALTH_PROMPTS: ExplainIntegrationHealthFixture[] =
  [
    {
      id: 'is-whatsapp-connected',
      prompt: 'Is WhatsApp connected?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
      paramsPartial: { integrationFocus: 'whatsapp' },
    },
    {
      id: 'openai-configured',
      prompt: 'Is OpenAI configured for our salon?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
      paramsPartial: { integrationFocus: 'openai' },
    },
    {
      id: 'stripe-connected',
      prompt: 'Is Stripe connected?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
      paramsPartial: { integrationFocus: 'stripe' },
    },
    {
      id: 'zendesk-connected',
      prompt: 'Is Zendesk connected?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
      paramsPartial: { integrationFocus: 'zendesk' },
    },
    {
      id: 'zapier-enabled',
      prompt: 'Is Zapier enabled?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
      paramsPartial: { integrationFocus: 'zapier' },
    },
    {
      id: 'explain-integration-health',
      prompt: 'Explain integration health',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
    },
    {
      id: 'which-integrations-connected',
      prompt: 'Which integrations are connected?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
    },
    {
      id: 'webhooks-configured',
      prompt: 'Are webhooks configured?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
      paramsPartial: { integrationFocus: 'webhooks' },
    },
    {
      id: 'api-keys-status',
      prompt: 'Do we have API keys set up?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
      paramsPartial: { integrationFocus: 'apiKeys' },
    },
    {
      id: 'accounting-export-ready',
      prompt: 'Is accounting export configured?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
      paramsPartial: { integrationFocus: 'accounting' },
    },
    {
      id: 'whatsapp-platform-default',
      prompt: 'Is WhatsApp using the platform default?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
      paramsPartial: { integrationFocus: 'whatsapp' },
    },
    {
      id: 'openai-key-source',
      prompt: 'Is OpenAI using our own API key or platform default?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_INTEGRATION_HEALTH_INTENT,
      paramsPartial: { integrationFocus: 'openai' },
    },
  ];

function hasExplainReadCue(prompt: string): boolean {
  return (
    /\b(explain|describe|show|what|which|how|summarize|overview|status)\b/i.test(
      prompt,
    ) ||
    /\b(is|are|do|does)\b/i.test(prompt) ||
    /(?:բացատրիր|ցույց\s+տուր)/i.test(prompt) ||
    /(?:объясни|покажи|опиши|какие|какой)/i.test(prompt)
  );
}

function hasIntegrationHealthSurface(prompt: string): boolean {
  return (
    /\bintegrations?\b/i.test(prompt) ||
    /\bwhatsapp\b/i.test(prompt) ||
    /\bopen\s*ai\b/i.test(prompt) ||
    /\bstripe\b/i.test(prompt) ||
    /\bzendesk\b/i.test(prompt) ||
    /\bzapier\b/i.test(prompt) ||
    /\bwebhooks?\b/i.test(prompt) ||
    /\bapi\s+keys?\b/i.test(prompt) ||
    /\baccounting\b/i.test(prompt)
  );
}

function hasConnectedConfiguredCue(prompt: string): boolean {
  return (
    /\b(?:connected|configured|enabled|set\s+up|ready|working|live)\b/i.test(
      prompt,
    ) ||
    /\b(?:platform\s+default|own\s+(?:api\s+)?key|byok)\b/i.test(prompt) ||
    /\bintegration\s+health\b/i.test(prompt) ||
    /\bintegrations?\s+(?:are\s+)?connected\b/i.test(prompt)
  );
}

export function parseIntegrationHealthFocusFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): IntegrationHealthFocus | undefined {
  const fromParams = params.integrationFocus;
  if (typeof fromParams === 'string') {
    const normalized = fromParams.trim().toLowerCase();
    if (normalized === 'apikeys' || normalized === 'api_keys') return 'apiKeys';
    if (
      [
        'whatsapp',
        'openai',
        'stripe',
        'zendesk',
        'zapier',
        'webhooks',
        'apikeys',
        'accounting',
      ].includes(normalized)
    ) {
      return normalized === 'apikeys'
        ? 'apiKeys'
        : (normalized as IntegrationHealthFocus);
    }
  }

  if (/\bwhatsapp\b/i.test(prompt)) return 'whatsapp';
  if (/\bopen\s*ai\b/i.test(prompt)) return 'openai';
  if (/\bstripe\b/i.test(prompt)) return 'stripe';
  if (/\bzendesk\b/i.test(prompt)) return 'zendesk';
  if (/\bzapier\b/i.test(prompt)) return 'zapier';
  if (/\bwebhooks?\b/i.test(prompt)) return 'webhooks';
  if (/\bapi\s+keys?\b/i.test(prompt)) return 'apiKeys';
  if (/\baccounting\b/i.test(prompt)) return 'accounting';
  return undefined;
}

function isBulkListIntegrationHealthPrompt(prompt: string): boolean {
  return (
    /\b(list|show|check|status)\b/i.test(prompt) &&
    /\b(integration\s+health|integrations?\s+health|integration\s+status)\b/i.test(
      prompt,
    )
  );
}

export function isExplainIntegrationHealthPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isConfigureWhatsappIntegrationPrompt(text)) return false;
  if (isExplainServiceOnlinePaymentSetupPrompt(text)) return false;
  if (isConfigureOpenaiIntegrationPrompt(text)) return false;
  if (
    /\b(configure|connect|enable|disable|turn\s+on|turn\s+off|set\s+up|update|rotate|create|delete|sync|run)\b/i.test(
      text,
    ) &&
    !/\b(is|are|do|does|explain|describe|which|what)\b/i.test(text)
  ) {
    return false;
  }

  if (isBulkListIntegrationHealthPrompt(text)) return false;

  if (!hasExplainReadCue(text)) return false;
  if (!hasIntegrationHealthSurface(text)) return false;
  if (
    !hasConnectedConfiguredCue(text) &&
    !/\bintegration\s+health\b/i.test(text)
  ) {
    return false;
  }

  return true;
}

export function parseExplainIntegrationHealthFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { integrationFocus?: IntegrationHealthFocus } | null {
  if (!isExplainIntegrationHealthPrompt(prompt)) return null;
  const integrationFocus = parseIntegrationHealthFocusFromPrompt(
    prompt,
    params,
  );
  return integrationFocus ? { integrationFocus } : {};
}

/** NL rescue when classifier mislabels integration health explain prompts. */
export function rescueExplainIntegrationHealthIntent(
  prompt: string,
  action: string,
): {
  action: IntegrationHealthReadIntent;
  rescueReason: string;
} | null {
  if (isIntegrationHealthReadIntent(action)) return null;
  if (!isExplainIntegrationHealthPrompt(prompt)) return null;
  return {
    action: EXPLAIN_INTEGRATION_HEALTH_INTENT,
    rescueReason: EXPLAIN_INTEGRATION_HEALTH_INTENT,
  };
}
