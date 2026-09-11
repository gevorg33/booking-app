import { IntegrationsController } from './integrations.controller.js';
import { BusinessService } from '../business/business.service.js';
import { ApiKeyService } from './api-key.service.js';
import { WebhooksService } from './webhooks.service.js';
import { OpenAiIntegrationService } from './openai/openai-integration.service.js';
import { OpenAiGatewayService } from './openai/openai-gateway.service.js';
import { ZendeskIntegrationService } from './zendesk/zendesk-integration.service.js';
import { DistributionIntegrationService } from './distribution/distribution-integration.service.js';
import { ZapierIntegrationService } from './zapier/zapier-integration.service.js';
import { AccountingIntegrationService } from './accounting/accounting-integration.service.js';

describe('IntegrationsController growth endpoints', () => {
  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(),
  };
  const apiKeyService = {
    assertAdminRole: jest.fn(),
  };
  const webhooksService = { getEventOptions: jest.fn() };
  const openAiIntegrationService = {
    getPublicSettings: jest.fn(),
    updateSettings: jest.fn(),
  };
  const openAiGateway = { invalidateBusiness: jest.fn() };
  const zendeskIntegrationService = {
    getPublicSettings: jest.fn(),
    updateSettings: jest.fn(),
    getDashboardWidgetKey: jest.fn(),
    // e2e-bug.471 — the controller now calls the context method directly;
    // getDashboardWidgetKey delegates to it in production.
    getDashboardWidgetContext: jest.fn(),
    createSupportTicket: jest.fn(),
    syncCustomerIfEnabled: jest.fn(),
  };
  const distributionIntegrationService = {
    getPublicSettings: jest.fn(),
    updateSettings: jest.fn(),
    getGoogleReserveFeed: jest.fn(),
  };

  const controller = new IntegrationsController(
    businessService as unknown as BusinessService,
    apiKeyService as unknown as ApiKeyService,
    webhooksService as unknown as WebhooksService,
    openAiIntegrationService as unknown as OpenAiIntegrationService,
    openAiGateway as unknown as OpenAiGatewayService,
    zendeskIntegrationService as unknown as ZendeskIntegrationService,
    distributionIntegrationService as unknown as DistributionIntegrationService,
    {} as ZapierIntegrationService,
    {} as AccountingIntegrationService,
  
    undefined as never);

  const user = {
    id: 'user-1',
    email: 'owner@test.com',
    firstName: 'Owner',
    lastName: 'One',
  };
  const membership = { role: 'owner' };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue(membership);
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { integrations: { zendesk: { widgetKey: 'wk' } } },
    });
    zendeskIntegrationService.getDashboardWidgetKey.mockReturnValue('wk');
    zendeskIntegrationService.getDashboardWidgetContext.mockReturnValue({
      widgetKey: 'wk',
    });
    zendeskIntegrationService.createSupportTicket.mockResolvedValue({
      ticketId: 1,
      url: 'x',
    });
    zendeskIntegrationService.syncCustomerIfEnabled.mockResolvedValue(null);
    distributionIntegrationService.getGoogleReserveFeed.mockResolvedValue({
      services: [],
    });
  });

  it('returns dashboard zendesk widget key for members', async () => {
    const result = await controller.getZendeskWidgetKey('biz-1', user);
    expect(businessService.ensureMember).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
    expect(result).toEqual({ widgetKey: 'wk' });
  });

  it('creates support ticket with actor context', async () => {
    await controller.createSupportTicket(
      'biz-1',
      { subject: 'Help', body: 'Details' },
      user,
    );
    expect(zendeskIntegrationService.createSupportTicket).toHaveBeenCalledWith(
      'biz-1',
      { subject: 'Help', body: 'Details' },
      'owner@test.com',
      'Owner One',
    );
  });

  it('returns synced false when manual customer sync skipped', async () => {
    const result = await controller.syncCustomerToZendesk(
      'biz-1',
      'cust-1',
      user,
    );
    expect(apiKeyService.assertAdminRole).toHaveBeenCalledWith(membership);
    expect(result).toEqual({
      synced: false,
      message: 'Zendesk sync disabled or customer has no email',
    });
  });

  it('returns synced true when manual customer sync succeeds', async () => {
    zendeskIntegrationService.syncCustomerIfEnabled.mockResolvedValue({
      userId: 9,
      url: 'https://x.zendesk.com/users/9',
      created: true,
    });
    const result = await controller.syncCustomerToZendesk(
      'biz-1',
      'cust-1',
      user,
    );
    expect(result).toEqual({
      synced: true,
      userId: 9,
      url: 'https://x.zendesk.com/users/9',
      created: true,
    });
  });

  it('delegates distribution settings read/write and feed export', async () => {
    distributionIntegrationService.getPublicSettings.mockResolvedValue({
      googleReserve: { enabled: true },
    });
    distributionIntegrationService.updateSettings.mockResolvedValue({
      googleReserve: { enabled: false },
    });

    await controller.getDistributionIntegration('biz-1', user);
    await controller.updateDistributionIntegration(
      'biz-1',
      { googleReserveEnabled: false },
      user,
    );
    await controller.getGoogleReserveFeed('biz-1', user);

    expect(
      distributionIntegrationService.getPublicSettings,
    ).toHaveBeenCalledWith('biz-1');
    expect(distributionIntegrationService.updateSettings).toHaveBeenCalledWith(
      'biz-1',
      {
        googleReserveEnabled: false,
      },
    );
    expect(
      distributionIntegrationService.getGoogleReserveFeed,
    ).toHaveBeenCalledWith('biz-1');
  });
});
