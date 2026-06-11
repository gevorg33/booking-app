import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  BILLING_LOYALTY_RESCUE_SCENARIOS,
  OPEN_BILLING_SETTINGS_PROMPTS,
  SUMMARIZE_LOYALTY_PROGRAM_PROMPTS,
} from './ai-billing-loyalty-dashboard.fixtures.js';
import {
  handleOpenBillingSettingsLogic,
  handleSummarizeLoyaltyProgramLogic,
  type MarketingGrowthLogicDeps,
} from './ai-marketing-growth.logic.js';

describe('AiBillingLoyaltyDashboard integration (ai-cmd-ext-2.9–2.10)', () => {
  const rescueService = new AiIntentRescueService();

  it.each(BILLING_LOYALTY_RESCUE_SCENARIOS)(
    'rescues misclassified billing/loyalty prompt $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: misclassifiedAction,
        params: {},
      });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescued).toBe(true);
    },
  );

  it.each(OPEN_BILLING_SETTINGS_PROMPTS.slice(0, 3))(
    'rescues unknown billing prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('open_billing_settings');
    },
  );

  it.each(SUMMARIZE_LOYALTY_PROGRAM_PROMPTS.slice(0, 3))(
    'rescues unknown loyalty prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('summarize_loyalty_program');
    },
  );

  it('marketing growth rescue disambiguates explain_plan_limits → open_billing_settings', () => {
    const rescued = rescueService.rescue({
      prompt: 'Open billing settings',
      action: 'explain_plan_limits',
      params: {},
    });
    expect(rescued?.action).toBe('open_billing_settings');
  });

  describe('billing/loyalty handlers', () => {
    const deps = {
      planEntitlementsService: {
        getEntitlements: jest.fn(async () => ({
          tierName: 'Growth',
          tierId: 'growth',
          isPaid: true,
          limits: {
            maxProviderSeats: 5,
            aiCommandsPerMonth: 500,
            flags: { stripeConnect: true, promoCodes: true, loyalty: true },
          },
          usage: { providerSeats: 2, aiCommandsThisMonth: 10 },
          atLimit: { providerSeats: false, aiCommands: false },
        })),
      },
      billingService: {
        createPortalSession: jest.fn(async () => ({
          url: 'https://billing.example/portal',
        })),
      },
      businessRepo: {
        findOne: jest.fn(async () => ({
          id: 'biz-1',
          settings: { loyalty: { enabled: true } },
        })),
      },
    } as unknown as MarketingGrowthLogicDeps;

    it('handleOpenBillingSettingsLogic end-to-end', async () => {
      const result = await handleOpenBillingSettingsLogic(deps, 'biz-1');
      expect(result.success).toBe(true);
      expect(result.details).toMatchObject({
        portalUrl: 'https://billing.example/portal',
      });
    });

    it('handleSummarizeLoyaltyProgramLogic end-to-end', async () => {
      const result = await handleSummarizeLoyaltyProgramLogic(deps, 'biz-1');
      expect(result.success).toBe(true);
      expect(result.details).toHaveProperty('earnPercentCashback');
    });
  });
});
