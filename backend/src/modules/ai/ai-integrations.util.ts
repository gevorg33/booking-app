import { isExportAccountingPrompt } from './ai-payments.util.js';
import {
  isExplainIntegrationHealthPrompt,
  parseExplainIntegrationHealthFromPrompt,
  rescueExplainIntegrationHealthIntent,
} from './ai-explain-integration-health.util.js';
import {
  enrichOpenaiIntegrationParamsFromPrompt,
  isConfigureOpenaiIntegrationPrompt,
  rescueConfigureOpenaiIntegrationIntent,
} from './ai-openai-integration.util.js';
import {
  isRequestGiftCardCancelPrompt,
  isRequestGiftCardModifyPrompt,
} from './ai-customer-crm.util.js';
import { isReportBookingProblemPrompt } from './ai-report-booking-problem.util.js';

export const DASHBOARD_INTEGRATIONS_MUTATE_INTENTS = [
  'create_webhook',
  'delete_webhook',
  'toggle_webhook',
  'rotate_api_key',
  'create_api_key',
  'revoke_api_key',
  'configure_distribution_channels',
  'configure_zapier',
  'configure_openai_integration',
  'run_accounting_export',
  'configure_zendesk',
  'create_support_ticket',
  'sync_customer_to_zendesk',
  'configure_marketing_registration_email',
] as const;

export const DASHBOARD_INTEGRATIONS_READ_INTENTS = [
  'list_webhooks',
  'test_webhook',
  'list_zapier_triggers',
  'list_integration_health',
  'explain_integration_health',
] as const;

export const CUSTOMER_INTEGRATIONS_INTENTS = [
  'contact_support',
  'open_ticket_for_order',
] as const;

export const INTEGRATIONS_INTENTS = [
  ...DASHBOARD_INTEGRATIONS_MUTATE_INTENTS,
  ...DASHBOARD_INTEGRATIONS_READ_INTENTS,
  ...CUSTOMER_INTEGRATIONS_INTENTS,
] as const;

export type IntegrationsIntent = (typeof INTEGRATIONS_INTENTS)[number];

export interface IntegrationsCompoundStep {
  action: IntegrationsIntent;
  params: Record<string, unknown>;
  segment: string;
}

const INTEGRATIONS_VERB =
  /\b(list|create|delete|remove|disable|pause|resume|test|rotate|configure|run|sync|contact|open|show|enable|webhook|webhooks|api\s*key|zapier|openai|accounting|export|zendesk|support|ticket|customer|marketing|registration|email|health|integration|integrations)\b/i;

const COMPOUND_NEXT =
  '(?:list|create|delete|remove|disable|pause|resume|test|rotate|configure|run|sync|contact|open|show|enable|webhook|webhooks|api|key|zapier|openai|accounting|export|zendesk|support|ticket|customer|marketing|registration|email|health|integration|integrations)';

const COMPOUND_SPLIT = new RegExp(
  `\\s*;\\s*|\\s+and\\s+(?=${COMPOUND_NEXT}\\b)|\\s+then\\s+(?=${COMPOUND_NEXT}\\b)`,
  'i',
);

const WEBHOOK_EVENT_RE =
  /\b(booking\.created|booking\.cancelled|booking\.completed|booking\.rescheduled|payment\.received|review\.received)\b/gi;

export function isIntegrationsIntent(
  action: string,
): action is IntegrationsIntent {
  return (INTEGRATIONS_INTENTS as readonly string[]).includes(action);
}

export function isListWebhooksPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    /\bwebhooks?\b/i.test(prompt) &&
    !/\b(create|test|zapier)\b/i.test(prompt)
  );
}

export function isCreateWebhookPrompt(prompt: string): boolean {
  return (
    /\b(create|add|register|set\s+up)\b/i.test(prompt) &&
    /\bwebhook\b/i.test(prompt) &&
    !/\b(test|zapier)\b/i.test(prompt)
  );
}

export function isTestWebhookPrompt(prompt: string): boolean {
  return (
    /\b(test|ping|send\s+test)\b/i.test(prompt) && /\bwebhook\b/i.test(prompt)
  );
}

export function isDeleteWebhookPrompt(prompt: string): boolean {
  return (
    /\b(delete|remove|drop|unregister|get\s+rid\s+of)\b/i.test(prompt) &&
    /\bwebhooks?\b/i.test(prompt) &&
    !/\b(create|add|register|set\s+up|test|zapier)\b/i.test(prompt)
  );
}

