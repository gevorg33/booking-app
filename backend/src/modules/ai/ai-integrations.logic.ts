import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import type { ApiKeyService } from '../integrations/api-key.service.js';
import type { WebhooksService } from '../integrations/webhooks.service.js';
import type { ZapierIntegrationService } from '../integrations/zapier/zapier-integration.service.js';
import type { AccountingIntegrationService } from '../integrations/accounting/accounting-integration.service.js';
import type { ZendeskIntegrationService } from '../integrations/zendesk/zendesk-integration.service.js';
import type { IntegrationsDocsService } from '../integrations/integrations-docs.service.js';
import type { OpenAiIntegrationService } from '../integrations/openai/openai-integration.service.js';
import type { WhatsAppIntegrationService } from '../notifications/whatsapp-integration.service.js';
import { mergeMarketingNotificationSettings } from '../notifications/marketing-notification-settings.util.js';
import type { CommandResult } from './command-completion.types.js';
import { handleConfigureOpenaiIntegrationLogic } from './ai-openai-integration.logic.js';
import { handleExplainIntegrationHealthLogic } from './ai-explain-integration-health.logic.js';
import {
  countConfiguredIntegrationAreas,
  loadIntegrationHealthSnapshot,
} from './ai-integration-health.snapshot.js';
import {
  buildGuideSupportTicketPayload,
  parseGuideSupportSnapshot,
} from './guide/guide-support-handoff.util.js';
import { extractDateRangeFromPrompt } from './ai-orchestration.helpers.js';
import {
  buildBookingCreatedTestPayload,
  decomposeIntegrationsCompoundPrompt,
  extractApiKeyIdFromPrompt,
  extractApiKeyNameFromPrompt,
  extractBookingIdFromPrompt,
  extractCustomerNameFromPrompt,
  extractGiftCardIdFromPrompt,
  extractMarketingEmailsFromPrompt,
  extractTicketBodyFromPrompt,
  extractTicketSubjectFromPrompt,
  extractWebhookEventsFromPrompt,
  extractWebhookIdFromPrompt,
  extractWebhookUrlFromPrompt,
  extractZendeskSubdomainFromPrompt,
  parseFirstActiveWebhook,
  resolveWebhookEnabledFromPrompt,
  resolveZapierEnabledFromPrompt,
  resolveZendeskSyncEnabledFromPrompt,
  sendTestWebhookDelivery,
  type IntegrationsCompoundStep,
} from './ai-integrations.util.js';

