import { AiIntegrationsService } from './ai-integrations.service.js';

describe('AiIntegrationsService', () => {
  const webhooksService = {
    listSubscriptions: jest.fn(async () => [
      {
        id: 'wh-1',
        url: 'https://x',
        events: ['booking.created'],
        isActive: true,
      },
    ]),
    createSubscription: jest.fn(async () => ({
      id: 'wh-2',
      url: 'https://y',
      events: ['booking.created'],
      secret: 's',
    })),
    getEventOptions: jest.fn(() => ({ events: ['booking.created'] })),
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
      samplePayloads: [],
      setupSteps: [],
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
    })),
    generateExport: jest.fn(async () => ({
      rowCount: 1,
      format: 'csv',
      content: 'x',
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
    })),
    createSupportTicket: jest.fn(async () => ({
      ticketId: 7,
      requesterEmail: 'a@b.com',
    })),
    syncCustomerIfEnabled: jest.fn(async () => ({ userId: 1 })),
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
  const distributionIntegrationService = {
    updateSettings: jest.fn(async () => ({
      googleReserve: { enabled: true },
      metaBooking: { enabled: false, bookingUrl: 'https://example.com' },
      messaging: { telegramEnabled: false, whatsappBookingEnabled: false },
    })),
  };
  const integrationsDocsService = { buildDocs: jest.fn(() => ({})) };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
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

  let service: AiIntegrationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as any;
    service = new AiIntegrationsService(
      webhooksService as any,
      apiKeyService as any,
      zapierIntegrationService as any,
      accountingIntegrationService as any,
      zendeskIntegrationService as any,
      integrationsDocsService as any,
      openAiIntegrationService as any,
      whatsappIntegrationService as any,
      distributionIntegrationService as any,
      businessRepo as any,
      customerRepo as any,
      giftCardRepo as any,
    );
  });

  it('delegates rescue and compound helpers', () => {
    expect(
      service.rescueIntegrationsIntent('List webhooks', 'unknown')?.action,
    ).toBe('list_webhooks');
    expect(
      service.isIntegrationsCompound(
        'List webhooks and create webhook https://hooks.example.com for booking.created',
      ),
    ).toBe(true);
    expect(
      service.decomposeIntegrationsCompound(
        'Configure Zendesk and sync customer Anna to Zendesk',
      ).length,
    ).toBe(2);
  });

  it('delegates all integration handlers', async () => {
    expect((await service.handleListWebhooks('biz-1')).success).toBe(true);
    expect(
      (
        await service.handleCreateWebhook('biz-1', {
          url: 'https://hooks.example.com',
          events: ['booking.created'],
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleTestWebhook('biz-1', { webhookId: 'wh-1' })).success,
    ).toBe(true);
    expect(
      (await service.handleRotateApiKey('biz-1', { apiKeyName: 'New' }, 'u1'))
        .success,
    ).toBe(true);
    expect((await service.handleListZapierTriggers('biz-1')).success).toBe(
      true,
    );
    expect(
      (await service.handleConfigureZapier('biz-1', { enabled: true })).success,
    ).toBe(true);
    expect(
      (
        await service.handleRunAccountingExport('biz-1', {
          from: '2026-06-01',
          to: '2026-06-30',
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleConfigureZendesk('biz-1', { subdomain: 'mybiz' }))
        .success,
    ).toBe(true);
    expect(
      (
        await service.handleCreateSupportTicket('biz-1', {
          subject: 'Help',
          body: 'Need help',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleSyncCustomerToZendesk('biz-1', {
          customerName: 'Anna',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleConfigureMarketingRegistrationEmail('biz-1', {
          marketingTeamEmails: ['team@example.com'],
        })
      ).success,
    ).toBe(true);
    expect((await service.handleListIntegrationHealth('biz-1')).success).toBe(
      true,
    );
    expect(
      (
        await service.handleExplainIntegrationHealth(
          'biz-1',
          {},
          'Is WhatsApp connected?',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleContactSupport('biz-1', {
          sessionCustomerId: 'c1',
          subject: 'Help',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleOpenTicketForOrder('biz-1', {
          sessionCustomerId: 'c1',
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(true);

    const compound = await service.handleIntegrationsCompound(
      'biz-1',
      'List webhooks and create webhook https://hooks.example.com for booking.created events',
      {},
      'u1',
    );
    expect(compound.success).toBe(true);
  });
});