export function isToggleWebhookPrompt(prompt: string): boolean {
  return (
    /\b(enable|disable|turn\s+(?:on|off)|pause|resume|activate|deactivate|reactivate)\b/i.test(
      prompt,
    ) &&
    /\bwebhooks?\b/i.test(prompt) &&
    !/\b(create|add|register|delete|remove|test|zapier)\b/i.test(prompt)
  );
}

export function resolveWebhookEnabledFromPrompt(
  prompt: string,
): boolean | undefined {
  if (!/\bwebhooks?\b/i.test(prompt)) return undefined;
  if (/\b(disable|turn\s+off|pause|deactivate)\b/i.test(prompt)) return false;
  if (/\b(enable|turn\s+on|resume|activate|reactivate)\b/i.test(prompt)) {
    return true;
  }
  return undefined;
}

export function isRotateApiKeyPrompt(prompt: string): boolean {
  return (
    /\b(rotate|renew|replace|create)\b/i.test(prompt) &&
    /\b(api\s*keys?|keys?)\b/i.test(prompt)
  );
}

export function isListZapierTriggersPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    /\b(zapier|triggers?|automation)\b/i.test(prompt) &&
    !/\b(configure|enable|set\s+up)\b/i.test(prompt)
  );
}

export function isConfigureZapierPrompt(prompt: string): boolean {
  return (
    /\b(configure|enable|set\s+up|turn\s+on|disable|turn\s+off)\b/i.test(
      prompt,
    ) && /\bzapier\b/i.test(prompt)
  );
}

export function isRunAccountingExportPrompt(prompt: string): boolean {
  return (
    /\b(run|execute|trigger)\b/i.test(prompt) &&
    /\baccounting\s+export\b/i.test(prompt)
  );
}

export function isConfigureZendeskPrompt(prompt: string): boolean {
  return (
    /\b(configure|enable|set\s+up|turn\s+on|disable)\b/i.test(prompt) &&
    /\bzendesk\b/i.test(prompt) &&
    !/\b(sync\s+customer|ticket|support)\b/i.test(prompt)
  );
}

export function isCreateSupportTicketPrompt(prompt: string): boolean {
  return (
    /\b(create|open|submit)\b/i.test(prompt) &&
    /\b(support\s+ticket|ticket)\b/i.test(prompt) &&
    !/\b(gift\s*card|order|my)\b/i.test(prompt)
  );
}

export function isSyncCustomerToZendeskPrompt(prompt: string): boolean {
  return (
    /\b(sync|push|export)\b/i.test(prompt) &&
    /\bcustomer\b/i.test(prompt) &&
    /\bzendesk\b/i.test(prompt)
  );
}

export function isConfigureMarketingRegistrationEmailPrompt(
  prompt: string,
): boolean {
  return (
    /\b(configure|enable|set\s+up|update)\b/i.test(prompt) &&
    /\b(marketing|registration)\b/i.test(prompt) &&
    /\b(email|notification|notifications)\b/i.test(prompt)
  );
}

export function isListIntegrationHealthPrompt(prompt: string): boolean {
  return (
    /\b(list|show|check|status)\b/i.test(prompt) &&
    /\b(integration\s+health|integrations?\s+health|integration\s+status)\b/i.test(
      prompt,
    )
  );
}

export function isContactSupportPrompt(prompt: string): boolean {
  if (isReportBookingProblemPrompt(prompt)) return false;
  return (
    /\b(contact|reach|message)\b/i.test(prompt) &&
    /\bsupport\b/i.test(prompt) &&
    !/\b(zendesk|configure|create\s+ticket)\b/i.test(prompt)
  );
}

export function isOpenTicketForOrderPrompt(prompt: string): boolean {
  return (
    /\b(open|create|submit)\b/i.test(prompt) &&
    /\bticket\b/i.test(prompt) &&
    /\b(gift\s*card|order|booking)\b/i.test(prompt) &&
    !isRequestGiftCardModifyPrompt(prompt) &&
    !isRequestGiftCardCancelPrompt(prompt)
  );
}

export function isIntegrationsCompoundPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 20 || !INTEGRATIONS_VERB.test(trimmed)) return false;
  if (
    isRequestGiftCardModifyPrompt(trimmed) ||
    isRequestGiftCardCancelPrompt(trimmed)
  ) {
    return false;
  }
  return (
    COMPOUND_SPLIT.test(trimmed) ||
    decomposeIntegrationsCompoundPrompt(trimmed).length > 1
  );
}

export function extractWebhookUrlFromPrompt(prompt: string): string | null {
  const url = prompt.match(/\b(https?:\/\/[^\s,;]+)\b/i);
  return url?.[1]?.trim() ?? null;
}