export interface IntegrationsLogicDeps {
  webhooksService: WebhooksService;
  apiKeyService: ApiKeyService;
  zapierIntegrationService: ZapierIntegrationService;
  openAiIntegrationService: OpenAiIntegrationService;
  whatsappIntegrationService?: Pick<
    WhatsAppIntegrationService,
    'getPublicSettings'
  >;
  accountingIntegrationService: AccountingIntegrationService;
  zendeskIntegrationService: ZendeskIntegrationService;
  integrationsDocsService?: IntegrationsDocsService;
  businessRepo: Repository<Business>;
  customerRepo: Repository<Customer>;
  giftCardRepo: Repository<GiftCard>;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function resolveSessionCustomerId(
  params: Record<string, any>,
): string | undefined {
  return (
    (params.sessionCustomerId as string | undefined) ??
    (params.customerId as string | undefined)
  );
}

function resolveByName<T extends { name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

async function resolveCustomerByName(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<Customer | null> {
  if (params.customerId) {
    const found = await deps.customerRepo.findOne({
      where: { id: params.customerId as string, businessId },
    });
    return found ?? null;
  }
  const name =
    (params.customerName as string | undefined) ??
    extractCustomerNameFromPrompt(prompt ?? (params._prompt as string) ?? '');
  if (!name) return null;
  const customers = await deps.customerRepo.find({ where: { businessId } });
  return resolveByName(customers, name) ?? null;
}

function resolveAccountingDateRange(
  params: Record<string, any>,
  prompt?: string,
): { from?: string; to?: string } {
  if (params.from || params.to) {
    return {
      from: params.from as string | undefined,
      to: params.to as string | undefined,
    };
  }
  const range = extractDateRangeFromPrompt(
    prompt ?? (params._prompt as string) ?? '',
  );
  if (!range) return {};
  return { from: range.start, to: range.end };
}

export async function handleListWebhooksLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const subscriptions =
    await deps.webhooksService.listSubscriptions(businessId);
  const eventOptions = deps.webhooksService.getEventOptions();
  return success(
    'list_webhooks',
    subscriptions.length
      ? `${subscriptions.length} webhook subscription(s).`
      : 'No webhook subscriptions configured.',
    { subscriptions, eventOptions },
  );
}

export async function handleCreateWebhookLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const url =
    (params.url as string | undefined) ??
    extractWebhookUrlFromPrompt(prompt ?? (params._prompt as string) ?? '');
  const events =
    (params.events as string[] | undefined) ??
    extractWebhookEventsFromPrompt(prompt ?? (params._prompt as string) ?? '');

  if (!url) {
    return failure('create_webhook', 'Provide webhook URL.', {
      clarify: true,
      missing: ['url'],
    });
  }
  if (!events?.length) {
    return failure(
      'create_webhook',
      'Specify webhook events (e.g. booking.created).',
      {
        clarify: true,
        missing: ['events'],
      },
    );
  }

  try {
    const created = await deps.webhooksService.createSubscription(businessId, {
      url,
      events,
      description:
        (params.description as string | undefined) ?? 'AI-created webhook',
    });
    return success(
      'create_webhook',
      `Webhook created for ${events.join(', ')}.`,
      { webhook: created, webhookId: created.id },
    );
  } catch (err: any) {
    return failure(
      'create_webhook',
      err?.message ?? 'Could not create webhook.',
    );
  }
}

interface WebhookSubscriptionSummary {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
}

async function resolveWebhookTarget(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<
  | { target: WebhookSubscriptionSummary }
  | { clarify: CommandResult['details'] }
> {
  const subscriptions = (await deps.webhooksService.listSubscriptions(
    businessId,
  )) as WebhookSubscriptionSummary[];
  if (!subscriptions.length) {
    return { clarify: { clarify: true, missing: ['webhookId'], webhooks: [] } };
  }

  const text = prompt ?? (params._prompt as string) ?? '';
  const webhookId =
    (params.webhookId as string | undefined) ??
    extractWebhookIdFromPrompt(text);
  if (webhookId) {
    const byId = subscriptions.find((s) => s.id === webhookId);
    if (byId) return { target: byId };
  }

  const url =
    (params.url as string | undefined) ?? extractWebhookUrlFromPrompt(text);
  if (url) {
    const needle = url.toLowerCase().replace(/\/+$/, '');
    const byUrl = subscriptions.find(
      (s) => s.url.toLowerCase().replace(/\/+$/, '') === needle,
    );
    if (byUrl) return { target: byUrl };
    const byUrlPartial = subscriptions.find((s) =>
      s.url.toLowerCase().includes(needle),
    );
    if (byUrlPartial) return { target: byUrlPartial };
  }

  if (subscriptions.length === 1) {
    return { target: subscriptions[0] };
  }

  return {
    clarify: {
      clarify: true,
      missing: ['webhookId'],
      webhooks: subscriptions.map((s) => ({
        id: s.id,
        url: s.url,
        events: s.events,
        isActive: s.isActive,
      })),
    },
  };
}

export async function handleDeleteWebhookLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const resolved = await resolveWebhookTarget(deps, businessId, params, prompt);
  if ('clarify' in resolved) {
    const hasAny = Array.isArray(resolved.clarify.webhooks)
      ? resolved.clarify.webhooks.length > 0
      : false;
    return failure(
      'delete_webhook',
      hasAny
        ? 'Which webhook should I delete? Specify its URL or id.'
        : 'There are no webhook subscriptions to delete.',
      resolved.clarify,
    );
  }

  try {
    await deps.webhooksService.deleteSubscription(
      businessId,
      resolved.target.id,
    );
    return success(
      'delete_webhook',
      `Deleted webhook ${resolved.target.url} (${resolved.target.events.join(', ')}).`,
      { webhookId: resolved.target.id, url: resolved.target.url },
    );
  } catch (err: any) {
    return failure(
      'delete_webhook',
      err?.message ?? 'Could not delete webhook.',
    );
  }
}

export async function handleToggleWebhookLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const text = prompt ?? (params._prompt as string) ?? '';
  const enabled =
    typeof params.enabled === 'boolean'
      ? params.enabled
      : resolveWebhookEnabledFromPrompt(text);
  if (enabled === undefined) {
    return failure(
      'toggle_webhook',
      'Should the webhook be enabled or disabled?',
      { clarify: true, missing: ['enabled'] },
    );
  }

