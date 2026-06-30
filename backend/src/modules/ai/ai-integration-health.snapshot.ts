import { getBusinessStripeIntegration } from '../billing/stripe-integration.types.js';
import type { OpenAiIntegrationService } from '../integrations/openai/openai-integration.service.js';
import type { WhatsAppIntegrationService } from '../notifications/whatsapp-integration.service.js';
import type { ApiKeyService } from '../integrations/api-key.service.js';
import type { WebhooksService } from '../integrations/webhooks.service.js';
import type { ZapierIntegrationService } from '../integrations/zapier/zapier-integration.service.js';
import type { AccountingIntegrationService } from '../integrations/accounting/accounting-integration.service.js';
import type { ZendeskIntegrationService } from '../integrations/zendesk/zendesk-integration.service.js';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';

export type IntegrationHealthFocus =
  | 'whatsapp'
  | 'openai'
  | 'stripe'
  | 'zendesk'
  | 'zapier'
  | 'webhooks'
  | 'apiKeys'
  | 'accounting';

export type IntegrationHealthAreaSnapshot = {
  configured: boolean;
  summary: string;
};

export type IntegrationHealthSnapshot = {
  webhooks: IntegrationHealthAreaSnapshot & { count: number; active: number };
  apiKeys: IntegrationHealthAreaSnapshot & { count: number };
  zendesk: IntegrationHealthAreaSnapshot & {
    enabled: boolean;
    syncCustomersEnabled: boolean;
  };
  zapier: IntegrationHealthAreaSnapshot & {
    enabled: boolean;
    triggerCount: number;
  };
  accounting: IntegrationHealthAreaSnapshot & {
    enabled: boolean;
    provider?: string;
  };
  whatsapp: IntegrationHealthAreaSnapshot & {
    usingPlatformDefault: boolean;
    phoneNumberId?: string;
  };
  openAi: IntegrationHealthAreaSnapshot & { usingPlatformDefault: boolean };
  stripe: IntegrationHealthAreaSnapshot & { connectAccountId?: string };
};

export interface IntegrationHealthSnapshotDeps {
  webhooksService: WebhooksService;
  apiKeyService: ApiKeyService;
  zapierIntegrationService: ZapierIntegrationService;
  openAiIntegrationService: OpenAiIntegrationService;
  accountingIntegrationService: AccountingIntegrationService;
  zendeskIntegrationService: ZendeskIntegrationService;
  whatsappIntegrationService?: Pick<
    WhatsAppIntegrationService,
    'getPublicSettings'
  >;
  businessRepo: Pick<Repository<Business>, 'findOne'>;
}

function describeWhatsAppHealth(input: {
  configured: boolean;
  usingPlatformDefault: boolean;
  phoneNumberId?: string;
}): string {
  if (!input.configured) {
    return 'WhatsApp: not connected — configure in Settings → WhatsApp.';
  }
  if (input.usingPlatformDefault) {
    return 'WhatsApp: connected via platform default.';
  }
  const phone = input.phoneNumberId ? ` (phone number ID ${input.phoneNumberId})` : '';
  return `WhatsApp: connected with salon credentials${phone}.`;
}

function describeOpenAiHealth(input: {
  configured: boolean;
  usingPlatformDefault: boolean;
}): string {
  if (!input.configured) {
    return 'OpenAI: not configured — add a platform default or BYOK key in Settings → OpenAI.';
  }
  return input.usingPlatformDefault
    ? 'OpenAI: configured using platform default API key.'
    : 'OpenAI: configured with salon BYOK API key.';
}

function describeStripeHealth(input: {
  connected: boolean;
  connectAccountId?: string;
}): string {
  if (!input.connected) {
    return 'Stripe Connect: not connected — complete Billing onboarding before online prepayment.';
  }
  const suffix = input.connectAccountId ? ` (${input.connectAccountId})` : '';
  return `Stripe Connect: connected${suffix}.`;
}