export function extractWebhookEventsFromPrompt(prompt: string): string[] {
  const matches = [...prompt.matchAll(WEBHOOK_EVENT_RE)].map((m) =>
    m[1].toLowerCase(),
  );
  return [...new Set(matches)];
}

export function extractWebhookIdFromPrompt(prompt: string): string | null {
  const uuid = prompt.match(
    /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  if (uuid) return uuid[1];
  const webhookWord = prompt.match(/\bwebhook\s+([0-9a-f-]{8,})\b/i);
  return webhookWord?.[1] ?? null;
}

export function extractApiKeyNameFromPrompt(prompt: string): string | null {
  const named = prompt.match(/\b(?:named|called|name)\s+"([^"]+)"/i);
  if (named) return named[1].trim();
  const forMatch = prompt.match(
    /\bfor\s+([A-Za-z][\w\s-]{1,40}?)(?:\s+and|\s*$)/i,
  );
  return forMatch?.[1]?.trim() ?? null;
}

export function extractApiKeyIdFromPrompt(prompt: string): string | null {
  const uuid = prompt.match(
    /\b(?:key|api\s*key)\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  return uuid?.[1] ?? null;
}

export function extractCustomerNameFromPrompt(prompt: string): string | null {
  const toZendesk = prompt.match(
    /\bcustomer\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+to\s+zendesk/i,
  );
  if (toZendesk) return toZendesk[1].trim();
  const syncMatch = prompt.match(
    /\bsync\s+customer\s+([A-Za-z][\w\s'-]{1,30}?)(?:\s+to|\s+and|\s*$)/i,
  );
  if (syncMatch) return syncMatch[1].trim();
  const named = prompt.match(/\b(?:Anna|Maria|John|[A-Z][a-z]{2,})\b/);
  return named?.[0]?.trim() ?? null;
}

export function extractZendeskSubdomainFromPrompt(
  prompt: string,
): string | null {
  const subdomain = prompt.match(/\bsubdomain\s+([a-z0-9-]+)\b/i);
  if (subdomain) return subdomain[1].trim();
  const host = prompt.match(/\b([a-z0-9-]+)\.zendesk\.com\b/i);
  return host?.[1]?.trim() ?? null;
}

export function extractTicketSubjectFromPrompt(prompt: string): string | null {
  const subject = prompt.match(/\bsubject\s+"([^"]+)"/i);
  if (subject) return subject[1].trim();
  const about = prompt.match(/\babout\s+(.+?)(?:\s+and|\s*$)/i);
  return about?.[1]?.trim() ?? null;
}

export function extractTicketBodyFromPrompt(prompt: string): string | null {
  const body = prompt.match(/\bbody\s+"([^"]+)"/i);
  if (body) return body[1].trim();
  const message = prompt.match(/\bmessage\s+"([^"]+)"/i);
  return message?.[1]?.trim() ?? null;
}

export function extractGiftCardIdFromPrompt(prompt: string): string | null {
  const uuid = prompt.match(
    /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  if (uuid) return uuid[1];
  const orderWord = prompt.match(/\border\s+([0-9a-f-]{8,})\b/i);
  return orderWord?.[1] ?? null;
}

export function extractBookingIdFromPrompt(prompt: string): string | null {
  const booking = prompt.match(
    /\bbooking\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  return booking?.[1] ?? null;
}

export function extractMarketingEmailsFromPrompt(prompt: string): string[] {
  const emails = [
    ...prompt.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi),
  ].map((m) => m[0].toLowerCase());
  return [...new Set(emails)];
}

export function parseFirstActiveWebhook<
  T extends { id: string; isActive?: boolean },
>(webhooks: T[]): T | null {
  return webhooks.find((w) => w.isActive !== false) ?? webhooks[0] ?? null;
}

export function buildBookingCreatedTestPayload(
  businessId: string,
): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    event: 'booking.created',
    businessId,
    aggregateId: '00000000-0000-0000-0000-000000000001',
    timestamp: now,
    payload: {
      customerName: 'Jane Doe',
      serviceName: 'Haircut',
      employeeName: 'Alex',
      startTime: now,
    },
  };
}

export async function sendTestWebhookDelivery(
  url: string,
  payload: Record<string, unknown>,
): Promise<{ success: boolean; status?: number; message: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: `HTTP ${response.status}`,
      };
    }
    return {
      success: true,
      status: response.status,
      message: 'Delivery accepted',
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Webhook delivery failed';
    return { success: false, message };
  }
}

export function resolveZapierEnabledFromPrompt(
  prompt: string,
): boolean | undefined {
  if (/\b(disable|turn\s+off)\b/i.test(prompt)) return false;
  if (/\b(enable|turn\s+on|configure|set\s+up)\b/i.test(prompt)) return true;
  return undefined;
}