  const resolved = await resolveWebhookTarget(deps, businessId, params, prompt);
  if ('clarify' in resolved) {
    const hasAny = Array.isArray(resolved.clarify.webhooks)
      ? resolved.clarify.webhooks.length > 0
      : false;
    return failure(
      'toggle_webhook',
      hasAny
        ? `Which webhook should I ${enabled ? 'enable' : 'disable'}? Specify its URL or id.`
        : 'There are no webhook subscriptions to update.',
      resolved.clarify,
    );
  }

  if (resolved.target.isActive === enabled) {
    return success(
      'toggle_webhook',
      `Webhook ${resolved.target.url} is already ${enabled ? 'enabled' : 'disabled'}.`,
      {
        webhookId: resolved.target.id,
        url: resolved.target.url,
        isActive: enabled,
        changed: false,
      },
    );
  }

  try {
    const updated = await deps.webhooksService.updateSubscription(
      businessId,
      resolved.target.id,
      { isActive: enabled },
    );
    return success(
      'toggle_webhook',
      `Webhook ${updated.url} is now ${enabled ? 'enabled' : 'disabled'}.`,
      {
        webhookId: updated.id,
        url: updated.url,
        isActive: updated.isActive,
        changed: true,
      },
    );
  } catch (err: any) {
    return failure(
      'toggle_webhook',
      err?.message ?? 'Could not update webhook.',
    );
  }
}

export async function handleTestWebhookLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const subscriptions =
    await deps.webhooksService.listSubscriptions(businessId);
  const webhookId =
    (params.webhookId as string | undefined) ??
    extractWebhookIdFromPrompt(prompt ?? (params._prompt as string) ?? '');

  const target = webhookId
    ? (subscriptions.find((s) => s.id === webhookId) ??
      parseFirstActiveWebhook(subscriptions))
    : parseFirstActiveWebhook(subscriptions);

  if (!target) {
    return failure('test_webhook', 'No active webhook subscription to test.', {
      clarify: true,
      missing: ['webhookId'],
    });
  }

  const payload = buildBookingCreatedTestPayload(businessId);
  const delivery = await sendTestWebhookDelivery(target.url, payload);

  return success(
    'test_webhook',
    delivery.success
      ? `Test delivery to ${target.url} succeeded.`
      : `Test delivery failed — ${delivery.message}.`,
    {
      webhookId: target.id,
      url: target.url,
      payload,
      testResult: delivery,
      success: delivery.success,
    },
  );
}

export async function handleRotateApiKeyLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
  prompt?: string,
): Promise<CommandResult> {
  const name =
    (params.apiKeyName as string | undefined) ??
    extractApiKeyNameFromPrompt(prompt ?? (params._prompt as string) ?? '') ??
    `Rotated key ${new Date().toISOString().slice(0, 10)}`;
  const oldKeyId =
    (params.keyId as string | undefined) ??
    extractApiKeyIdFromPrompt(prompt ?? (params._prompt as string) ?? '');

  try {
    const created = await deps.apiKeyService.createKey(
      businessId,
      userId ?? 'system',
      { name },
    );
    let revoked = false;
    if (oldKeyId) {
      await deps.apiKeyService.revokeKey(businessId, oldKeyId);
      revoked = true;
    }
    return success(
      'rotate_api_key',
      revoked
        ? `New API key "${created.name}" created — previous key revoked.`
        : `New API key "${created.name}" created.`,
      {
        apiKey: created,
        keyId: created.id,
        revokedKeyId: revoked ? oldKeyId : undefined,
      },
    );
  } catch (err: any) {
    return failure(
      'rotate_api_key',
      err?.message ?? 'Could not rotate API key.',
    );
  }
}