export async function loadIntegrationHealthSnapshot(
  deps: IntegrationHealthSnapshotDeps,
  businessId: string,
): Promise<IntegrationHealthSnapshot> {
  const [webhooks, apiKeys, zendesk, zapier, accounting, openAi, whatsapp, business] =
    await Promise.all([
      deps.webhooksService.listSubscriptions(businessId),
      deps.apiKeyService.listKeys(businessId),
      deps.zendeskIntegrationService.getPublicSettings(businessId),
      deps.zapierIntegrationService.getPublicSettings(businessId),
      deps.accountingIntegrationService.getPublicSettings(businessId),
      deps.openAiIntegrationService.getPublicSettings(businessId),
      deps.whatsappIntegrationService
        ? deps.whatsappIntegrationService.getPublicSettings(businessId)
        : Promise.resolve({
            configured: false,
            usingPlatformDefault: false,
            phoneNumberId: undefined,
          }),
      deps.businessRepo.findOne({ where: { id: businessId } }),
    ]);

  const stripe = getBusinessStripeIntegration(business?.settings ?? {});
  const stripeConnected = Boolean(stripe.connectAccountId);

  const webhooksConfigured = webhooks.length > 0;
  const apiKeysConfigured = apiKeys.length > 0;

  return {
    webhooks: {
      configured: webhooksConfigured,
      count: webhooks.length,
      active: webhooks.filter((w) => w.isActive).length,
      summary: webhooksConfigured
        ? `Webhooks: ${webhooks.length} subscription(s), ${webhooks.filter((w) => w.isActive).length} active.`
        : 'Webhooks: none configured.',
    },
    apiKeys: {
      configured: apiKeysConfigured,
      count: apiKeys.length,
      summary: apiKeysConfigured
        ? `API keys: ${apiKeys.length} active key(s).`
        : 'API keys: none created.',
    },
    zendesk: {
      configured: zendesk.configured,
      enabled: zendesk.enabled,
      syncCustomersEnabled: zendesk.syncCustomersEnabled,
      summary: zendesk.configured
        ? `Zendesk: connected${zendesk.enabled ? ' and enabled' : ' but disabled'}${zendesk.syncCustomersEnabled ? '; customer sync on' : ''}.`
        : 'Zendesk: not connected.',
    },
    zapier: {
      configured: zapier.enabled,
      enabled: zapier.enabled,
      triggerCount: zapier.webhookEvents.length,
      summary: zapier.enabled
        ? `Zapier: enabled with ${zapier.webhookEvents.length} trigger event(s).`
        : 'Zapier: disabled.',
    },
    accounting: {
      configured: accounting.enabled,
      enabled: accounting.enabled,
      provider: accounting.provider,
      summary: accounting.enabled
        ? `Accounting export: enabled (${accounting.provider ?? 'provider not set'}).`
        : 'Accounting export: disabled.',
    },
    whatsapp: {
      configured: whatsapp.configured,
      usingPlatformDefault: whatsapp.usingPlatformDefault,
      phoneNumberId: whatsapp.phoneNumberId,
      summary: describeWhatsAppHealth(whatsapp),
    },
    openAi: {
      configured: openAi.configured,
      usingPlatformDefault: openAi.usingPlatformDefault,
      summary: describeOpenAiHealth(openAi),
    },
    stripe: {
      configured: stripeConnected,
      connectAccountId: stripe.connectAccountId,
      summary: describeStripeHealth({
        connected: stripeConnected,
        connectAccountId: stripe.connectAccountId,
      }),
    },
  };
}

export function countConfiguredIntegrationAreas(
  snapshot: IntegrationHealthSnapshot,
): number {
  return [
    snapshot.webhooks.configured,
    snapshot.apiKeys.configured,
    snapshot.zendesk.configured,
    snapshot.zapier.enabled,
    snapshot.accounting.enabled,
    snapshot.whatsapp.configured,
    snapshot.openAi.configured,
    snapshot.stripe.configured,
  ].filter(Boolean).length;
}

export function buildIntegrationHealthOverviewSummary(
  snapshot: IntegrationHealthSnapshot,
): string {
  const configuredCount = countConfiguredIntegrationAreas(snapshot);
  return [
    `${configuredCount}/8 integration area(s) configured.`,
    snapshot.whatsapp.summary,
    snapshot.openAi.summary,
    snapshot.stripe.summary,
    snapshot.zendesk.summary,
    snapshot.zapier.summary,
    snapshot.webhooks.summary,
    snapshot.apiKeys.summary,
    snapshot.accounting.summary,
  ].join(' ');
}

export function buildFocusedIntegrationHealthSummary(
  snapshot: IntegrationHealthSnapshot,
  focus: IntegrationHealthFocus,
): string {
  switch (focus) {
    case 'whatsapp':
      return snapshot.whatsapp.summary;
    case 'openai':
      return snapshot.openAi.summary;
    case 'stripe':
      return snapshot.stripe.summary;
    case 'zendesk':
      return snapshot.zendesk.summary;
    case 'zapier':
      return snapshot.zapier.summary;
    case 'webhooks':
      return snapshot.webhooks.summary;
    case 'apiKeys':
      return snapshot.apiKeys.summary;
    case 'accounting':
      return snapshot.accounting.summary;
    default:
      return buildIntegrationHealthOverviewSummary(snapshot);
  }
}

export function integrationHealthNavigatePath(
  focus?: IntegrationHealthFocus,
): { path: string; label: string } {
  switch (focus) {
    case 'whatsapp':
      return { path: '/dashboard/settings', label: 'Open WhatsApp settings' };
    case 'openai':
      return { path: '/dashboard/settings', label: 'Open OpenAI settings' };
    case 'stripe':
      return { path: '/dashboard/billing', label: 'Open Billing' };
    case 'zendesk':
      return {
        path: '/dashboard/settings/integrations',
        label: 'Open Integrations settings',
      };
    case 'zapier':
      return {
        path: '/dashboard/settings/integrations',
        label: 'Open Integrations settings',
      };
    case 'webhooks':
    case 'apiKeys':
      return {
        path: '/dashboard/settings/integrations',
        label: 'Open Integrations settings',
      };
    case 'accounting':
      return {
        path: '/dashboard/settings/integrations',
        label: 'Open Integrations settings',
      };
    default:
      return {
        path: '/dashboard/settings/integrations',
        label: 'Open Integrations settings',
      };
  }
}
