import type { CommandResult } from './command-completion.types.js';
import {
  handleConfigureZendeskLogic,
  handleConfigureZapierLogic,
  handleContactSupportLogic,
  handleCreateApiKeyLogic,
  handleCreateSupportTicketLogic,
  handleCreateWebhookLogic,
  handleDeleteWebhookLogic,
  handleToggleWebhookLogic,
  handleListIntegrationHealthLogic,
  handleListWebhooksLogic,
  handleListZapierTriggersLogic,
  handleOpenTicketForOrderLogic,
  handleConfigureDistributionChannelsLogic,
  handleRevokeApiKeyLogic,
  handleRotateApiKeyLogic,
  handleRunAccountingExportLogic,
  handleSyncCustomerToZendeskLogic,
  handleTestWebhookLogic,
  type IntegrationsLogicDeps,
} from './ai-integrations.logic.js';
import { handleExplainIntegrationHealthLogic } from './ai-explain-integration-health.logic.js';
import { handleExplainSupportInboxLogic } from './ai-explain-support-inbox.logic.js';

export type IntegrationsDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt?: string;
  userId?: string;
  actorEmail?: string;
  actorName?: string;
  sessionCustomerId?: string;
};

export type IntegrationsLogicDispatchHandler = (
  deps: IntegrationsLogicDeps,
  ctx: IntegrationsDispatchContext,
) => Promise<CommandResult>;

export function buildIntegrationsLogicDispatchMap(): ReadonlyMap<
  string,
  IntegrationsLogicDispatchHandler
> {
  const map = new Map<string, IntegrationsLogicDispatchHandler>();

  map.set('list_webhooks', (deps, ctx) =>
    handleListWebhooksLogic(deps, ctx.businessId),
  );
  map.set('create_webhook', (deps, ctx) =>
    handleCreateWebhookLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('delete_webhook', (deps, ctx) =>
    handleDeleteWebhookLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('toggle_webhook', (deps, ctx) =>
    handleToggleWebhookLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('test_webhook', (deps, ctx) =>
    handleTestWebhookLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('rotate_api_key', (deps, ctx) =>
    handleRotateApiKeyLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userId,
      ctx.prompt,
    ),
  );
  map.set('create_api_key', (deps, ctx) =>
    handleCreateApiKeyLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userId,
      ctx.prompt,
    ),
  );
  map.set('revoke_api_key', (deps, ctx) =>
    handleRevokeApiKeyLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('configure_distribution_channels', (deps, ctx) =>
    handleConfigureDistributionChannelsLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('list_zapier_triggers', (deps, ctx) =>
    handleListZapierTriggersLogic(deps, ctx.businessId),
  );
  map.set('configure_zapier', (deps, ctx) =>
    handleConfigureZapierLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('run_accounting_export', (deps, ctx) =>
    handleRunAccountingExportLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('configure_zendesk', (deps, ctx) =>
    handleConfigureZendeskLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('create_support_ticket', (deps, ctx) =>
    handleCreateSupportTicketLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
      ctx.actorEmail,
      ctx.actorName,
    ),
  );
  map.set('sync_customer_to_zendesk', (deps, ctx) =>
    handleSyncCustomerToZendeskLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('list_integration_health', (deps, ctx) =>
    handleListIntegrationHealthLogic(deps, ctx.businessId),
  );
  map.set('explain_integration_health', (deps, ctx) =>
    handleExplainIntegrationHealthLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('explain_support_inbox', (deps, ctx) =>
    handleExplainSupportInboxLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('contact_support', (deps, ctx) =>
    handleContactSupportLogic(
      deps,
      ctx.businessId,
      {
        ...ctx.params,
        sessionCustomerId: ctx.sessionCustomerId,
        _prompt: ctx.prompt,
      },
      ctx.prompt,
      ctx.actorEmail,
      ctx.actorName,
    ),
  );
  map.set('open_ticket_for_order', (deps, ctx) =>
    handleOpenTicketForOrderLogic(
      deps,
      ctx.businessId,
      {
        ...ctx.params,
        sessionCustomerId: ctx.sessionCustomerId,
        _prompt: ctx.prompt,
      },
      ctx.prompt,
      ctx.actorEmail,
      ctx.actorName,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiIntegrationsService (ai-cmd-ext-0.5). */
export const INTEGRATIONS_LOGIC_DISPATCH_MAP =
  buildIntegrationsLogicDispatchMap();