export async function handleListZapierTriggersLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const settings =
    await deps.zapierIntegrationService.getPublicSettings(businessId);
  return success(
    'list_zapier_triggers',
    `${settings.webhookEvents.length} Zapier trigger event(s) available.`,
    {
      enabled: settings.enabled,
      webhookEvents: settings.webhookEvents,
      samplePayloads: settings.samplePayloads,
      setupSteps: settings.setupSteps,
    },
  );
}

export async function handleConfigureZapierLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const enabled =
    (params.enabled as boolean | undefined) ??
    resolveZapierEnabledFromPrompt(prompt ?? (params._prompt as string) ?? '');

  try {
    const settings = await deps.zapierIntegrationService.updateSettings(
      businessId,
      {
        enabled: enabled ?? true,
        hookDescription: params.hookDescription as string | undefined,
      },
    );
    return success(
      'configure_zapier',
      settings.enabled
        ? 'Zapier integration enabled.'
        : 'Zapier integration disabled.',
      { settings },
    );
  } catch (err: any) {
    return failure(
      'configure_zapier',
      err?.message ?? 'Could not configure Zapier.',
    );
  }
}

export async function handleRunAccountingExportLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const { from, to } = resolveAccountingDateRange(
    params,
    prompt ?? (params._prompt as string),
  );
  try {
    const result = await deps.accountingIntegrationService.generateExport(
      businessId,
      from,
      to,
    );
    return success(
      'run_accounting_export',
      `Accounting export ready — ${result.rowCount} row(s) (${result.format}).`,
      { export: result, from, to },
    );
  } catch (err: any) {
    return failure(
      'run_accounting_export',
      err?.message ?? 'Accounting export failed.',
    );
  }
}

export async function handleConfigureZendeskLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const promptText = prompt ?? (params._prompt as string) ?? '';
  const enabled =
    (params.enabled as boolean | undefined) ??
    (/\b(disable|turn\s+off)\b/i.test(promptText)
      ? false
      : /\b(enable|configure|set\s+up)\b/i.test(promptText)
        ? true
        : undefined);
  const subdomain =
    (params.subdomain as string | undefined) ??
    extractZendeskSubdomainFromPrompt(promptText);
  const syncCustomersEnabled =
    (params.syncCustomersEnabled as boolean | undefined) ??
    resolveZendeskSyncEnabledFromPrompt(promptText);

  try {
    const settings = await deps.zendeskIntegrationService.updateSettings(
      businessId,
      {
        enabled: enabled ?? true,
        subdomain: subdomain ?? undefined,
        syncCustomersEnabled,
        apiUserEmail: params.apiUserEmail as string | undefined,
        apiToken: params.apiToken as string | undefined,
      },
    );
    return success(
      'configure_zendesk',
      settings.configured
        ? `Zendesk configured${settings.subdomain ? ` — ${settings.subdomain}` : ''}.`
        : 'Zendesk settings saved — credentials still needed.',
      { settings },
    );
  } catch (err: any) {
    return failure(
      'configure_zendesk',
      err?.message ?? 'Could not configure Zendesk.',
    );
  }
}

