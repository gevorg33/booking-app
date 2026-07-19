import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { ApiKeyService } from '../integrations/api-key.service.js';
import { WebhooksService } from '../integrations/webhooks.service.js';
import { ZapierIntegrationService } from '../integrations/zapier/zapier-integration.service.js';
import { AccountingIntegrationService } from '../integrations/accounting/accounting-integration.service.js';
import { ZendeskIntegrationService } from '../integrations/zendesk/zendesk-integration.service.js';
import { IntegrationsDocsService } from '../integrations/integrations-docs.service.js';
import { OpenAiIntegrationService } from '../integrations/openai/openai-integration.service.js';
import { WhatsAppIntegrationService } from '../notifications/whatsapp-integration.service.js';
import { DistributionIntegrationService } from '../integrations/distribution/distribution-integration.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeIntegrationsCompoundPrompt,
  isIntegrationsCompoundPrompt,
  rescueIntegrationsIntent,
} from './ai-integrations.util.js';
import {
  handleConfigureMarketingRegistrationEmailLogic,
  handleConfigureZendeskLogic,
  handleConfigureZapierLogic,
  handleContactSupportLogic,
  handleCreateApiKeyLogic,
  handleCreateSupportTicketLogic,
  handleCreateWebhookLogic,
  handleDeleteWebhookLogic,
  handleToggleWebhookLogic,
  handleIntegrationsCompoundLogic,
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
import { handleConfigureOpenaiIntegrationLogic } from './ai-openai-integration.logic.js';
import { handleExplainIntegrationHealthLogic } from './ai-explain-integration-health.logic.js';
import { dispatchIntegrationsLogicIntent } from './ai-integrations-dispatch.util.js';
import type { IntegrationsDispatchContext } from './ai-integrations-dispatch.build.js';

@Injectable()
export class AiIntegrationsService {
  private readonly deps: IntegrationsLogicDeps;

  constructor(
    webhooksService: WebhooksService,
    apiKeyService: ApiKeyService,
    zapierIntegrationService: ZapierIntegrationService,
    accountingIntegrationService: AccountingIntegrationService,
    zendeskIntegrationService: ZendeskIntegrationService,
    integrationsDocsService: IntegrationsDocsService,
    openAiIntegrationService: OpenAiIntegrationService,
    whatsappIntegrationService: WhatsAppIntegrationService,
    distributionIntegrationService: DistributionIntegrationService,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Customer) customerRepo: Repository<Customer>,
    @InjectRepository(GiftCard) giftCardRepo: Repository<GiftCard>,
  ) {
    this.deps = {
      webhooksService,
      apiKeyService,
      zapierIntegrationService,
      accountingIntegrationService,
      zendeskIntegrationService,
      integrationsDocsService,
      openAiIntegrationService,
      whatsappIntegrationService,
      distributionIntegrationService,
      businessRepo,
      customerRepo,
      giftCardRepo,
    };
  }

  rescueIntegrationsIntent(prompt: string, action: string) {
    return rescueIntegrationsIntent(prompt, action);
  }

  isIntegrationsCompound(prompt: string) {
    return isIntegrationsCompoundPrompt(prompt);
  }

  decomposeIntegrationsCompound(prompt: string) {
    return decomposeIntegrationsCompoundPrompt(prompt);
  }

  handleListWebhooks(businessId: string) {
    return handleListWebhooksLogic(this.deps, businessId);
  }

  handleCreateWebhook(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleCreateWebhookLogic(this.deps, businessId, params, prompt);
  }

  handleDeleteWebhook(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleDeleteWebhookLogic(this.deps, businessId, params, prompt);
  }

  handleToggleWebhook(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleToggleWebhookLogic(this.deps, businessId, params, prompt);
  }

  handleTestWebhook(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleTestWebhookLogic(this.deps, businessId, params, prompt);
  }

  handleRotateApiKey(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
    prompt?: string,
  ) {
    return handleRotateApiKeyLogic(
      this.deps,
      businessId,
      params,
      userId,
      prompt,
    );
  }

  handleCreateApiKey(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
    prompt?: string,
  ) {
    return handleCreateApiKeyLogic(this.deps, businessId, params, userId, prompt);
  }

  handleRevokeApiKey(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleRevokeApiKeyLogic(this.deps, businessId, params, prompt);
  }

  handleConfigureDistributionChannels(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleConfigureDistributionChannelsLogic(
      this.deps,
      businessId,
      params,
    );
  }

  handleListZapierTriggers(businessId: string) {
    return handleListZapierTriggersLogic(this.deps, businessId);
  }

  handleConfigureZapier(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleConfigureZapierLogic(this.deps, businessId, params, prompt);
  }

  handleConfigureOpenaiIntegration(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleConfigureOpenaiIntegrationLogic(
      { openAiIntegrationService: this.deps.openAiIntegrationService },
      businessId,
      params,
      prompt,
    );
  }

  handleRunAccountingExport(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleRunAccountingExportLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleConfigureZendesk(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleConfigureZendeskLogic(this.deps, businessId, params, prompt);
  }

  handleCreateSupportTicket(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
    actorEmail?: string,
    actorName?: string,
  ) {
    return handleCreateSupportTicketLogic(
      this.deps,
      businessId,
      params,
      prompt,
      actorEmail,
      actorName,
    );
  }

  handleSyncCustomerToZendesk(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleSyncCustomerToZendeskLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleConfigureMarketingRegistrationEmail(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleConfigureMarketingRegistrationEmailLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleListIntegrationHealth(businessId: string) {
    return handleListIntegrationHealthLogic(this.deps, businessId);
  }

  handleExplainIntegrationHealth(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleExplainIntegrationHealthLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleContactSupport(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
    actorEmail?: string,
    actorName?: string,
  ) {
    return handleContactSupportLogic(
      this.deps,
      businessId,
      params,
      prompt,
      actorEmail,
      actorName,
    );
  }

  handleOpenTicketForOrder(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
    actorEmail?: string,
    actorName?: string,
  ) {
    return handleOpenTicketForOrderLogic(
      this.deps,
      businessId,
      params,
      prompt,
      actorEmail,
      actorName,
    );
  }

  handleIntegrationsCompound(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    userId?: string,
    actorEmail?: string,
    actorName?: string,
  ): Promise<CommandResult> {
    return handleIntegrationsCompoundLogic(
      this.deps,
      businessId,
      prompt,
      params,
      userId,
      actorEmail,
      actorName,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not an integrations intent. */
  dispatchIntent(
    ctx: IntegrationsDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchIntegrationsLogicIntent(this.deps, ctx);
  }
}
