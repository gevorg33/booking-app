import { handleExplainLoyaltyPointsLogic } from './ai-explain-loyalty-points.logic.js';

describe('ai-explain-loyalty-points.logic (ai-cmd-customer-4.5.1)', () => {
  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: { loyalty: { enabled: true, earnPercentCashback: 10 } },
      })),
    },
    loyaltyService: {
      getBalance: jest.fn(async () => ({
        account: { pointsBalance: 25, lifetimeEarned: 40 },
      })),
      getPublicSummary: jest.fn((_account, settings) => ({
        pointsBalance: 25,
        lifetimeEarned: 40,
        earnPercentCashback: settings?.loyalty?.earnPercentCashback ?? 5,
        pointsValue: 25,
        bonusDollarValue: 1,
      })),
    },
  });

  it('explains earn rules without sign-in', async () => {
    const result = await handleExplainLoyaltyPointsLogic(
      deps() as any,
      'biz-1',
      {},
      'How do I earn points?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_loyalty_points');
    expect(result.summary).toMatch(/10%/);
    expect(result.details?.navigate).toMatchObject({
      path: 'account',
      query: { section: 'loyalty' },
    });
  });

  it('includes balance when signed in', async () => {
    const result = await handleExplainLoyaltyPointsLogic(
      deps() as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'What are my points worth?',
    );
    expect(result.success).toBe(true);
    expect(result.details?.pointsBalance).toBe(25);
    expect(result.summary).toMatch(/25 points/);
  });

  it('handles disabled loyalty program', async () => {
    const localDeps = deps();
    localDeps.businessRepo.findOne = jest.fn(async () => ({
      id: 'biz-1',
      settings: { loyalty: { enabled: false, earnPercentCashback: 10 } },
    }));
    const result = await handleExplainLoyaltyPointsLogic(
      localDeps as any,
      'biz-1',
      {},
      'How does loyalty work?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/not enabled/i);
  });

  it('requires explain prompt', async () => {
    const result = await handleExplainLoyaltyPointsLogic(
      deps() as any,
      'biz-1',
      {},
      'Book a haircut',
    );
    expect(result.success).toBe(false);
  });
});