export async function handleCreateSupportTicketLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
  actorEmail?: string,
  actorName?: string,
): Promise<CommandResult> {
  const promptText = prompt ?? (params._prompt as string) ?? '';
  const guideSnapshot =
    parseGuideSupportSnapshot(params.guideSnapshot) ??
    parseGuideSupportSnapshot(params.snapshot);
  const ticketFromSnapshot = guideSnapshot
    ? buildGuideSupportTicketPayload(guideSnapshot)
    : null;

  const subject =
    (params.subject as string | undefined) ??
    ticketFromSnapshot?.subject ??
    extractTicketSubjectFromPrompt(promptText) ??
    'Support request from dashboard';
  const body =
    (params.body as string | undefined) ??
    ticketFromSnapshot?.body ??
    extractTicketBodyFromPrompt(promptText) ??
    (promptText.slice(0, 500) || 'Support ticket created via AI assistant.');
  const tags =
    (params.tags as string[] | undefined) ?? ticketFromSnapshot?.tags ?? undefined;

  try {
    const customer =
      guideSnapshot && !params.customerId && !params.customerName
        ? null
        : await resolveCustomerByName(
            deps,
            businessId,
            params,
            guideSnapshot ? '' : promptText,
          );
    const ticket = await deps.zendeskIntegrationService.createSupportTicket(
      businessId,
      {
        subject,
        body,
        customerId: customer?.id ?? (params.customerId as string | undefined),
        bookingId: params.bookingId as string | undefined,
        requesterEmail: params.requesterEmail as string | undefined,
        requesterName: params.requesterName as string | undefined,
        tags: tags ? [...tags] : undefined,
        ...(guideSnapshot
          ? { guideSnapshot: guideSnapshot as unknown as Record<string, unknown> }
          : {}),
      },
      actorEmail,
      actorName,
    );
    return success(
      'create_support_ticket',
      `Support ticket #${ticket.ticketId} created.`,
      { ticket, ticketId: ticket.ticketId, customerId: customer?.id },
    );
  } catch (err: any) {
    return failure(
      'create_support_ticket',
      err?.message ?? 'Could not create support ticket.',
    );
  }
}

export async function handleSyncCustomerToZendeskLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const customer = await resolveCustomerByName(
    deps,
    businessId,
    params,
    prompt,
  );
  if (!customer) {
    return failure(
      'sync_customer_to_zendesk',
      'Specify customer name to sync.',
      {
        clarify: true,
        missing: ['customerName'],
      },
    );
  }

  try {
    const result = await deps.zendeskIntegrationService.syncCustomerIfEnabled(
      businessId,
      customer.id,
    );
    if (!result) {
      return failure(
        'sync_customer_to_zendesk',
        'Zendesk customer sync is not enabled or not configured.',
        { customerId: customer.id },
      );
    }
    return success(
      'sync_customer_to_zendesk',
      `Customer ${customer.name} synced to Zendesk.`,
      { customerId: customer.id, syncResult: result },
    );
  } catch (err: any) {
    return failure(
      'sync_customer_to_zendesk',
      err?.message ?? 'Customer sync failed.',
    );
  }
}

export async function handleConfigureMarketingRegistrationEmailLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business)
    return failure(
      'configure_marketing_registration_email',
      'Business not found.',
    );

  const promptText = prompt ?? (params._prompt as string) ?? '';
  const emails =
    (params.marketingTeamEmails as string[] | undefined) ??
    extractMarketingEmailsFromPrompt(promptText);
  const enable =
    params.emailOnNewCustomerRegistration !== undefined
      ? Boolean(params.emailOnNewCustomerRegistration)
      : /\b(enable|turn\s+on|configure)\b/i.test(promptText) ||
        emails.length > 0;

  const current = mergeMarketingNotificationSettings(
    business.settings?.notifications as Record<string, unknown> | undefined,
  );
  const next = mergeMarketingNotificationSettings({
    emailOnNewCustomerRegistration: enable,
    marketingTeamEmails: emails.length ? emails : current.marketingTeamEmails,
  });

  business.settings = {
    ...(business.settings ?? {}),
    notifications: {
      ...(business.settings?.notifications ?? {}),
      ...next,
    },
  };
  await deps.businessRepo.save(business);

  return success(
    'configure_marketing_registration_email',
    next.emailOnNewCustomerRegistration
      ? `Marketing registration emails enabled for ${next.marketingTeamEmails.length} recipient(s).`
      : 'Marketing registration emails disabled.',
    { notifications: next },
  );
}

