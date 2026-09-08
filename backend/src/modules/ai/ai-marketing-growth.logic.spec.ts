import {
  handleConfigureMarketingAutomationLogic,
  handleSummarizeAutomationPerformanceLogic,
  handleTriggerReengagementLogic,
  handleListInactiveCustomersLogic,
  handleExplainPlanLimitsLogic,
  handleSuggestUpgradeLogic,
  handleToggleAnnualBillingLogic,
  handleSummarizeNewRegistrationsLogic,
  handleHowToDownloadAppLogic,
  handleSwitchToConsumerAppLogic,
  handlePromoCodeHelpLogic,
  handleLoyaltyPointsBalanceLogic,
  handleOpenBillingSettingsLogic,
  handleStartBillingCheckoutLogic,
  handleConfirmBillingCheckoutLogic,
  handleExplainPlanEntitlementsLogic,
  handleSummarizeLoyaltyProgramLogic,
  handleMarketingGrowthCompoundLogic,
  mergeMarketingGrowthCompoundContext,
  type MarketingGrowthLogicDeps,
} from './ai-marketing-growth.logic.js';
import { handleExplainTenantAppInstallLogic } from './ai-tenant-app-install.logic.js';
import { handleRegenerateTenantAppInstallQrLogic } from './ai-tenant-app-install.logic.js';
import { handleCreatePromoCodeLogic } from './ai-create-promo-code.logic.js';
import { handleConfigureLoyaltySettingsLogic } from './ai-configure-loyalty-settings.logic.js';
import * as plans from '../billing/plans.js';
import * as orchestration from './ai-orchestration.helpers.js';

const entitlementsSolo = {
  tierId: 'solo' as const,
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
  usage: { providerSeats: 1, aiCommandsThisMonth: 24 },
  atLimit: { providerSeats: true, aiCommands: false },
  aiUsageWarning: true,
};

const entitlementsStarter = {
  ...entitlementsSolo,
  tierId: 'starter' as const,
  tierName: 'Starter',
  isPaid: true,
  subscriptionPlanId: 'starter',
  limits: {
    maxProviderSeats: 5,
    aiCommandsPerMonth: 150,
    flags: {
      stripeConnect: true,
      promoCodes: true,
      loyalty: false,
      memberships: false,
      giftCards: false,
    },
  },
  usage: { providerSeats: 2, aiCommandsThisMonth: 10 },
  atLimit: { providerSeats: false, aiCommands: false },
};

const entitlementsBusiness = {
  ...entitlementsStarter,
  tierId: 'business' as const,
  tierName: 'Business',
  subscriptionPlanId: 'business',
};

function buildDeps(
  overrides: Partial<MarketingGrowthLogicDeps> = {},
): MarketingGrowthLogicDeps {
  return {
    marketingAutomationService: {
      getSettings: jest.fn(async () => ({
        reEngagementEnabled: false,
        inactiveDaysThreshold: 90,
        postVisitReviewEnabled: true,
        reEngagementEmailEnabled: true,
        reEngagementSmsEnabled: false,
        minDaysBetweenReEngagement: 30,
        reEngagementPromoCode: null,
      })),
      updateSettings: jest.fn(async (_, dto) => ({
        reEngagementEnabled: dto.reEngagementEnabled ?? false,
        inactiveDaysThreshold: dto.inactiveDaysThreshold ?? 90,
        postVisitReviewEnabled: true,
        reEngagementEmailEnabled: true,
        reEngagementSmsEnabled: false,
        minDaysBetweenReEngagement: 30,
        reEngagementPromoCode: dto.reEngagementPromoCode ?? null,
      })),
      getSummary: jest.fn(async () => ({
        settings: { reEngagementEnabled: true },
        eligibleInactiveCustomers: 3,
        reEngagementSentLast30Days: 5,
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
    } as any,
    planEntitlementsService: {
      getEntitlements: jest.fn(async () => entitlementsSolo),
      assertFeature: jest.fn(async () => undefined),
    } as any,
    billingService: {
      getSubscription: jest.fn(async () => ({
        planId: null,
        status: 'inactive',
        plan: null,
      })),
      createCheckoutSession: jest.fn(async () => ({
        url: 'https://checkout.stripe.com/session',
      })),
      createPortalSession: jest.fn(async () => ({
        url: 'https://billing.stripe.com/portal',
      })),
      confirmCheckoutSession: jest.fn(async () => ({
        status: 'active',
        planId: 'starter',
        plan: { id: 'starter', name: 'Starter' },
        currentPeriodEnd: '2026-08-01T00:00:00.000Z',
        isActive: true,
        stripeCustomerId: 'cus_123',
      })),
    } as any,
    loyaltyService: {
      getBalance: jest.fn(async () => ({
        account: { pointsBalance: 120, lifetimeEarned: 200 },
        transactions: [],
      })),
      getPublicSummary: jest.fn(() => ({
        pointsBalance: 120,
        lifetimeEarned: 200,
        bonusDollarValue: 1,
        earnPercentCashback: 5,
        pointsValue: 12,
      })),
    } as any,
    promoCodesService: {
      findValidForCheckout: jest.fn(async () => ({
        code: 'SAVE10',
        discountType: 'percent',
        discountValue: 10,
        minOrderAmount: null,
        expiresAt: null,
      })),
      create: jest.fn(
        async (_businessId: string, dto: Record<string, unknown>) => ({
          id: 'promo-1',
          code: dto.code,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          minOrderAmount: dto.minOrderAmount ?? null,
          maxUses: dto.maxUses ?? null,
          expiresAt: dto.expiresAt ?? null,
          description: dto.description ?? null,
          isActive: true,
        }),
      ),
    } as any,
    stripeService: { isConfigured: false } as any,
    configService: {
      get: jest.fn((key: string) => {
        if (key === 'FRONTEND_URL') return 'https://app.test';
        if (key === 'CONSUMER_IOS_APP_URL') return 'https://apps.apple.com/app';
        if (key === 'CONSUMER_ANDROID_APP_URL') return null;
        return undefined;
      }),
    } as any,
    customerRepo: { count: jest.fn(async () => 12) } as any,
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        slug: 'salon',
        settings: { loyalty: { earnPercentCashback: 5, enabled: true } },
      })),
      save: jest.fn(async (row: Record<string, unknown>) => row),
    } as any,
    stripeIntegrationService: {
      getPublicSettings: jest.fn(async () => ({ configured: false })),
      startConnect: jest.fn(async () => ({ url: 'https://stripe.test' })),
    } as any,
    tenantAppInstallService: {
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
    } as any,
    ...overrides,
  };
}

