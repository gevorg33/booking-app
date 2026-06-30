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

describe('Sprint 34 marketing/growth AI scenarios', () => {
  const marketingAutomationService = {
    getSettings: jest.fn(async () => ({
      reEngagementEnabled: true,
      inactiveDaysThreshold: 90,
      postVisitReviewEnabled: true,
      reEngagementEmailEnabled: true,
      reEngagementSmsEnabled: false,
      minDaysBetweenReEngagement: 30,
      reEngagementPromoCode: null,
    })),
    updateSettings: jest.fn(async (_, dto) => ({
      reEngagementEnabled: dto.reEngagementEnabled ?? true,
      inactiveDaysThreshold: dto.inactiveDaysThreshold ?? 90,
      postVisitReviewEnabled: true,
      reEngagementEmailEnabled: true,
      reEngagementSmsEnabled: false,
      minDaysBetweenReEngagement: 30,
      reEngagementPromoCode: null,
    })),
    getSummary: jest.fn(async () => ({
      settings: { reEngagementEnabled: true },
      eligibleInactiveCustomers: 2,
      reEngagementSentLast30Days: 4,
    })),
    processBusinessReEngagement: jest.fn(async () => 2),
    findReEngagementCandidates: jest.fn(async () => [
      {
        customerId: 'c1',
        name: 'Anna',
        email: 'a@b.com',
        phone: null,
        lastCompletedAt: '2026-01-01',
      },
    ]),
  };

  const planEntitlementsService = {
    getEntitlements: jest.fn(async () => ({
      tierId: 'solo',
      tierName: 'Solo',
      isPaid: false,
      subscriptionPlanId: null,
      limits: {
        maxProviderSeats: 1,
        aiCommandsPerMonth: 25,
        flags: {
          stripeConnect: false,
          promoCodes: false,
          loyalty: false,
          memberships: false,
          giftCards: false,
        },
      },
      usage: { providerSeats: 1, aiCommandsThisMonth: 20 },
      atLimit: { providerSeats: true, aiCommands: false },
      aiUsageWarning: true,
    })),
  };

  const billingService = {
    getSubscription: jest.fn(async () => ({
      planId: null,
      status: 'inactive',
      plan: null,
    })),
    createCheckoutSession: jest.fn(async () => ({
      url: 'https://checkout.stripe.com/test',
    })),
  };

  const loyaltyService = {
    getBalance: jest.fn(async () => ({
      account: { pointsBalance: 80, lifetimeEarned: 100 },
      transactions: [],
    })),
    getPublicSummary: jest.fn(() => ({
      pointsBalance: 80,
      lifetimeEarned: 100,
      bonusDollarValue: 1,
      earnPercentCashback: 5,
      pointsValue: 8,
    })),
  };

  const promoCodesService = {
    findValidForCheckout: jest.fn(async () => ({
      code: 'WELCOME',
      discountType: 'percent',
      discountValue: 15,
      minOrderAmount: null,
      expiresAt: null,
    })),
  };

  const stripeService = { isConfigured: false };
  const stripeIntegrationService = {
    getPublicSettings: jest.fn(async () => ({
      configured: false,
      chargesEnabled: false,
      detailsSubmitted: false,
      oauthAvailable: true,
    })),
    startConnect: jest.fn(async () => ({ url: 'https://stripe.test/onboard' })),
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_URL') return 'https://app.test';
      return undefined;
    }),
  };

  let marketingGrowth: AiMarketingGrowthService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiMarketingGrowthService,
        AiIntentRescueService,
        {
          provide: MarketingAutomationService,
          useValue: marketingAutomationService,
        },
        { provide: PlanEntitlementsService, useValue: planEntitlementsService },
        { provide: BillingService, useValue: billingService },
        { provide: LoyaltyService, useValue: loyaltyService },
        { provide: PromoCodesService, useValue: promoCodesService },
        { provide: StripeService, useValue: stripeService },
        { provide: StripeIntegrationService, useValue: stripeIntegrationService },
        { provide: ConfigService, useValue: configService },
        {
          provide: TenantAppInstallService,
          useValue: {
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
          },
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: { count: jest.fn(async () => 7) },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            findOne: jest.fn(async () => ({ slug: 'salon', settings: {} })),
          },
        },
      ],
    }).compile();

    marketingGrowth = module.get(AiMarketingGrowthService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('rescue routing', () => {
    it('rescues marketingGrowth intents before retail finance', () => {
      expect(
        marketingGrowth.rescueMarketingGrowthIntent(
          'Explain plan limits',
          'unknown',
        )?.action,
      ).toBe('explain_plan_limits');
      expect(
        rescue.rescue({
          prompt: 'Explain plan limits',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('explain_plan_limits');
    });

    it('does not steal customerCrm single-customer re-engagement', () => {
      expect(
        marketingGrowth.rescueMarketingGrowthIntent(
          'Send re-engagement message to Anna',
          'unknown',
        ),
      ).toBeNull();
      expect(
        rescue.rescue({
          prompt: 'Send re-engagement message to Anna',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('send_reengagement_message');
    });

    it('does not steal integrations marketing registration email', () => {
      expect(
        marketingGrowth.rescueMarketingGrowthIntent(
          'Configure marketing registration email notifications',
          'unknown',
        ),
      ).toBeNull();
    });

    it('rescues all dashboard and customer marketing intents', () => {
      expect(
        rescue.rescue({
          prompt: 'Configure marketing automation',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('configure_marketing_automation');
      expect(
        rescue.rescue({
          prompt: 'Summarize automation performance',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('summarize_automation_performance');
      expect(
        rescue.rescue({
          prompt: 'Trigger re-engagement campaign',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('trigger_reengagement');
      expect(
        rescue.rescue({
          prompt: 'List inactive customers',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('list_inactive_customers');
      expect(
        rescue.rescue({
          prompt: 'Suggest upgrade plan',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('suggest_upgrade');
      expect(
        rescue.rescue({
          prompt: 'Switch to annual billing',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('toggle_annual_billing');
      expect(
        rescue.rescue({
          prompt: 'Summarize new registrations this month',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('summarize_new_registrations');
      expect(
        rescue.rescue({
          prompt: 'How do I download the app',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('how_to_download_app');
      expect(
        rescue.rescue({
          prompt: 'Switch to consumer app',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('switch_to_consumer_app');
      expect(
        rescue.rescue({
          prompt: 'How do promo codes work',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('promo_code_help');
      expect(
        rescue.rescue({
          prompt: 'What is my loyalty points balance',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('loyalty_points_balance');
      expect(
        marketingGrowth.isMarketingGrowthCompound(
          'List inactive customers and trigger re-engagement',
        ),
      ).toBe(true);
    });
  });

  describe('dashboard handlers', () => {
    it('runs marketing automation and billing intents', async () => {
      expect(
        (
          await marketingGrowth.handleConfigureMarketingAutomation('biz-1', {
            reEngagementEnabled: true,
          })
        ).success,
      ).toBe(true);
      expect(
        (await marketingGrowth.handleSummarizeAutomationPerformance('biz-1'))
          .success,
      ).toBe(true);
      expect(
        (await marketingGrowth.handleTriggerReengagement('biz-1')).success,
      ).toBe(true);
      expect(
        (await marketingGrowth.handleListInactiveCustomers('biz-1')).success,
      ).toBe(true);
      expect(
        (await marketingGrowth.handleExplainPlanLimits('biz-1')).success,
      ).toBe(true);
      expect(
        (await marketingGrowth.handleSuggestUpgrade('biz-1')).success,
      ).toBe(true);
      expect(
        (await marketingGrowth.handleToggleAnnualBilling('biz-1', {})).success,
      ).toBe(true);
      expect(
        (
          await marketingGrowth.handleSummarizeNewRegistrations(
            'biz-1',
            {},
            'this month',
          )
        ).success,
      ).toBe(true);
    });
  });

  describe('customer handlers', () => {
    it('runs consumer app, promo, and loyalty intents', async () => {
      expect(
        (await marketingGrowth.handleHowToDownloadApp('biz-1')).success,
      ).toBe(true);
      expect(
        (await marketingGrowth.handleSwitchToConsumerApp('biz-1')).success,
      ).toBe(true);
      expect(
        (
          await marketingGrowth.handlePromoCodeHelp('biz-1', {
            promoCode: 'WELCOME',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await marketingGrowth.handleLoyaltyPointsBalance('biz-1', {
            sessionCustomerId: 'cust-1',
          })
        ).success,
      ).toBe(true);
    });
  });

  describe('compound flows', () => {
    it('executes multi-step marketing/growth commands', async () => {
      const configureSummary =
        await marketingGrowth.handleMarketingGrowthCompound(
          'biz-1',
          'Configure re-engagement automation and summarize automation performance',
          {},
        );
      expect(configureSummary.success).toBe(true);
      expect((configureSummary.details as any).marketingGrowthCompound).toBe(
        true,
      );

      const listTrigger = await marketingGrowth.handleMarketingGrowthCompound(
        'biz-1',
        'List inactive customers and trigger re-engagement',
        {},
      );
      expect(listTrigger.success).toBe(true);

      const planUpgrade = await marketingGrowth.handleMarketingGrowthCompound(
        'biz-1',
        'Explain plan limits and suggest upgrade',
        {},
      );
      expect(planUpgrade.success).toBe(true);

      const appLoyalty = await marketingGrowth.handleMarketingGrowthCompound(
        'biz-1',
        'How do I download the consumer app and check my loyalty points balance',
        { sessionCustomerId: 'cust-1' },
      );
      expect(appLoyalty.success).toBe(true);

      const stopped = await marketingGrowth.handleMarketingGrowthCompound(
        'biz-1',
        'compound',
        {
          compoundSteps: [
            { action: 'explain_plan_limits', params: {}, segment: 'a' },
            {
              action: 'configure_marketing_automation',
              params: {},
              segment: 'b',
            },
          ],
        },
      );
      expect(stopped.success).toBe(false);
      expect((stopped.details as any).failedStep).toBe(
        'configure_marketing_automation',
      );
      expect((stopped.details as any).steps.length).toBe(2);
    });
  });
});