export function resolveZendeskSyncEnabledFromPrompt(
  prompt: string,
): boolean | undefined {
  if (/\b(disable|turn\s+off)\s+sync/i.test(prompt)) return false;
  if (/\bsync\s+customers?\s+enabled\b/i.test(prompt)) return true;
  return undefined;
}

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescueIntegrationsIntent(
  prompt: string,
  action: string,
): { action: IntegrationsIntent; rescueReason: string } | null {
  if (isIntegrationsIntent(action)) return null;
  if (isIntegrationsCompoundPrompt(prompt)) return null;
  if (
    isRequestGiftCardModifyPrompt(prompt) ||
    isRequestGiftCardCancelPrompt(prompt)
  )
    return null;

  if (isRunAccountingExportPrompt(prompt)) {
    return {
      action: 'run_accounting_export',
      rescueReason: 'run_accounting_export',
    };
  }
  if (
    isExportAccountingPrompt(prompt) &&
    !isRunAccountingExportPrompt(prompt)
  ) {
    return null;
  }

  if (isContactSupportPrompt(prompt)) {
    return { action: 'contact_support', rescueReason: 'contact_support' };
  }
  if (isOpenTicketForOrderPrompt(prompt)) {
    return {
      action: 'open_ticket_for_order',
      rescueReason: 'open_ticket_for_order',
    };
  }

  const explainIntegrationHealth = rescueExplainIntegrationHealthIntent(
    prompt,
    action,
  );
  if (explainIntegrationHealth) return explainIntegrationHealth;

  if (isListIntegrationHealthPrompt(prompt)) {
    return {
      action: 'list_integration_health',
      rescueReason: 'integration_health',
    };
  }
  if (isConfigureMarketingRegistrationEmailPrompt(prompt)) {
    return {
      action: 'configure_marketing_registration_email',
      rescueReason: 'marketing_email',
    };
  }
  const openaiIntegration = rescueConfigureOpenaiIntegrationIntent(
    prompt,
    action,
  );
  if (openaiIntegration) return openaiIntegration;
  if (isSyncCustomerToZendeskPrompt(prompt)) {
    return { action: 'sync_customer_to_zendesk', rescueReason: 'sync_zendesk' };
  }
  if (isCreateSupportTicketPrompt(prompt)) {
    return { action: 'create_support_ticket', rescueReason: 'support_ticket' };
  }
  if (isConfigureZendeskPrompt(prompt)) {
    return { action: 'configure_zendesk', rescueReason: 'configure_zendesk' };
  }
  if (isListZapierTriggersPrompt(prompt)) {
    return { action: 'list_zapier_triggers', rescueReason: 'zapier_triggers' };
  }
  if (isConfigureZapierPrompt(prompt)) {
    return { action: 'configure_zapier', rescueReason: 'configure_zapier' };
  }
  if (isRotateApiKeyPrompt(prompt)) {
    return { action: 'rotate_api_key', rescueReason: 'rotate_api_key' };
  }
  if (isTestWebhookPrompt(prompt)) {
    return { action: 'test_webhook', rescueReason: 'test_webhook' };
  }
  if (isDeleteWebhookPrompt(prompt)) {
    return { action: 'delete_webhook', rescueReason: 'delete_webhook' };
  }
  if (isToggleWebhookPrompt(prompt)) {
    return { action: 'toggle_webhook', rescueReason: 'toggle_webhook' };
  }
  if (isCreateWebhookPrompt(prompt)) {
    return { action: 'create_webhook', rescueReason: 'create_webhook' };
  }
  if (isListWebhooksPrompt(prompt)) {
    return { action: 'list_webhooks', rescueReason: 'list_webhooks' };
  }

  return null;
}