export async function handleListIntegrationHealthLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const snapshot = await loadIntegrationHealthSnapshot(deps, businessId);
  const configuredCount = countConfiguredIntegrationAreas(snapshot);

  return success(
    'list_integration_health',
    `${configuredCount}/8 integration area(s) configured.`,
    { health: snapshot, docsAvailable: Boolean(deps.integrationsDocsService) },
  );
}

export async function handleContactSupportLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
  actorEmail?: string,
  actorName?: string,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('contact_support', 'Sign in to contact support.', {
      clarify: true,
    });
  }

  const promptText = prompt ?? (params._prompt as string) ?? '';
  const subject =
    (params.subject as string | undefined) ??
    extractTicketSubjectFromPrompt(promptText) ??
    'Customer support request';
  const body =
    (params.body as string | undefined) ??
    extractTicketBodyFromPrompt(promptText) ??
    (promptText.slice(0, 500) ||
      'Customer contacted support via AI assistant.');

  try {
    const ticket = await deps.zendeskIntegrationService.createSupportTicket(
      businessId,
      {
        subject,
        body,
        customerId,
        requesterEmail: params.requesterEmail as string | undefined,
        requesterName: params.requesterName as string | undefined,
        tags: ['optischedule', 'customer-support'],
      },
      actorEmail,
      actorName,
    );
    return success(
      'contact_support',
      `Support ticket #${ticket.ticketId} submitted — we'll follow up by email.`,
      { ticket, ticketId: ticket.ticketId, customerId },
    );
  } catch (err: any) {
    return failure(
      'contact_support',
      err?.message ?? 'Could not contact support.',
    );
  }
}

export async function handleOpenTicketForOrderLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
  actorEmail?: string,
  actorName?: string,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'open_ticket_for_order',
      'Sign in to open a ticket for your order.',
      { clarify: true },
    );
  }

  const promptText = prompt ?? (params._prompt as string) ?? '';
  const giftCardId =
    (params.giftCardId as string | undefined) ??
    extractGiftCardIdFromPrompt(promptText);
  const bookingId =
    (params.bookingId as string | undefined) ??
    extractBookingIdFromPrompt(promptText);

  let orderRef = '';
  if (giftCardId) {
    const card = await deps.giftCardRepo.findOne({
      where: { id: giftCardId, businessId },
    });
    if (card) orderRef = `Gift card order ID: ${card.id}`;
  }
  if (bookingId)
    orderRef = orderRef
      ? `${orderRef}\nBooking ID: ${bookingId}`
      : `Booking ID: ${bookingId}`;

  const subject =
    (params.subject as string | undefined) ??
    extractTicketSubjectFromPrompt(promptText) ??
    (giftCardId
      ? 'Gift card order support'
      : bookingId
        ? 'Booking support'
        : 'Order support');
  const body =
    (params.body as string | undefined) ??
    extractTicketBodyFromPrompt(promptText) ??
    ([promptText.slice(0, 400), orderRef].filter(Boolean).join('\n\n') ||
      'Customer opened a support ticket for an order.');

  try {
    const ticket = await deps.zendeskIntegrationService.createSupportTicket(
      businessId,
      {
        subject,
        body,
        customerId,
        bookingId: bookingId ?? undefined,
        requesterEmail: params.requesterEmail as string | undefined,
        requesterName: params.requesterName as string | undefined,
        tags: [
          'optischedule',
          'order-support',
          giftCardId ? 'gift-card' : 'booking',
        ],
      },
      actorEmail,
      actorName,
    );
    return success(
      'open_ticket_for_order',
      `Ticket #${ticket.ticketId} opened for your order.`,
      { ticket, ticketId: ticket.ticketId, giftCardId, bookingId, customerId },
    );
  } catch (err: any) {
    return failure(
      'open_ticket_for_order',
      err?.message ?? 'Could not open ticket for order.',
    );
  }
}

