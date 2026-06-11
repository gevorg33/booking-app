import {
  handleOpenBillingSettingsLogic,
  handleSummarizeLoyaltyProgramLogic,
  type MarketingGrowthLogicDeps,
} from './ai-marketing-growth.logic.js';

describe('ai-billing-loyalty-dashboard.logic (ai-cmd-ext-2.9–2.10)', () => {
  const planEntitlementsService = {
    getEntitlements: jest.fn(async () => ({
      tierName: 'Growth',
      tierId: 'growth',
      isPaid: true,
      limits: {
        maxProviderSeats: 5,
        aiCommandsPerMonth: 500,
        flags: { stripeConnect: true, promoCodes: true, loyalty: true },
      },
      usage: { providerSeats: 3, aiCommandsThisMonth: 40 },
      atLimit: { providerSeats: false, aiCommands: false },
    })),
  };
  const billingService = {
    createPortalSession: jest.fn(async () => ({
      url: 'https://billing.example/portal',
    })),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { loyalty: { enabled: true, earnPercentCashback: 5 } },
    })),
  };

  const deps = {
    planEntitlementsService,
    billingService,
    businessRepo,
  } as unknown as MarketingGrowthLogicDeps;

  it('handleOpenBillingSettingsLogic returns portal link', async () => {
    const result = await handleOpenBillingSettingsLogic(deps, 'biz-1');
    expect(result.success).toBe(true);
    expect(result.action).toBe('open_billing_settings');
    expect(result.summary).toContain('https://billing.example/portal');
  });

  it('handleOpenBillingSettingsLogic handles billing errors', async () => {
    billingService.createPortalSession.mockRejectedValueOnce(
      new Error('Stripe down'),
    );
    const result = await handleOpenBillingSettingsLogic(deps, 'biz-1');
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Stripe down');
  });

  it('handleSummarizeLoyaltyProgramLogic enabled program', async () => {
    const result = await handleSummarizeLoyaltyProgramLogic(deps, 'biz-1');
    expect(result.success).toBe(true);
    expect(result.action).toBe('summarize_loyalty_program');
    expect(result.summary).toContain('enabled');
  });

  it('handleSummarizeLoyaltyProgramLogic disabled program', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'biz-1',
      settings: { loyalty: { enabled: false } },
    });
    const result = await handleSummarizeLoyaltyProgramLogic(deps, 'biz-1');
    expect(result.success).toBe(true);
    expect(result.summary).toContain('disabled');
  });
});
