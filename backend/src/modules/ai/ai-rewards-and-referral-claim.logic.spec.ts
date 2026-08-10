import {
  handleClaimReferralCodeLogic,
  handleClaimShareRewardLogic,
  handleExplainRewardsWalletLogic,
} from './ai-consumer-adoption.logic.js';
import type { ConsumerAdoptionLogicDeps } from './ai-consumer-adoption.logic.js';

function buildDeps(
  overrides: Partial<ConsumerAdoptionLogicDeps> = {},
): ConsumerAdoptionLogicDeps {
  return {
    publicCustomerAuthService: {} as any,
    publicBookingService: {
      getCustomerRewards: jest.fn(async () => ({
        loyaltyEnabled: true,
        loyalty: {
          pointsBalance: 120,
          lifetimeEarned: 300,
          pointsValue: 12,
          earnPercentCashback: 5,
          bonusDollarValue: 0,
        },
        promotions: [
          {
            code: 'SAVE10',
            description: null,
            discountLabel: '10% off',
            expiresAt: null,
            minOrderAmount: null,
          },
        ],
      })),
      claimCustomerReferralCode: jest.fn(async () => ({
        attached: true,
        referralCode: 'FRIEND10',
        referrerCustomerId: 'cust-referrer',
        refereePromoCode: 'WELCOME10',
      })),
      claimCustomerShareReward: jest.fn(async () => ({
        awarded: true,
        channel: 'booking',
      })),
    } as any,
    pushNotifications: {} as any,
    notificationsService: {} as any,
    consumerPushTokenService: {} as any,
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'salon' })),
    } as any,
    ...overrides,
  };
}

describe('handleExplainRewardsWalletLogic', () => {
  let deps: ConsumerAdoptionLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('summarizes loyalty points and active promotions', async () => {
    const result = await handleExplainRewardsWalletLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      slug: 'salon',
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_rewards_wallet');
    expect(result.summary).toContain('120 loyalty points');
    expect(result.summary).toContain('SAVE10');
    expect(deps.publicBookingService.getCustomerRewards).toHaveBeenCalledWith(
      'salon',
      'cust-1',
    );
  });

  it('requires sign-in', async () => {
    const result = await handleExplainRewardsWalletLogic(deps, 'biz-1', {
      slug: 'salon',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  // e2e-bug.125
  it('resolves slug from businessId when params.slug is missing', async () => {
    const result = await handleExplainRewardsWalletLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
    });
    expect(result.success).toBe(true);
    expect(deps.businessRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'biz-1' },
    });
    expect(deps.publicBookingService.getCustomerRewards).toHaveBeenCalledWith(
      'salon',
      'cust-1',
    );
  });

  it('handles an empty wallet', async () => {
    (
      deps.publicBookingService.getCustomerRewards as jest.Mock
    ).mockResolvedValueOnce({
      loyaltyEnabled: false,
      loyalty: null,
      promotions: [],
    });
    const result = await handleExplainRewardsWalletLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      slug: 'salon',
    });
    expect(result.success).toBe(true);
    expect(result.summary).toContain('No loyalty points or active promotions');
  });
});

