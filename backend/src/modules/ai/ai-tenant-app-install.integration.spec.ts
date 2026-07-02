import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
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
import { EXPLAIN_TENANT_APP_INSTALL_PROMPTS } from './ai-tenant-app-install.fixtures.js';
import { REGENERATE_TENANT_APP_INSTALL_QR_PROMPTS } from './ai-tenant-app-install.fixtures.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';

describe('Sprint 34 tenant app install AI scenarios', () => {
  const tenantAppInstallService = {
    ensureForBusiness: jest.fn(async (business: { slug: string }) => ({
      slug: business.slug,
      landingUrl: `https://app.test/get-app/${business.slug}?src=qr&utm_campaign=venue_qr`,
      qrDataUrl: 'data:image/png;base64,abc',
      customSchemeUrl: `optischedule://book/${business.slug}`,
      generatedAt: '2026-06-01T00:00:00.000Z',
    })),
    regenerateForBusiness: jest.fn(async (business: { slug: string }) => ({
      slug: business.slug,
      landingUrl: `https://app.test/get-app/${business.slug}?src=qr&utm_campaign=venue_qr`,
      qrDataUrl: 'data:image/png;base64,regenerated',
      customSchemeUrl: `optischedule://book/${business.slug}`,
      generatedAt: '2026-06-02T00:00:00.000Z',
    })),
  };

  let service: AiMarketingGrowthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiMarketingGrowthService,
        AiIntentRescueService,
        {
          provide: MarketingAutomationService,
          useValue: { getSettings: jest.fn(), updateSettings: jest.fn() },
        },
        {
          provide: PlanEntitlementsService,
          useValue: { getEntitlements: jest.fn() },
        },
        {
          provide: BillingService,
          useValue: { getSubscription: jest.fn() },
        },
        {
          provide: LoyaltyService,
          useValue: { getSettings: jest.fn() },
        },
        {
          provide: PromoCodesService,
          useValue: { findValidForCheckout: jest.fn() },
        },
        {
          provide: StripeService,
          useValue: { isConfigured: false },
        },
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
          useValue: tenantAppInstallService,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: { find: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            findOne: jest.fn(async () => ({
              id: 'biz-1',
              slug: 'salon-demo',
              settings: {},
            })),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AiMarketingGrowthService);
  });

  it.each(EXPLAIN_TENANT_APP_INSTALL_PROMPTS.slice(0, 4))(
    'rescues dashboard prompt $id via marketing growth rescue',
    ({ prompt }) => {
      expect(rescueMarketingGrowthIntent(prompt, 'unknown')?.action).toBe(
        'explain_tenant_app_install',
      );
    },
  );

  it('disambiguates regenerate from explain tenant app install', () => {
    expect(
      rescueMarketingGrowthIntent('Regenerate tenant app install QR', 'unknown')
        ?.action,
    ).toBe('regenerate_tenant_app_install_qr');
    expect(
      rescueMarketingGrowthIntent(
        'Explain our tenant app install QR',
        'unknown',
      )?.action,
    ).toBe('explain_tenant_app_install');
  });

  it.each(REGENERATE_TENANT_APP_INSTALL_QR_PROMPTS.slice(0, 4))(
    'rescues regenerate prompt $id via marketing growth rescue',
    ({ prompt }) => {
      expect(rescueMarketingGrowthIntent(prompt, 'unknown')?.action).toBe(
        'regenerate_tenant_app_install_qr',
      );
    },
  );

  it('disambiguates customer download from tenant app install explain', () => {
    expect(
      rescueMarketingGrowthIntent(
        'How do I download the app on my phone',
        'unknown',
      )?.action,
    ).toBe('how_to_download_app');
    expect(
      rescueMarketingGrowthIntent(
        'How do customers install our app via QR',
        'unknown',
      )?.action,
    ).toBe('explain_tenant_app_install');
  });

  it('executes explain_tenant_app_install handler', async () => {
    const result = await service.handleExplainTenantAppInstall('biz-1');
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_tenant_app_install');
    expect(result.summary).toContain('/get-app/salon-demo');
    expect(tenantAppInstallService.ensureForBusiness).toHaveBeenCalled();
  });

  it('executes regenerate_tenant_app_install_qr handler', async () => {
    const result = await service.handleRegenerateTenantAppInstallQr('biz-1');
    expect(result.success).toBe(true);
    expect(result.action).toBe('regenerate_tenant_app_install_qr');
    expect(result.summary).toContain('Regenerated tenant app install QR');
    expect(tenantAppInstallService.regenerateForBusiness).toHaveBeenCalled();
  });
});