function classifyIntegrationsSegment(
  segment: string,
): IntegrationsCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const base: Record<string, unknown> = {};
  const webhookUrl = extractWebhookUrlFromPrompt(text);
  if (webhookUrl) base.url = webhookUrl;
  const events = extractWebhookEventsFromPrompt(text);
  if (events.length) base.events = events;
  const webhookId = extractWebhookIdFromPrompt(text);
  if (webhookId) base.webhookId = webhookId;
  const apiKeyName = extractApiKeyNameFromPrompt(text);
  if (apiKeyName) base.apiKeyName = apiKeyName;
  const keyId = extractApiKeyIdFromPrompt(text);
  if (keyId) base.keyId = keyId;
  const customerName = extractCustomerNameFromPrompt(text);
  if (customerName) base.customerName = customerName;
  const subdomain = extractZendeskSubdomainFromPrompt(text);
  if (subdomain) base.subdomain = subdomain;
  const subject = extractTicketSubjectFromPrompt(text);
  if (subject) base.subject = subject;
  const body = extractTicketBodyFromPrompt(text);
  if (body) base.body = body;
  const giftCardId = extractGiftCardIdFromPrompt(text);
  if (giftCardId) base.giftCardId = giftCardId;
  const bookingId = extractBookingIdFromPrompt(text);
  if (bookingId) base.bookingId = bookingId;
  const emails = extractMarketingEmailsFromPrompt(text);
  if (emails.length) base.marketingTeamEmails = emails;
  const zapierEnabled = resolveZapierEnabledFromPrompt(text);
  if (zapierEnabled !== undefined) base.enabled = zapierEnabled;
  const webhookEnabled = resolveWebhookEnabledFromPrompt(text);
  if (webhookEnabled !== undefined) base.enabled = webhookEnabled;
  const syncEnabled = resolveZendeskSyncEnabledFromPrompt(text);
  if (syncEnabled !== undefined) base.syncCustomersEnabled = syncEnabled;
  if (/\bthis\s+month\b/i.test(text)) base.dateRange = 'this_month';

  if (isListWebhooksPrompt(text)) {
    return { action: 'list_webhooks', params: base, segment: text };
  }
  if (isDeleteWebhookPrompt(text)) {
    return { action: 'delete_webhook', params: base, segment: text };
  }
  if (isToggleWebhookPrompt(text)) {
    return { action: 'toggle_webhook', params: base, segment: text };
  }
  if (
    isCreateWebhookPrompt(text) ||
    (/\bcreate\b/i.test(text) && /\bwebhook\b/i.test(text))
  ) {
    return { action: 'create_webhook', params: base, segment: text };
  }
  if (isTestWebhookPrompt(text)) {
    return { action: 'test_webhook', params: base, segment: text };
  }
  if (isRotateApiKeyPrompt(text)) {
    return { action: 'rotate_api_key', params: base, segment: text };
  }
  if (isListZapierTriggersPrompt(text)) {
    return { action: 'list_zapier_triggers', params: base, segment: text };
  }
  if (isConfigureZapierPrompt(text)) {
    return { action: 'configure_zapier', params: base, segment: text };
  }
  if (
    isRunAccountingExportPrompt(text) ||
    (/\brun\b/i.test(text) && /\baccounting\b/i.test(text))
  ) {
    return { action: 'run_accounting_export', params: base, segment: text };
  }
  if (isConfigureZendeskPrompt(text)) {
    return { action: 'configure_zendesk', params: base, segment: text };
  }
  if (isCreateSupportTicketPrompt(text)) {
    return { action: 'create_support_ticket', params: base, segment: text };
  }
  if (isSyncCustomerToZendeskPrompt(text)) {
    return { action: 'sync_customer_to_zendesk', params: base, segment: text };
  }
  if (isConfigureMarketingRegistrationEmailPrompt(text)) {
    return {
      action: 'configure_marketing_registration_email',
      params: base,
      segment: text,
    };
  }
  if (isConfigureOpenaiIntegrationPrompt(text)) {
    return {
      action: 'configure_openai_integration',
      params: enrichOpenaiIntegrationParamsFromPrompt(base, text),
      segment: text,
    };
  }
  if (isExplainIntegrationHealthPrompt(text)) {
    const parsed = parseExplainIntegrationHealthFromPrompt(text, base);
    return {
      action: 'explain_integration_health',
      params: parsed ? { ...base, ...parsed } : base,
      segment: text,
    };
  }
  if (isListIntegrationHealthPrompt(text)) {
    return { action: 'list_integration_health', params: base, segment: text };
  }
  if (isContactSupportPrompt(text)) {
    return { action: 'contact_support', params: base, segment: text };
  }
  if (isOpenTicketForOrderPrompt(text)) {
    return { action: 'open_ticket_for_order', params: base, segment: text };
  }
  return null;
}

/** Deterministic multi-command split for integrations operations. */
export function decomposeIntegrationsCompoundPrompt(
  prompt: string,
): IntegrationsCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const segments = trimmed.split(COMPOUND_SPLIT).map((s) => s.trim());
  const nonEmpty = segments.filter(Boolean);

  if (nonEmpty.length <= 1) {
    const single = classifyIntegrationsSegment(trimmed);
    return single ? [single] : [];
  }

  const steps: IntegrationsCompoundStep[] = [];
  for (const segment of segments) {
    const step = classifyIntegrationsSegment(segment);
    if (step) steps.push(step);
  }
  return steps;
}