describe('handleClaimReferralCodeLogic', () => {
  let deps: ConsumerAdoptionLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('claims a valid referral code', async () => {
    const result = await handleClaimReferralCodeLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      slug: 'salon',
      referralCode: 'FRIEND10',
    });
    expect(result.success).toBe(true);
    expect(result.details?.refereePromoCode).toBe('WELCOME10');
    expect(
      deps.publicBookingService.claimCustomerReferralCode,
    ).toHaveBeenCalledWith('salon', 'cust-1', 'FRIEND10');
  });

  // e2e-bug.125
  it('claims referral code without params.slug via businessId lookup', async () => {
    const result = await handleClaimReferralCodeLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      referralCode: 'FRIEND10',
    });
    expect(result.success).toBe(true);
    expect(
      deps.publicBookingService.claimCustomerReferralCode,
    ).toHaveBeenCalledWith('salon', 'cust-1', 'FRIEND10');
  });

  it('requires sign-in', async () => {
    const result = await handleClaimReferralCodeLogic(deps, 'biz-1', {
      slug: 'salon',
      referralCode: 'FRIEND10',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('clarifies when no code is given', async () => {
    const result = await handleClaimReferralCodeLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      slug: 'salon',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  // e2e-bug.410 — the production case, reproduced.
  //
  // All 96 stored attempts look exactly like this: the classifier names the
  // action correctly, params arrive empty, and the code is sitting in the
  // prompt. Before the fix every one of them was answered with "What referral
  // code would you like to claim?".
  it.each([
    ['I want to claim referral code FRIEND25', 'FRIEND25'],
    ['Claim referral code FRIEND10', 'FRIEND10'],
    ['I want to redeem referral code ABC123', 'ABC123'],
    ["Redeem my friend's invite code HELLO1", 'HELLO1'],
  ])('reads the code out of the prompt: %s', async (prompt, code) => {
    const result = await handleClaimReferralCodeLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'salon' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(
      deps.publicBookingService.claimCustomerReferralCode,
    ).toHaveBeenCalledWith('salon', 'cust-1', code);
  });

  it('still clarifies when neither params nor prompt carry a code', async () => {
    // The enrichment must not invent one — "use my invite code" is a documented
    // example of this command and names no code.
    const result = await handleClaimReferralCodeLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'salon' },
      'use my invite code',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toEqual(['referralCode']);
  });

  it('prefers an explicit param over the prompt', async () => {
    // A resolved param is a decision something upstream already made; re-reading
    // the raw text over the top of it would silently override it.
    const result = await handleClaimReferralCodeLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'salon', referralCode: 'PARAM99' },
      'claim referral code PROMPT11',
    );
    expect(result.success).toBe(true);
    expect(
      deps.publicBookingService.claimCustomerReferralCode,
    ).toHaveBeenCalledWith('salon', 'cust-1', 'PARAM99');
  });

  it.each([
    ['disabled', 'not enabled'],
    ['invalid_code', "couldn't find"],
    ['already_attached', 'already claimed'],
    ['self_referral', "can't claim your own"],
    ['not_eligible_existing_customer', 'new customers'],
  ])('surfaces a friendly message for reason=%s', async (reason, expected) => {
    (
      deps.publicBookingService.claimCustomerReferralCode as jest.Mock
    ).mockResolvedValueOnce({ attached: false, reason });
    const result = await handleClaimReferralCodeLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      slug: 'salon',
      referralCode: 'BAD',
    });
    expect(result.success).toBe(false);
    expect(result.summary.toLowerCase()).toContain(expected);
  });
});

describe('handleClaimShareRewardLogic', () => {
  let deps: ConsumerAdoptionLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('claims a booking share reward', async () => {
    const result = await handleClaimShareRewardLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      slug: 'salon',
      channel: 'booking',
      bookingId: 'book-1',
    });
    expect(result.success).toBe(true);
    expect(
      deps.publicBookingService.claimCustomerShareReward,
    ).toHaveBeenCalledWith('salon', 'cust-1', 'booking', 'book-1');
  });

  // e2e-bug.125
  it('claims share reward without params.slug via businessId lookup', async () => {
    const result = await handleClaimShareRewardLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      channel: 'booking',
      bookingId: 'book-1',
    });
    expect(result.success).toBe(true);
    expect(
      deps.publicBookingService.claimCustomerShareReward,
    ).toHaveBeenCalledWith('salon', 'cust-1', 'booking', 'book-1');
  });

  it('requires sign-in', async () => {
    const result = await handleClaimShareRewardLogic(deps, 'biz-1', {
      slug: 'salon',
      channel: 'salon',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('clarifies when no channel is given', async () => {
    const result = await handleClaimShareRewardLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      slug: 'salon',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('surfaces a cooldown failure message', async () => {
    (
      deps.publicBookingService.claimCustomerShareReward as jest.Mock
    ).mockResolvedValueOnce({
      awarded: false,
      channel: 'salon',
      reason: 'cooldown',
    });
    const result = await handleClaimShareRewardLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      slug: 'salon',
      channel: 'salon',
    });
    expect(result.success).toBe(false);
    expect(result.summary).toContain('already claimed a share reward');
  });
});
