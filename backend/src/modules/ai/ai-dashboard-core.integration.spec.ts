import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiDashboardCoreService } from './ai-dashboard-core.service.js';
import { AiCatalogService } from './ai-catalog.service.js';
import { AiPaymentsService } from './ai-payments.service.js';
import { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import { AiNotificationSettingsService } from './ai-notification-settings.service.js';
import { AiWhatsappIntegrationService } from './ai-whatsapp-integration.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { AiIntegrationsService } from './ai-integrations.service.js';
import { AiOperationsService } from './ai-operations.service.js';
import { AiBusinessCurrencyService } from './ai-business-currency.service.js';
import { AiBusinessTaxService } from './ai-business-tax.service.js';
import { AiBusinessComplianceService } from './ai-business-compliance.service.js';
import { AiBusinessLanguagesService } from './ai-business-languages.service.js';
import { AiBusinessDateFormatService } from './ai-business-date-format.service.js';
import { Business } from '../business/entities/business.entity.js';

describe('AiDashboardCoreService integration (ai-cmd-ext-6.1)', () => {
  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'biz-1',
      settings: {},
    }),
    save: jest.fn(async (b: unknown) => b),
  };

  const catalog = {
    handleListPackages: jest.fn().mockResolvedValue({
      success: true,
      action: 'list_packages',
      summary: 'Packages listed',
    }),
  };
  const payments = {
    dispatchIntent: jest.fn().mockResolvedValue({
      success: true,
      action: 'summarize_unpaid',
      summary: 'Unpaid summary',
    }),
  };
  const notificationSettings = {
    handleConfigureNotificationSettings: jest.fn().mockResolvedValue({
      success: true,
      action: 'configure_notification_settings',
      summary: 'Notifications updated',
    }),
  };

  let service: AiDashboardCoreService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiDashboardCoreService,
        { provide: AiCatalogService, useValue: catalog },
        { provide: AiPaymentsService, useValue: payments },
        { provide: AiMarketingGrowthService, useValue: {} },
        { provide: AiNotificationSettingsService, useValue: notificationSettings },
        { provide: AiWhatsappIntegrationService, useValue: {} },
        { provide: AiPushNotificationsService, useValue: {} },
        { provide: AiIntegrationsService, useValue: {} },
        { provide: AiOperationsService, useValue: {} },
        { provide: AiBusinessCurrencyService, useValue: {} },
        { provide: AiBusinessTaxService, useValue: {} },
        { provide: AiBusinessComplianceService, useValue: {} },
        { provide: AiBusinessLanguagesService, useValue: {} },
        { provide: AiBusinessDateFormatService, useValue: {} },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
      ],
    }).compile();

    service = module.get(AiDashboardCoreService);
  });

  const baseCtx = {
    businessId: 'biz-1',
    params: {},
    effectivePrompt: 'test prompt',
    services: [] as never[],
    customers: [] as never[],
    resolveCustomer: () => undefined,
    isExecutionConfirmed: () => false,
  };

  it('returns null for legacy switch intents', async () => {
    const result = await service.tryDispatch({
      ...baseCtx,
      action: 'create_booking',
    });
    expect(result).toBeNull();
  });

  it('dispatches catalog intent via tryDispatch', async () => {
    const result = await service.tryDispatch({
      ...baseCtx,
      action: 'list_packages',
      effectivePrompt: 'list packages',
    });
    expect(result?.success).toBe(true);
    expect(catalog.handleListPackages).toHaveBeenCalledWith('biz-1');
  });

  it('dispatches payments intent via tryDispatch', async () => {
    const result = await service.tryDispatch({
      ...baseCtx,
      action: 'summarize_unpaid',
    });
    expect(result?.action).toBe('summarize_unpaid');
    expect(payments.dispatchIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        action: 'summarize_unpaid',
      }),
    );
  });

  it('dispatches settings intent via tryDispatch', async () => {
    const result = await service.tryDispatch({
      ...baseCtx,
      action: 'configure_notification_settings',
      effectivePrompt: 'disable SMS',
    });
    expect(result?.action).toBe('configure_notification_settings');
    expect(
      notificationSettings.handleConfigureNotificationSettings,
    ).toHaveBeenCalledWith('biz-1', {}, 'disable SMS');
  });
});