export function mergeCompoundContext(
  context: Record<string, unknown>,
  step: IntegrationsCompoundStep,
  result: CommandResult,
): Record<string, unknown> {
  const details = result.details as Record<string, unknown>;
  const next = { ...context };

  if (details.customerId) next.customerId = details.customerId;
  if (details.ticketId) next.ticketId = details.ticketId;
  if (step.action === 'list_webhooks' && !next.webhookId) {
    const subs = details.subscriptions as
      | Array<{ id: string; isActive?: boolean }>
      | undefined;
    const first = parseFirstActiveWebhook(subs ?? []);
    if (first) next.webhookId = first.id;
  }
  if (step.action === 'create_webhook' && details.webhookId) {
    next.webhookId = details.webhookId;
  }
  if (step.action === 'sync_customer_to_zendesk' && details.customerId) {
    next.customerId = details.customerId;
  }
  if (
    step.action === 'contact_support' ||
    step.action === 'create_support_ticket' ||
    step.action === 'open_ticket_for_order'
  ) {
    if (details.ticketId) next.ticketId = details.ticketId;
  }
  return next;
}

export async function handleIntegrationsCompoundLogic(
  deps: IntegrationsLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  userId?: string,
  actorEmail?: string,
  actorName?: string,
): Promise<CommandResult> {
  const steps: IntegrationsCompoundStep[] =
    (params.compoundSteps as IntegrationsCompoundStep[] | undefined) ??
    decomposeIntegrationsCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple integration commands. Try separating with "and" or semicolons.',
      { clarify: true },
    );
  }

  const results: CommandResult[] = [];
  let compoundContext: Record<string, unknown> = { ...params, _prompt: prompt };

  for (const step of steps.slice(0, 4)) {
    const stepParams = {
      ...step.params,
      ...compoundContext,
      _prompt: step.segment,
    };
    let result: CommandResult;
    switch (step.action) {
      case 'list_webhooks':
        result = await handleListWebhooksLogic(deps, businessId);
        break;
      case 'create_webhook':
        result = await handleCreateWebhookLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'delete_webhook':
        result = await handleDeleteWebhookLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'toggle_webhook':
        result = await handleToggleWebhookLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'test_webhook':
        result = await handleTestWebhookLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'rotate_api_key':
        result = await handleRotateApiKeyLogic(
          deps,
          businessId,
          stepParams,
          userId,
          step.segment,
        );
        break;
      case 'list_zapier_triggers':
        result = await handleListZapierTriggersLogic(deps, businessId);
        break;
      case 'configure_zapier':
        result = await handleConfigureZapierLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'configure_openai_integration':
        result = await handleConfigureOpenaiIntegrationLogic(
          { openAiIntegrationService: deps.openAiIntegrationService },
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'run_accounting_export':
        result = await handleRunAccountingExportLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'configure_zendesk':
        result = await handleConfigureZendeskLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'create_support_ticket':
        result = await handleCreateSupportTicketLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
          actorEmail,
          actorName,
        );
        break;
      case 'sync_customer_to_zendesk':
        result = await handleSyncCustomerToZendeskLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'configure_marketing_registration_email':
        result = await handleConfigureMarketingRegistrationEmailLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'list_integration_health':
        result = await handleListIntegrationHealthLogic(deps, businessId);
        break;
      case 'explain_integration_health':
        result = await handleExplainIntegrationHealthLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'contact_support':
        result = await handleContactSupportLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
          actorEmail,
          actorName,
        );
        break;
      case 'open_ticket_for_order':
        result = await handleOpenTicketForOrderLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
          actorEmail,
          actorName,
        );
        break;
      default:
        result = failure(
          step.action,
          `Unsupported integrations compound step: ${step.action}.`,
        );
    }
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((r) => r.action),
          failedStep: step.action,
          userId,
        },
      };
    }
    compoundContext = mergeCompoundContext(compoundContext, step, result);
  }

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} integration step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      integrationsCompound: true,
      userId,
      finalContext: compoundContext,
    },
  };
}