describe('ai-marketing-growth.logic', () => {
  it('handles configure marketing automation', async () => {
    const deps = buildDeps();
    expect(
      (await handleConfigureMarketingAutomationLogic(deps, 'biz-1', {}))
        .success,
    ).toBe(false);
    expect(
      (
        await handleConfigureMarketingAutomationLogic(deps, 'biz-1', {
          reEngagementEnabled: true,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleConfigureMarketingAutomationLogic(
          deps,
          'biz-1',
          {},
          'enable re-engagement 60 days promo code WIN',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleConfigureMarketingAutomationLogic(deps, 'biz-1', {
          postVisitReviewEnabled: false,
          reEngagementEmailEnabled: true,
          reEngagementSmsEnabled: true,
          minDaysBetweenReEngagement: 14,
        })
      ).success,
    ).toBe(true);
    const failing = buildDeps({
      marketingAutomationService: {
        ...buildDeps().marketingAutomationService,
        updateSettings: jest.fn(async () => {
          throw new Error('fail');
        }),
      } as any,
    });
    expect(
      (
        await handleConfigureMarketingAutomationLogic(failing, 'biz-1', {
          reEngagementEnabled: true,
        })
      ).success,
    ).toBe(false);
  });

  it('handles automation read and trigger flows', async () => {
    const deps = buildDeps();
    expect(
      (await handleSummarizeAutomationPerformanceLogic(deps, 'biz-1')).success,
    ).toBe(true);
    expect((await handleTriggerReengagementLogic(deps, 'biz-1')).success).toBe(
      true,
    );
    expect(
      (await handleListInactiveCustomersLogic(deps, 'biz-1')).success,
    ).toBe(true);

    const zeroSent = buildDeps({
      marketingAutomationService: {
        ...buildDeps().marketingAutomationService,
        processBusinessReEngagement: jest.fn(async () => 0),
      } as any,
    });
    expect(
      (await handleTriggerReengagementLogic(zeroSent, 'biz-1')).summary,
    ).toContain('no eligible');

    const failSummary = buildDeps({
      marketingAutomationService: {
        ...buildDeps().marketingAutomationService,
        getSummary: jest.fn(async () => {
          throw new Error('fail');
        }),
        getSettings: jest.fn(async () => {
          throw new Error('fail');
        }),
        processBusinessReEngagement: jest.fn(async () => {
          throw new Error('fail');
        }),
      } as any,
    });
    expect(
      (await handleSummarizeAutomationPerformanceLogic(failSummary, 'biz-1'))
        .success,
    ).toBe(false);
    expect(
      (await handleListInactiveCustomersLogic(failSummary, 'biz-1')).success,
    ).toBe(false);
    expect(
      (await handleTriggerReengagementLogic(failSummary, 'biz-1')).success,
    ).toBe(false);
  });

  it('handles plan limits and upgrade suggestions', async () => {
    const solo = buildDeps();
    expect((await handleExplainPlanLimitsLogic(solo, 'biz-1')).success).toBe(
      true,
    );

    const soloUpgrade = await handleSuggestUpgradeLogic(solo, 'biz-1');
    expect(soloUpgrade.success).toBe(true);
    expect((soloUpgrade.details as any).recommendation.planId).toBe('starter');

    const starter = buildDeps({
      planEntitlementsService: {
        getEntitlements: jest.fn(async () => entitlementsStarter),
      } as any,
    });
    expect(
      (await handleSuggestUpgradeLogic(starter, 'biz-1')).details,
    ).toMatchObject({
      recommendation: { planId: 'business' },
    });

    const business = buildDeps({
      planEntitlementsService: {
        getEntitlements: jest.fn(async () => entitlementsBusiness),
      } as any,
    });
    expect(
      (await handleSuggestUpgradeLogic(business, 'biz-1')).summary,
    ).toContain('no higher tier');

    const failPlan = buildDeps({
      planEntitlementsService: {
        getEntitlements: jest.fn(async () => {
          throw new Error('fail');
        }),
      } as any,
    });
    expect(
      (await handleExplainPlanLimitsLogic(failPlan, 'biz-1')).success,
    ).toBe(false);
    expect((await handleSuggestUpgradeLogic(failPlan, 'biz-1')).success).toBe(
      false,
    );
  });

  it('handles annual billing toggle with and without stripe', async () => {
    const noStripe = buildDeps();
    expect(
      (await handleToggleAnnualBillingLogic(noStripe, 'biz-1', {})).success,
    ).toBe(true);
    expect(
      (await handleToggleAnnualBillingLogic(noStripe, 'biz-1', {})).details,
    ).toMatchObject({
      stripeConfigured: false,
    });

    const withStripe = buildDeps({
      stripeService: { isConfigured: true } as any,
    });
    expect(
      (
        await handleToggleAnnualBillingLogic(
          withStripe,
          'biz-1',
          {},
          'owner@test.com',
        )
      ).success,
    ).toBe(true);

    const failCheckout = buildDeps({
      stripeService: { isConfigured: true } as any,
      billingService: {
        getSubscription: jest.fn(async () => ({ planId: 'starter' })),
        createCheckoutSession: jest.fn(async () => {
          throw new Error('checkout fail');
        }),
      } as any,
    });
    expect(
      (await handleToggleAnnualBillingLogic(failCheckout, 'biz-1', {})).success,
    ).toBe(false);
  });

  it('handles registrations, app guidance, promo, and loyalty', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleSummarizeNewRegistrationsLogic(
          deps,
          'biz-1',
          {},
          'this month',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSummarizeNewRegistrationsLogic(deps, 'biz-1', {
          from: '2026-06-01',
          to: '2026-06-30',
        })
      ).success,
    ).toBe(true);
    expect((await handleHowToDownloadAppLogic(deps, 'biz-1')).success).toBe(
      true,
    );
    const download = await handleHowToDownloadAppLogic(deps, 'biz-1');
    expect(download.summary).toContain('/get-app/salon');
    expect(download.details?.guidance).toMatchObject({
      landingUrl: expect.stringContaining('/get-app/salon'),
    });
    expect(
      (await handleExplainTenantAppInstallLogic(deps, 'biz-1')).success,
    ).toBe(true);
    expect(
      (await handleRegenerateTenantAppInstallQrLogic(deps, 'biz-1')).success,
    ).toBe(true);
    expect(
      (
        await handleCreatePromoCodeLogic(
          deps,
          'biz-1',
          {},
          'Create promo code SAVE10 for 20% off',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleConfigureLoyaltySettingsLogic(
          deps,
          'biz-1',
          {},
          'Set loyalty earn rate to 10%',
        )
      ).success,
    ).toBe(true);
    const loyaltyConfigureCompound = await handleMarketingGrowthCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'configure_loyalty_settings',
            params: {},
            segment: 'Set loyalty earn rate to 10%',
          },
          {
            action: 'explain_plan_limits',
            params: {},
            segment: 'Explain plan limits',
          },
        ],
      },
    );
    expect(loyaltyConfigureCompound.success).toBe(true);
    expect((await handleOpenBillingSettingsLogic(deps, 'biz-1')).success).toBe(
      true,
    );
    const startCheckoutMissingPlan = await handleStartBillingCheckoutLogic(
      deps,
      'biz-1',
      {},
    );
    expect(startCheckoutMissingPlan.success).toBe(false);
    expect(startCheckoutMissingPlan.details.clarify).toBe(true);
    const startCheckoutByName = await handleStartBillingCheckoutLogic(
      deps,
      'biz-1',
      { planName: 'Starter' },
    );
    expect(startCheckoutByName.success).toBe(true);
    expect(deps.billingService.createCheckoutSession).toHaveBeenCalledWith(
      'biz-1',
      'starter',
      '',
      'month',
    );
    const startCheckoutByIdYearly = await handleStartBillingCheckoutLogic(
      deps,
      'biz-1',
      { planId: 'starter', billingInterval: 'year' },
    );
    expect(startCheckoutByIdYearly.success).toBe(true);
    expect(deps.billingService.createCheckoutSession).toHaveBeenLastCalledWith(
      'biz-1',
      'starter',
      '',
      'year',
    );
    const startCheckoutUnknownPlan = await handleStartBillingCheckoutLogic(
      deps,
      'biz-1',
      { planName: 'Nonexistent' },
    );
    expect(startCheckoutUnknownPlan.success).toBe(false);
    const startCheckoutNoBusiness = await handleStartBillingCheckoutLogic(
      buildDeps({
        businessRepo: { findOne: jest.fn(async () => null) } as any,
      }),
      'biz-1',
      { planName: 'Starter' },
    );
    expect(startCheckoutNoBusiness.success).toBe(false);
    const startCheckoutFails = await handleStartBillingCheckoutLogic(
      buildDeps({
        billingService: {
          createCheckoutSession: jest.fn(async () => {
            throw new Error('Stripe is not configured on the server');
          }),
        } as any,
      }),
      'biz-1',
      { planName: 'Starter' },
    );
    expect(startCheckoutFails.success).toBe(false);
    expect(startCheckoutFails.summary).toContain('not configured');
    const confirmCheckoutMissingSession =
      await handleConfirmBillingCheckoutLogic(deps, 'biz-1', {});
    expect(confirmCheckoutMissingSession.success).toBe(false);
    expect(confirmCheckoutMissingSession.details?.clarify).toBe(true);
    const confirmCheckoutOk = await handleConfirmBillingCheckoutLogic(
      deps,
      'biz-1',
      { sessionId: 'cs_test_123' },
    );
    expect(confirmCheckoutOk.success).toBe(true);
    expect(deps.billingService.confirmCheckoutSession).toHaveBeenCalledWith(
      'biz-1',
      'cs_test_123',
    );
    const confirmCheckoutFails = await handleConfirmBillingCheckoutLogic(
      buildDeps({
        billingService: {
          confirmCheckoutSession: jest.fn(async () => {
            throw new Error(
              'Checkout session does not belong to this business',
            );
          }),
        } as any,
      }),
      'biz-1',
      { sessionId: 'cs_test_bad' },
    );
    expect(confirmCheckoutFails.success).toBe(false);
    expect(
      (await handleExplainPlanEntitlementsLogic(deps, 'biz-1')).success,
    ).toBe(true);
    const entitlementsFail = buildDeps({
      planEntitlementsService: {
        getEntitlements: jest.fn(async () => {
          throw new Error('entitlements fail');
        }),
      } as any,
    });
    expect(
      (await handleExplainPlanEntitlementsLogic(entitlementsFail, 'biz-1'))
        .success,
    ).toBe(false);
    expect(
      (await handleSummarizeLoyaltyProgramLogic(deps, 'biz-1')).success,
    ).toBe(true);
    const billingFail = buildDeps({
      billingService: {
        getSubscription: jest.fn(async () => ({ planId: null })),
        createCheckoutSession: jest.fn(async () => ({ url: 'x' })),
        createPortalSession: jest.fn(async () => {
          throw new Error('portal fail');
        }),
      } as any,
    });
    expect(
      (await handleOpenBillingSettingsLogic(billingFail, 'biz-1')).success,
    ).toBe(false);
    const loyaltyFail = buildDeps({
      businessRepo: {
        findOne: jest.fn(async () => {
          throw new Error('loyalty fail');
        }),
      } as any,
    });
    expect(
      (await handleSummarizeLoyaltyProgramLogic(loyaltyFail, 'biz-1')).success,
    ).toBe(false);
    expect((await handleSwitchToConsumerAppLogic(deps, 'biz-1')).success).toBe(
      true,
    );
    expect(
      (
        await handlePromoCodeHelpLogic(
          deps,
          'biz-1',
          {},
          'how promo codes work',
        )
      ).success,
    ).toBe(true);
    expect(
      (await handlePromoCodeHelpLogic(deps, 'biz-1', { promoCode: 'SAVE10' }))
        .details,
    ).toMatchObject({
      validated: true,
    });

    const noPromoService = buildDeps({ promoCodesService: undefined });
    expect(
      (
        await handlePromoCodeHelpLogic(noPromoService, 'biz-1', {
          promoCode: 'X',
        })
      ).details,
    ).toMatchObject({
      validated: false,
    });

    const invalidPromo = buildDeps({
      promoCodesService: {
        findValidForCheckout: jest.fn(async () => {
          throw new Error('Invalid promo code');
        }),
      } as any,
    });
    expect(
      (
        await handlePromoCodeHelpLogic(invalidPromo, 'biz-1', {
          promoCode: 'BAD',
        })
      ).success,
    ).toBe(true);

    expect(
      (await handleLoyaltyPointsBalanceLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleLoyaltyPointsBalanceLogic(deps, 'biz-1', {
          sessionCustomerId: 'cust-1',
        })
      ).success,
    ).toBe(true);

    const failLoyalty = buildDeps({
      loyaltyService: {
        getBalance: jest.fn(async () => {
          throw new Error('fail');
        }),
      } as any,
    });
    expect(
      (
        await handleLoyaltyPointsBalanceLogic(failLoyalty, 'biz-1', {
          sessionCustomerId: 'cust-1',
        })
      ).success,
    ).toBe(false);

    const failReg = buildDeps({
      customerRepo: {
        count: jest.fn(async () => {
          throw new Error('fail');
        }),
      } as any,
    });
    expect(
      (
        await handleSummarizeNewRegistrationsLogic(failReg, 'biz-1', {
          from: '2026-06-01',
        })
      ).success,
    ).toBe(false);

    const onlyFrom = buildDeps();
    expect(
      (
        await handleSummarizeNewRegistrationsLogic(onlyFrom, 'biz-1', {
          from: '2026-06-01',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSummarizeNewRegistrationsLogic(onlyFrom, 'biz-1', {
          to: '2026-06-30',
        })
      ).success,
    ).toBe(true);

    const noSlug = buildDeps({
      businessRepo: { findOne: jest.fn(async () => null) } as any,
    });
    expect((await handleHowToDownloadAppLogic(noSlug, 'biz-1')).success).toBe(
      false,
    );
  });

  it('handles compound flows and context merge', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleMarketingGrowthCompoundLogic(
          deps,
          'biz-1',
          'Explain plan limits and suggest upgrade',
          {},
        )
      ).success,
    ).toBe(true);

    const configureSummary = await handleMarketingGrowthCompoundLogic(
      deps,
      'biz-1',
      'Configure re-engagement automation and summarize automation performance',
      {},
    );
    expect(configureSummary.success).toBe(true);
    expect((configureSummary.details as any).marketingGrowthCompound).toBe(
      true,
    );

    const listTrigger = await handleMarketingGrowthCompoundLogic(
      deps,
      'biz-1',
      'List inactive customers and trigger re-engagement',
      {},
    );
    expect(listTrigger.success).toBe(true);

    const stopped = await handleMarketingGrowthCompoundLogic(
      deps,
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

    expect(
      (
        await handleMarketingGrowthCompoundLogic(
          deps,
          'biz-1',
          'only one action here',
          {},
        )
      ).success,
    ).toBe(false);

    expect(
      mergeMarketingGrowthCompoundContext(
        {},
        { action: 'configure_marketing_automation', params: {}, segment: 'x' },
        {
          success: true,
          action: 'configure_marketing_automation',
          summary: '',
          details: { settings: {} },
        },
      ).automationConfigured,
    ).toBe(true);
    expect(
      mergeMarketingGrowthCompoundContext(
        {},
        { action: 'list_inactive_customers', params: {}, segment: 'x' },
        {
          success: true,
          action: 'list_inactive_customers',
          summary: '',
          details: { count: 4 },
        },
      ).inactiveCustomerCount,
    ).toBe(4);
    expect(
      mergeMarketingGrowthCompoundContext(
        {},
        { action: 'explain_plan_limits', params: {}, segment: 'x' },
        {
          success: true,
          action: 'explain_plan_limits',
          summary: '',
          details: { entitlements: entitlementsSolo },
        },
      ).planEntitlements,
    ).toEqual(entitlementsSolo);
    expect(
      mergeMarketingGrowthCompoundContext(
        {},
        { action: 'how_to_download_app', params: {}, segment: 'x' },
        {
          success: true,
          action: 'how_to_download_app',
          summary: '',
          details: {
            guidance: { landingUrl: 'https://app.test/get-app/salon' },
          },
        },
      ).consumerAppGuidance,
    ).toMatchObject({ landingUrl: 'https://app.test/get-app/salon' });
    expect(
      mergeMarketingGrowthCompoundContext(
        {},
        { action: 'explain_tenant_app_install', params: {}, segment: 'x' },
        {
          success: true,
          action: 'explain_tenant_app_install',
          summary: '',
          details: { appInstall: { slug: 'salon' } },
        },
      ).tenantAppInstall,
    ).toEqual({ slug: 'salon' });
    expect(
      mergeMarketingGrowthCompoundContext(
        {},
        {
          action: 'regenerate_tenant_app_install_qr',
          params: {},
          segment: 'x',
        },
        {
          success: true,
          action: 'regenerate_tenant_app_install_qr',
          summary: '',
          details: { appInstall: { slug: 'salon' }, regenerated: true },
        },
      ).tenantAppInstallRegenerated,
    ).toBe(true);

    const tenantInstallCompound = await handleMarketingGrowthCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'explain_tenant_app_install',
            params: {},
            segment: 'Explain our tenant app install QR',
          },
          {
            action: 'explain_plan_limits',
            params: {},
            segment: 'Explain plan limits',
          },
        ],
      },
    );
    expect(tenantInstallCompound.success).toBe(true);

    const regenerateCompound = await handleMarketingGrowthCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'regenerate_tenant_app_install_qr',
            params: {},
            segment: 'Regenerate tenant app install QR',
          },
          {
            action: 'explain_tenant_app_install',
            params: {},
            segment: 'Explain our tenant app install QR',
          },
        ],
      },
    );
    expect(regenerateCompound.success).toBe(true);

    const stripeCompound = await handleMarketingGrowthCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'configure_stripe_connect',
            params: {},
            segment: 'Connect Stripe for payouts',
          },
          {
            action: 'explain_plan_limits',
            params: {},
            segment: 'Explain plan limits',
          },
        ],
      },
    );
    expect(stripeCompound.success).toBe(true);

    const unsupported = await handleMarketingGrowthCompoundLogic(
      deps,
      'biz-1',
      'x',
      {
        compoundSteps: [
          { action: 'not_real' as any, params: {}, segment: 'bad' },
        ],
      },
    );
    expect(unsupported.success).toBe(false);

    const allSteps = await handleMarketingGrowthCompoundLogic(
      deps,
      'biz-1',
      'full compound',
      {
        compoundSteps: [
          {
            action: 'toggle_annual_billing',
            params: {},
            segment: 'toggle annual billing',
          },
          {
            action: 'summarize_new_registrations',
            params: { dateRange: 'this_month' },
            segment: 'regs',
          },
          { action: 'how_to_download_app', params: {}, segment: 'app' },
          { action: 'switch_to_consumer_app', params: {}, segment: 'switch' },
        ],
      },
    );
    expect(allSteps.success).toBe(true);

    expect(
      (
        await handleConfigureMarketingAutomationLogic(
          deps,
          'biz-1',
          {},
          'configure marketing automation settings',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleConfigureMarketingAutomationLogic(
          deps,
          'biz-1',
          {},
          'update settings please',
        )
      ).success,
    ).toBe(false);

    expect(
      (
        await handleConfigureMarketingAutomationLogic(deps, 'biz-1', {
          postVisitReviewEnabled: false,
          reEngagementEmailEnabled: false,
          reEngagementSmsEnabled: true,
          minDaysBetweenReEngagement: 21,
          reEngagementPromoCode: 'WIN',
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleSummarizeNewRegistrationsLogic(
          deps,
          'biz-1',
          {},
          'this month',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSummarizeNewRegistrationsLogic(deps, 'biz-1', {
          dateRange: 'this_week',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSummarizeNewRegistrationsLogic(
          deps,
          'biz-1',
          {},
          'new registrations from 01/06/2026 to 30/06/2026',
        )
      ).success,
    ).toBe(true);

    const atLimitUpgrade = buildDeps({
      planEntitlementsService: {
        getEntitlements: jest.fn(async () => ({
          ...entitlementsSolo,
          atLimit: { providerSeats: true, aiCommands: true },
        })),
      } as any,
    });
    expect(
      (await handleSuggestUpgradeLogic(atLimitUpgrade, 'biz-1')).summary,
    ).toContain('at or near');

    const promoCompound = await handleMarketingGrowthCompoundLogic(
      buildDeps({
        planEntitlementsService: {
          getEntitlements: jest.fn(async () => ({
            ...entitlementsStarter,
            flags: entitlementsStarter.limits.flags,
          })),
        } as any,
      }),
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'apply_promo_code_checkout',
            params: { promoCode: 'SAVE10' },
            segment: 'Apply code SAVE10 at checkout',
          },
          {
            action: 'loyalty_points_balance',
            params: { sessionCustomerId: 'cust-1' },
            segment: 'loyalty',
          },
        ],
      },
    );
    expect(promoCompound.success).toBe(true);

    expect(
      (
        await handleConfigureMarketingAutomationLogic(deps, 'biz-1', {
          inactiveDaysThreshold: 45,
          reEngagementEnabled: false,
        })
      ).success,
    ).toBe(true);

    const invalidSecondStep = await handleMarketingGrowthCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'explain_plan_limits', params: {}, segment: 'a' },
          { action: 'not_real' as any, params: {}, segment: 'b' },
        ],
      },
    );
    expect(invalidSecondStep.success).toBe(false);
    expect((invalidSecondStep.details as any).failedStep).toBe('not_real');

    const stripeStarter = buildDeps({
      stripeService: { isConfigured: true } as any,
      billingService: {
        getSubscription: jest.fn(async () => ({
          planId: 'starter',
          plan: { name: 'Starter', priceAnnual: 190, priceMonthly: 19 },
        })),
        createCheckoutSession: jest.fn(async () => ({
          url: 'https://checkout.test',
        })),
      } as any,
    });
    expect(
      (await handleToggleAnnualBillingLogic(stripeStarter, 'biz-1', {}))
        .success,
    ).toBe(true);

    const noPlanStripe = buildDeps({
      stripeService: { isConfigured: true } as any,
      billingService: {
        getSubscription: jest.fn(async () => ({ planId: 'missing' })),
        createCheckoutSession: jest.fn(async () => ({
          url: 'https://checkout.test',
        })),
      } as any,
    });
    expect(
      (await handleToggleAnnualBillingLogic(noPlanStripe, 'biz-1', {})).success,
    ).toBe(true);

    expect(
      (
        await handleConfigureMarketingAutomationLogic(deps, 'biz-1', {
          reEngagementPromoCode: 'WINBACK',
        })
      ).success,
    ).toBe(true);

    const noLimitNote = buildDeps({
      planEntitlementsService: {
        getEntitlements: jest.fn(async () => ({
          ...entitlementsStarter,
          atLimit: { providerSeats: false, aiCommands: false },
        })),
      } as any,
    });
    expect(
      (await handleSuggestUpgradeLogic(noLimitNote, 'biz-1')).summary,
    ).not.toContain('at or near');

    const noPlanAnnual = buildDeps({
      stripeService: { isConfigured: false } as any,
      billingService: {
        getSubscription: jest.fn(async () => ({ planId: null, plan: null })),
      } as any,
    });
    expect(
      (await handleToggleAnnualBillingLogic(noPlanAnnual, 'biz-1', {})).summary,
    ).toContain('not configured');

    expect(
      mergeMarketingGrowthCompoundContext(
        {},
        { action: 'trigger_reengagement', params: {}, segment: 'x' },
        {
          success: true,
          action: 'trigger_reengagement',
          summary: '',
          details: {},
        },
      ),
    ).toEqual({});

    expect(
      (
        await handleSummarizeNewRegistrationsLogic(deps, 'biz-1', {
          dateRange: 'this_month',
        })
      ).success,
    ).toBe(true);
  });

  it('covers error fallbacks without messages', async () => {
    const throwBare = () => {
      throw { message: undefined };
    };
    const deps = buildDeps({
      marketingAutomationService: {
        getSettings: jest.fn(throwBare),
        updateSettings: jest.fn(throwBare),
        getSummary: jest.fn(throwBare),
        processBusinessReEngagement: jest.fn(throwBare),
        findReEngagementCandidates: jest.fn(throwBare),
      } as any,
      planEntitlementsService: { getEntitlements: jest.fn(throwBare) } as any,
      billingService: {
        getSubscription: jest.fn(throwBare),
        createCheckoutSession: jest.fn(throwBare),
      } as any,
      loyaltyService: {
        getBalance: jest.fn(throwBare),
        getPublicSummary: jest.fn(),
      } as any,
      customerRepo: { count: jest.fn(throwBare) } as any,
    });

    expect(
      (
        await handleConfigureMarketingAutomationLogic(deps, 'biz-1', {
          reEngagementEnabled: true,
        })
      ).success,
    ).toBe(false);
    expect(
      (await handleSummarizeAutomationPerformanceLogic(deps, 'biz-1')).success,
    ).toBe(false);
    expect((await handleTriggerReengagementLogic(deps, 'biz-1')).success).toBe(
      false,
    );
    expect(
      (await handleListInactiveCustomersLogic(deps, 'biz-1')).success,
    ).toBe(false);
    expect((await handleExplainPlanLimitsLogic(deps, 'biz-1')).success).toBe(
      false,
    );
    expect((await handleSuggestUpgradeLogic(deps, 'biz-1')).success).toBe(
      false,
    );
    expect(
      (await handleToggleAnnualBillingLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (await handleSummarizeNewRegistrationsLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleLoyaltyPointsBalanceLogic(deps, 'biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(false);
  });

  it('covers success message branches', async () => {
    const disabledConfigure = buildDeps({
      marketingAutomationService: {
        ...buildDeps().marketingAutomationService,
        updateSettings: jest.fn(async () => ({
          reEngagementEnabled: false,
          inactiveDaysThreshold: 90,
          postVisitReviewEnabled: true,
          reEngagementEmailEnabled: true,
          reEngagementSmsEnabled: false,
          minDaysBetweenReEngagement: 30,
          reEngagementPromoCode: null,
        })),
      } as any,
    });
    expect(
      (
        await handleConfigureMarketingAutomationLogic(
          disabledConfigure,
          'biz-1',
          { reEngagementEnabled: false },
        )
      ).summary,
    ).toContain('disabled');

    const emptyCandidates = buildDeps({
      marketingAutomationService: {
        ...buildDeps().marketingAutomationService,
        findReEngagementCandidates: jest.fn(async () => []),
      } as any,
    });
    expect(
      (await handleListInactiveCustomersLogic(emptyCandidates, 'biz-1'))
        .summary,
    ).toContain('No inactive');

    const invalidPromoBare = buildDeps({
      promoCodesService: {
        findValidForCheckout: jest.fn(async () => {
          throw { message: undefined };
        }),
      } as any,
    });
    expect(
      (
        await handlePromoCodeHelpLogic(invalidPromoBare, 'biz-1', {
          promoCode: 'BAD',
        })
      ).summary,
    ).toContain('invalid');

    jest.useFakeTimers({ now: new Date('2026-06-07T12:00:00Z') });
    expect(
      (
        await handleSummarizeNewRegistrationsLogic(buildDeps(), 'biz-1', {
          dateRange: 'this_week',
        })
      ).success,
    ).toBe(true);
    jest.useRealTimers();

    const configFallback = buildDeps({
      configService: { get: jest.fn(() => undefined) } as any,
      businessRepo: { findOne: jest.fn(async () => null) } as any,
    });
    expect(
      (await handleHowToDownloadAppLogic(configFallback, 'biz-1')).success,
    ).toBe(false);
    expect(
      (await handleSwitchToConsumerAppLogic(configFallback, 'biz-1')).success,
    ).toBe(true);

    const planAnnualInfo = buildDeps({
      stripeService: { isConfigured: false } as any,
      billingService: {
        getSubscription: jest.fn(async () => ({
          planId: 'starter',
          plan: { name: 'Starter', priceAnnual: 190, priceMonthly: 19 },
        })),
      } as any,
    });
    expect(
      (await handleToggleAnnualBillingLogic(planAnnualInfo, 'biz-1', {}))
        .summary,
    ).toContain('Starter');

    const getPlanSpy = jest.spyOn(plans, 'getPlan').mockReturnValue(undefined);
    expect(
      (await handleSuggestUpgradeLogic(buildDeps(), 'biz-1')).details,
    ).toMatchObject({
      recommendation: { tierName: 'Starter' },
    });
    expect(
      (
        await handleSuggestUpgradeLogic(
          buildDeps({
            planEntitlementsService: {
              getEntitlements: jest.fn(async () => entitlementsStarter),
            } as any,
          }),
          'biz-1',
        )
      ).details,
    ).toMatchObject({ recommendation: { tierName: 'Business' } });
    getPlanSpy.mockRestore();

    const businessPlanSpy = jest.spyOn(plans, 'getPlan').mockReturnValue({
      id: 'business',
      name: 'Business Pro',
      priceMonthly: 49,
      priceAnnual: 490,
      currency: 'usd',
      active: true,
      features: [],
    } as any);
    expect(
      (
        await handleSuggestUpgradeLogic(
          buildDeps({
            planEntitlementsService: {
              getEntitlements: jest.fn(async () => entitlementsStarter),
            } as any,
          }),
          'biz-1',
        )
      ).details,
    ).toMatchObject({ recommendation: { tierName: 'Business Pro' } });
    businessPlanSpy.mockRestore();

    const missingPlanAnnual = buildDeps({
      stripeService: { isConfigured: false } as any,
      billingService: {
        getSubscription: jest.fn(async () => ({
          planId: 'missing',
          plan: null,
        })),
      } as any,
    });
    expect(
      (await handleToggleAnnualBillingLogic(missingPlanAnnual, 'biz-1', {}))
        .summary,
    ).toContain('vs paying monthly');

    const partialRangeSpy = jest
      .spyOn(orchestration, 'extractDateRangeFromPrompt')
      .mockReturnValueOnce({ start: '2026-06-01', end: '' })
      .mockReturnValueOnce({ start: '', end: '2026-06-30' });
    expect(
      (
        await handleSummarizeNewRegistrationsLogic(
          buildDeps(),
          'biz-1',
          {},
          'partial range',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSummarizeNewRegistrationsLogic(
          buildDeps(),
          'biz-1',
          {},
          'partial range end',
        )
      ).success,
    ).toBe(true);
    partialRangeSpy.mockRestore();
  });
});

describe('summarize_new_registrations date window (e2e-bug.466, §218)', () => {
  // Two defects in one expression. The enum branch closed on the last
  // millisecond of the end day and the prompt branch on its midnight, so the
  // identical request under-reported by a whole day when typed as free text.
  // And both anchored at `T00:00:00.000Z` although `resolveDateRange` had
  // already computed the day keys in the business timezone, which slid the
  // window by the UTC offset for every non-UTC business.
  const build = (count: number) =>
    ({ customerRepo: { count: jest.fn().mockResolvedValue(count) } }) as never;

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-15T12:00:00.000Z'));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('answers the same window whether the range arrives as an enum or as prose', async () => {
    const viaEnum: any = await handleSummarizeNewRegistrationsLogic(
      build(7),
      'biz-1',
      { dateRange: 'this_month', _timeZone: 'UTC' },
      '',
    );
    const viaPrompt: any = await handleSummarizeNewRegistrationsLogic(
      build(7),
      'biz-1',
      { _timeZone: 'UTC' },
      'how many new customers signed up this month',
    );

    expect(viaEnum.details.from).toBe(viaPrompt.details.from);
    expect(viaEnum.details.to).toBe(viaPrompt.details.to);
    expect(viaPrompt.details.to).toBe('2026-08-31T23:59:59.999Z');
  });

  it('closes on the last instant of the final day, not its midnight', async () => {
    const result: any = await handleSummarizeNewRegistrationsLogic(
      build(3),
      'biz-1',
      { _timeZone: 'UTC' },
      'registrations this month',
    );
    // The whole point: a customer created at 23:30 on the 31st is in range.
    expect(new Date(result.details.to).getTime()).toBeGreaterThan(
      new Date('2026-08-31T23:30:00.000Z').getTime(),
    );
  });

  it('takes the day boundaries in the business timezone, not UTC', async () => {
    const result: any = await handleSummarizeNewRegistrationsLogic(
      build(3),
      'biz-1',
      { dateRange: 'this_month', _timeZone: 'Asia/Yerevan' },
      '',
    );
    // Yerevan is UTC+4, so local August starts at 20:00 on 31 July UTC.
    expect(result.details.from).toBe('2026-07-31T20:00:00.000Z');
    expect(result.details.to).toBe('2026-08-31T19:59:59.999Z');
  });
});
