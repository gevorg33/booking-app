import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiIntegrationsService } from './ai-integrations.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { WebhooksService } from '../integrations/webhooks.service.js';
import { ApiKeyService } from '../integrations/api-key.service.js';
import { ZapierIntegrationService } from '../integrations/zapier/zapier-integration.service.js';
import { AccountingIntegrationService } from '../integrations/accounting/accounting-integration.service.js';
import { ZendeskIntegrationService } from '../integrations/zendesk/zendesk-integration.service.js';
import { IntegrationsDocsService } from '../integrations/integrations-docs.service.js';
import { OpenAiIntegrationService } from '../integrations/openai/openai-integration.service.js';
import { WhatsAppIntegrationService } from '../notifications/whatsapp-integration.service.js';

describe('Sprint 32 integrations AI scenarios', () => {
  const webhooksService = {
    listSubscriptions: jest.fn(async () => [
      {
        id: 'wh-1',
        url: 'https://hooks.example.com/a',
        events: ['booking.created'],
        isActive: true,
      },
    ]),
    createSubscription: jest.fn(async () => ({
      id: 'wh-2',
      url: 'https://hooks.example.com/b',
      events: ['booking.created'],
      isActive: true,
      secret: 'sec',
    })),
    getEventOptions: jest.fn(() => ({
      events: ['booking.created', 'payment.received'],
    })),
  };
  const apiKeyService = {
    listKeys: jest.fn(async () => [{ id: 'k1', name: 'Main' }]),
    createKey: jest.fn(async () => ({
      id: 'k2',
      name: 'Rotated',
      key: 'osk_live_x',
    })),
    revokeKey: jest.fn(async () => ({ revoked: true })),
  };
  const zapierIntegrationService = {
    getPublicSettings: jest.fn(async () => ({
      enabled: true,
      webhookEvents: ['booking.created'],
      samplePayloads: [{ event: 'booking.created' }],
      setupSteps: ['step'],
      apiBaseUrl: 'http://localhost:3001',
      makeCompatible: true,
    })),
    updateSettings: jest.fn(async () => ({
      enabled: true,
      webhookEvents: ['booking.created'],
      samplePayloads: [],
      setupSteps: [],
      apiBaseUrl: 'http://localhost:3001',
      makeCompatible: true,
    })),
  };
  const accountingIntegrationService = {
    getPublicSettings: jest.fn(async () => ({
      enabled: true,
      provider: 'csv',
      includeCommissions: true,
      includeExpenses: true,
    })),
    generateExport: jest.fn(async () => ({
      rowCount: 5,
      format: 'csv',
      content: 'rows',
    })),
  };
  const zendeskIntegrationService = {
    getPublicSettings: jest.fn(async () => ({
      configured: true,
      enabled: true,
      syncCustomersEnabled: true,
    })),
    updateSettings: jest.fn(async () => ({
      configured: true,
      enabled: true,
      subdomain: 'mybiz',
      syncCustomersEnabled: true,
    })),
    createSupportTicket: jest.fn(async () => ({
      ticketId: 99,
      requesterEmail: 'anna@example.com',
    })),
    syncCustomerIfEnabled: jest.fn(async () => ({ userId: 12 })),
  };
  const integrationsDocsService = {
    buildDocs: jest.fn(() => ({ baseUrl: 'http://localhost:3001' })),
  };
  const openAiIntegrationService = {
    getPublicSettings: jest.fn(async () => ({
      configured: false,
      usingPlatformDefault: false,
      usage: { totalTokens: 0 },
    })),
    updateSettings: jest.fn(async (_id, patch) => ({
      configured: true,
      ...patch,
      usage: { totalTokens: 0 },
    })),
  };
  const whatsappIntegrationService = {
    getPublicSettings: jest.fn(async () => ({
      configured: true,
      usingPlatformDefault: false,
      phoneNumberId: '15551234567',
    })),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      name: 'Test Salon',
      settings: {
        notifications: {
          emailOnNewCustomerRegistration: false,
          marketingTeamEmails: [],
        },
      },
    })),
    save: jest.fn(async (b) => b),
  };
  const customerRepo = {
    find: jest.fn(async () => [
      {
        id: 'c1',
        name: 'Anna',
        businessId: 'biz-1',
        email: 'anna@example.com',
      },
    ]),
    findOne: jest.fn(async () => ({
      id: 'c1',
      name: 'Anna',
      businessId: 'biz-1',
      email: 'anna@example.com',
    })),
  };
  const giftCardRepo = {
    findOne: jest.fn(async () => ({ id: 'gc-1', businessId: 'biz-1' })),
  };

  let integrations: AiIntegrationsService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as any;

    const module = await Test.createTestingModule({
      providers: [
        AiIntegrationsService,
        AiIntentRescueService,
        { provide: WebhooksService, useValue: webhooksService },
        { provide: ApiKeyService, useValue: apiKeyService },
        {
          provide: ZapierIntegrationService,
          useValue: zapierIntegrationService,
        },
        {
          provide: AccountingIntegrationService,
          useValue: accountingIntegrationService,
        },
        {
          provide: ZendeskIntegrationService,
          useValue: zendeskIntegrationService,
        },
        { provide: IntegrationsDocsService, useValue: integrationsDocsService },
        {
          provide: OpenAiIntegrationService,
          useValue: openAiIntegrationService,
        },
        {
          provide: WhatsAppIntegrationService,
          useValue: whatsappIntegrationService,
        },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(Customer), useValue: customerRepo },
        { provide: getRepositoryToken(GiftCard), useValue: giftCardRepo },
      ],
    }).compile();

    integrations = module.get(AiIntegrationsService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('rescue', () => {
    it('rescues integrations intents before fulfillment and payments rescue', () => {
      expect(
        integrations.rescueIntegrationsIntent('List webhooks', 'unknown')
          ?.action,
      ).toBe('list_webhooks');
      expect(
        rescue.rescue({
          prompt: 'Run accounting export this month',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('run_accounting_export');
      expect(
        rescue.rescue({
          prompt: 'Export accounting for May',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('export_accounting');
      expect(
        rescue.rescue({
          prompt: 'List gift card orders',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('list_gift_card_orders');
      expect(
        rescue.rescue({
          prompt: 'Request gift card modify',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('request_gift_card_modify');
      expect(
        rescue.rescue({
          prompt: 'Contact support about billing',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('contact_support');
    });
  });

  describe('handlers', () => {
    it('runs dashboard integration handlers', async () => {
      expect((await integrations.handleListWebhooks('biz-1')).success).toBe(
        true,
      );
      expect(
        (
          await integrations.handleCreateWebhook('biz-1', {
            url: 'https://hooks.example.com/new',
            events: ['booking.created'],
          })
        ).success,
      ).toBe(true);
      expect(
        (await integrations.handleTestWebhook('biz-1', { webhookId: 'wh-1' }))
          .success,
      ).toBe(true);
      expect(
        (
          await integrations.handleRotateApiKey(
            'biz-1',
            { apiKeyName: 'Ops key' },
            'u1',
          )
        ).success,
      ).toBe(true);
      expect(
        (await integrations.handleListZapierTriggers('biz-1')).success,
      ).toBe(true);
      expect(
        (await integrations.handleConfigureZapier('biz-1', { enabled: true }))
          .success,
      ).toBe(true);
      expect(
        (
          await integrations.handleRunAccountingExport(
            'biz-1',
            {},
            'run accounting export this month',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await integrations.handleConfigureZendesk('biz-1', {
            subdomain: 'mybiz',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await integrations.handleCreateSupportTicket('biz-1', {
            subject: 'Billing',
            body: 'Need help with invoice',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await integrations.handleSyncCustomerToZendesk('biz-1', {
            customerName: 'Anna',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await integrations.handleConfigureMarketingRegistrationEmail(
            'biz-1',
            {
              marketingTeamEmails: ['team@example.com'],
            },
          )
        ).success,
      ).toBe(true);
      expect(
        (await integrations.handleListIntegrationHealth('biz-1')).success,
      ).toBe(true);
      expect(
        (
          await integrations.handleExplainIntegrationHealth(
            'biz-1',
            {},
            'Is WhatsApp connected?',
          )
        ).success,
      ).toBe(true);
    });

    it('runs customer integration handlers', async () => {
      expect(
        (
          await integrations.handleContactSupport('biz-1', {
            sessionCustomerId: 'c1',
            subject: 'Help',
            body: 'Question about my appointment',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await integrations.handleOpenTicketForOrder('biz-1', {
            sessionCustomerId: 'c1',
            giftCardId: 'gc-1',
          })
        ).success,
      ).toBe(true);
      expect(zendeskIntegrationService.createSupportTicket).toHaveBeenCalled();
    });
  });

  describe('compound', () => {
    it('completes webhook compound flow with context merge', async () => {
      const result = await integrations.handleIntegrationsCompound(
        'biz-1',
        'List webhooks and create webhook https://hooks.example.com for booking.created events',
        {},
        'u1',
      );
      expect(result.success).toBe(true);
      expect((result.details as any).integrationsCompound).toBe(true);
      expect((result.details as any).steps.length).toBe(2);
    });

    it('completes zendesk and accounting compound flows', async () => {
      const zendesk = await integrations.handleIntegrationsCompound(
        'biz-1',
        'Configure Zendesk and sync customer Anna to Zendesk',
        {},
      );
      expect(zendesk.success).toBe(true);

      const accounting = await integrations.handleIntegrationsCompound(
        'biz-1',
        'Run accounting export for this month and list integration health',
        {},
      );
      expect(accounting.success).toBe(true);
    });

    it('completes customer compound and stops on failure', async () => {
      const customer = await integrations.handleIntegrationsCompound(
        'biz-1',
        'Contact support and open ticket for my gift card order',
        { sessionCustomerId: 'c1' },
      );
      expect(customer.success).toBe(true);

      const stopped = await integrations.handleIntegrationsCompound(
        'biz-1',
        'compound',
        {
          compoundSteps: [
            { action: 'sync_customer_to_zendesk', params: {}, segment: 'sync' },
            { action: 'list_webhooks', params: {}, segment: 'list' },
          ],
        },
      );
      expect(stopped.success).toBe(false);
      expect((stopped.details as any).failedStep).toBe(
        'sync_customer_to_zendesk',
      );
    });
  });
});
