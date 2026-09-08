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

describe('IntegrationsController platform maturity endpoints', () => {
  const businessService = { ensureMember: jest.fn() };
  const apiKeyService = { assertAdminRole: jest.fn() };
  const zapierIntegrationService = {
    getPublicSettings: jest.fn(),
    updateSettings: jest.fn(),
    createZapierWebhook: jest.fn(),
  };
  const accountingIntegrationService = {
    getPublicSettings: jest.fn(),
    updateSettings: jest.fn(),
    generateExport: jest.fn(),
  };

  const controller = new IntegrationsController(
    businessService as unknown as BusinessService,
    apiKeyService as unknown as ApiKeyService,
    {} as WebhooksService,
    {} as OpenAiIntegrationService,
    {} as OpenAiGatewayService,
    {} as ZendeskIntegrationService,
    {} as DistributionIntegrationService,
    zapierIntegrationService as unknown as ZapierIntegrationService,
    accountingIntegrationService as unknown as AccountingIntegrationService,
  
    undefined as never);

  const membership = { role: 'owner' };
  const user = { id: 'user-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue(membership);
    zapierIntegrationService.getPublicSettings.mockResolvedValue({
      enabled: true,
    });
    accountingIntegrationService.generateExport.mockResolvedValue({
      filename: 'x.csv',
      content: 'a',
    });
  });

  it('delegates zapier settings', async () => {
    await controller.getZapierIntegration('biz-1', user);
    await controller.updateZapierIntegration('biz-1', { enabled: true }, user);
    expect(zapierIntegrationService.getPublicSettings).toHaveBeenCalledWith(
      'biz-1',
    );
    expect(zapierIntegrationService.updateSettings).toHaveBeenCalled();
  });

  it('creates zapier webhook', async () => {
    await controller.createZapierWebhook(
      'biz-1',
      { url: 'https://hooks.zapier.com/x', events: ['booking.created'] },
      user,
    );
    expect(zapierIntegrationService.createZapierWebhook).toHaveBeenCalled();
  });

  it('delegates accounting settings and export', async () => {
    await controller.getAccountingIntegration('biz-1', user);
    await controller.updateAccountingIntegration(
      'biz-1',
      { provider: 'xero' },
      user,
    );
    await controller.exportAccounting(
      'biz-1',
      '2026-01-01',
      '2026-01-31',
      user,
    );
    expect(accountingIntegrationService.generateExport).toHaveBeenCalledWith(
      'biz-1',
      '2026-01-01',
      '2026-01-31',
    );
  });
});
