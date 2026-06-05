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
  handleMarketingGrowthCompoundLogic,
  mergeMarketingGrowthCompoundContext,
  type MarketingGrowthLogicDeps,
} from './ai-marketing-growth.logic.js';
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
        settings: {},
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
      true,
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
          details: { guidance: { pwaUrl: 'x' } },
        },
      ).consumerAppGuidance,
    ).toMatchObject({ pwaUrl: 'x' });

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
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'promo_code_help',
            params: { promoCode: 'SAVE10' },
            segment: 'promo',
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
    ).toBe(true);
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
