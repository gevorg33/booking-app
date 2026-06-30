import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { MarketingAutomationService } from '../marketing-automation/marketing-automation.service.js';
import { PlanEntitlementsService } from '../billing/plan-entitlements.service.js';
import { BillingService } from '../billing/billing.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { PromoCodesService } from '../promo-codes/promo-codes.service.js';
import { StripeService } from '../billing/stripe.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { TenantAppInstallService } from '../business/tenant-app-install.service.js';
import { CONFIGURE_LOYALTY_SETTINGS_PROMPTS } from './ai-configure-loyalty-settings.fixtures.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';

describe('configure_loyalty_settings AI scenarios', () => {
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      slug: 'salon',
      settings: { loyalty: { earnPercentCashback: 5, enabled: true } },
    })),
    save: jest.fn(async (row: Record<string, unknown>) => row),
  };

  let service: AiMarketingGrowthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiMarketingGrowthService,
        {
          provide: MarketingAutomationService,
          useValue: { getSettings: jest.fn(), updateSettings: jest.fn() },
        },
        {
          provide: PlanEntitlementsService,
          useValue: { getEntitlements: jest.fn(), assertFeature: jest.fn() },
        },
        { provide: BillingService, useValue: { getSubscription: jest.fn() } },
        { provide: LoyaltyService, useValue: { getSettings: jest.fn() } },
        { provide: PromoCodesService, useValue: { create: jest.fn() } },
        { provide: StripeService, useValue: { isConfigured: false } },
        { provide: StripeIntegrationService, useValue: { getSettings: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn(() => 'https://app.test') } },
        {
          provide: TenantAppInstallService,
          useValue: {
            ensureForBusiness: jest.fn(),
            regenerateForBusiness: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: { find: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: businessRepo,
        },
      ],
    }).compile();

    service = moduleRef.get(AiMarketingGrowthService);
  });

  it.each(CONFIGURE_LOYALTY_SETTINGS_PROMPTS.slice(0, 4))(
    'rescues dashboard prompt $id via marketing growth rescue',
    ({ prompt }) => {
      expect(rescueMarketingGrowthIntent(prompt, 'unknown')?.action).toBe(
        'configure_loyalty_settings',
      );
    },
  );

  it('disambiguates configure from summarize loyalty', () => {
    expect(
      rescueMarketingGrowthIntent('Set loyalty earn rate to 10%', 'unknown')
        ?.action,
    ).toBe('configure_loyalty_settings');
    expect(
      rescueMarketingGrowthIntent('How does loyalty work', 'unknown')?.action,
    ).toBe('summarize_loyalty_program');
  });

  it('executes configure_loyalty_settings handler', async () => {
    const result = await service.handleConfigureLoyaltySettings(
      'biz-1',
      {},
      'Set loyalty earn rate to 10%',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_loyalty_settings');
    expect(businessRepo.save).toHaveBeenCalled();
    const saved = businessRepo.save.mock.calls[0][0] as {
      settings: { loyalty: { earnPercentCashback: number } };
    };
    expect(saved.settings.loyalty.earnPercentCashback).toBe(10);
  });
});
