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
import { CREATE_PROMO_CODE_PROMPTS } from './ai-create-promo-code.fixtures.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';
import { PromoDiscountType } from '../promo-codes/entities/promo-code.entity.js';

describe('create_promo_code AI scenarios', () => {
  const promoCodesService = {
    create: jest.fn(
      async (_businessId: string, dto: Record<string, unknown>) => ({
        id: 'promo-1',
        code: dto.code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: null,
        maxUses: null,
        expiresAt: null,
        description: null,
        isActive: true,
      }),
    ),
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
          useValue: { getEntitlements: jest.fn() },
        },
        { provide: BillingService, useValue: { getSubscription: jest.fn() } },
        { provide: LoyaltyService, useValue: { getSettings: jest.fn() } },
        { provide: PromoCodesService, useValue: promoCodesService },
        { provide: StripeService, useValue: { isConfigured: false } },
        {
          provide: StripeIntegrationService,
          useValue: { getSettings: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'https://app.test') },
        },
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
          useValue: {
            findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'salon' })),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AiMarketingGrowthService);
  });

  it.each(CREATE_PROMO_CODE_PROMPTS.slice(0, 4))(
    'rescues dashboard prompt $id via marketing growth rescue',
    ({ prompt }) => {
      expect(rescueMarketingGrowthIntent(prompt, 'unknown')?.action).toBe(
        'create_promo_code',
      );
    },
  );

  it('disambiguates create from promo help', () => {
    expect(
      rescueMarketingGrowthIntent(
        'Create promo code SAVE10 for 20% off',
        'unknown',
      )?.action,
    ).toBe('create_promo_code');
    expect(
      rescueMarketingGrowthIntent('How do promo codes work', 'unknown')?.action,
    ).toBe('promo_code_help');
  });

  it('executes create_promo_code handler', async () => {
    const result = await service.handleCreatePromoCode(
      'biz-1',
      {},
      'Create promo code SAVE10 for 20% off',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('create_promo_code');
    expect(promoCodesService.create).toHaveBeenCalledWith('biz-1', {
      code: 'SAVE10',
      discountType: PromoDiscountType.PERCENT,
      discountValue: 20,
      minOrderAmount: undefined,
      maxUses: undefined,
      expiresAt: undefined,
      description: undefined,
    });
  });
});
