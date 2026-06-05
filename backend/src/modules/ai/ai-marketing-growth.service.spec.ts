import { AiMarketingGrowthService } from './ai-marketing-growth.service.js';

describe('AiMarketingGrowthService', () => {
  const marketingAutomationService = {
    getSettings: jest.fn(async () => ({
      reEngagementEnabled: false,
      inactiveDaysThreshold: 90,
    })),
    updateSettings: jest.fn(async (_, dto) => ({
      reEngagementEnabled: dto.reEngagementEnabled ?? false,
      inactiveDaysThreshold: 90,
    })),
    getSummary: jest.fn(async () => ({
      eligibleInactiveCustomers: 1,
      reEngagementSentLast30Days: 0,
      settings: {},
    })),
    processBusinessReEngagement: jest.fn(async () => 1),
    findReEngagementCandidates: jest.fn(async () => []),
  };
  const planEntitlementsService = {
    getEntitlements: jest.fn(async () => ({
      tierId: 'solo',
      tierName: 'Solo',
      isPaid: false,
      limits: { maxProviderSeats: 1, aiCommandsPerMonth: 25, flags: {} },
      usage: { providerSeats: 1, aiCommandsThisMonth: 0 },
      atLimit: { providerSeats: false, aiCommands: false },
    })),
  };
  const billingService = {
    getSubscription: jest.fn(async () => ({ planId: null })),
    createCheckoutSession: jest.fn(async () => ({
      url: 'https://checkout.test',
    })),
  };
  const loyaltyService = {
    getBalance: jest.fn(async () => ({
      account: { pointsBalance: 50, lifetimeEarned: 50 },
      transactions: [],
    })),
    getPublicSummary: jest.fn(() => ({
      pointsBalance: 50,
      pointsValue: 5,
      lifetimeEarned: 50,
      bonusDollarValue: 1,
      earnPercentCashback: 5,
    })),
  };
  const promoCodesService = {
    findValidForCheckout: jest.fn(async () => ({
      code: 'SAVE10',
      discountType: 'percent',
      discountValue: 10,
    })),
  };
  const stripeService = { isConfigured: false };
  const configService = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  };
  const customerRepo = { count: jest.fn(async () => 3) };
  const businessRepo = {
    findOne: jest.fn(async () => ({ slug: 'salon', settings: {} })),
  };

  let service: AiMarketingGrowthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiMarketingGrowthService(
      marketingAutomationService as any,
      planEntitlementsService as any,
      billingService as any,
      loyaltyService as any,
      promoCodesService as any,
      stripeService as any,
      configService as any,
      customerRepo as any,
      businessRepo as any,
    );
  });

  it('delegates rescue and compound helpers', () => {
    expect(
      service.rescueMarketingGrowthIntent('Explain plan limits', 'unknown')
        ?.action,
    ).toBe('explain_plan_limits');
    expect(
      service.isMarketingGrowthCompound(
        'Explain plan limits and suggest upgrade',
      ),
    ).toBe(true);
    expect(
      service.decomposeMarketingGrowthCompound(
        'Explain plan limits and suggest upgrade',
      ),
    ).toHaveLength(2);
  });

  it('delegates intent handlers', async () => {
    expect((await service.handleExplainPlanLimits('biz-1')).success).toBe(true);
    expect((await service.handleSuggestUpgrade('biz-1')).success).toBe(true);
    expect(
      (
        await service.handleConfigureMarketingAutomation('biz-1', {
          reEngagementEnabled: true,
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleSummarizeAutomationPerformance('biz-1')).success,
    ).toBe(true);
    expect((await service.handleTriggerReengagement('biz-1')).success).toBe(
      true,
    );
    expect((await service.handleListInactiveCustomers('biz-1')).success).toBe(
      true,
    );
    expect((await service.handleToggleAnnualBilling('biz-1', {})).success).toBe(
      true,
    );
    expect(
      (await service.handleSummarizeNewRegistrations('biz-1', {})).success,
    ).toBe(true);
    expect((await service.handleHowToDownloadApp('biz-1')).success).toBe(true);
    expect((await service.handleSwitchToConsumerApp('biz-1')).success).toBe(
      true,
    );
    expect((await service.handlePromoCodeHelp('biz-1', {})).success).toBe(true);
    expect(
      (
        await service.handleLoyaltyPointsBalance('biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleMarketingGrowthCompound(
          'biz-1',
          'Explain plan limits and suggest upgrade',
          {},
        )
      ).success,
    ).toBe(true);
  });
});
