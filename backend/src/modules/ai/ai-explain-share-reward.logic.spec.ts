import { handleExplainShareRewardLogic } from './ai-explain-share-reward.logic.js';

describe('ai-explain-share-reward.logic (ai-cmd-customer-4.12.4)', () => {
  const deps = () => ({
    publicBookingService: {
      getCustomerShareRewards: jest.fn(async () => ({
        enabled: true,
        salonShareEnabled: true,
        bookingShareEnabled: true,
        salonRewardSummary: '50 points',
        bookingRewardSummary: '25 points',
        cooldownHours: 24,
        salonNextEligibleAt: null,
        bookingNextEligibleAt: null,
      })),
    },
  });

  it('clarifies when prompt is not share reward explain', async () => {
    const result = await handleExplainShareRewardLogic(
      deps(),
      'biz-1',
      { slug: 'salon' },
      'Share my booking with my partner',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('explains share rewards with live salon settings when signed in', async () => {
    const localDeps = deps();
    const result = await handleExplainShareRewardLogic(
      localDeps,
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'salon' },
      'Do I get points for sharing?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_share_reward');
    expect(result.details.aspect).toBe('how_it_works');
    expect(result.summary).toMatch(/25 points/);
    expect(
      localDeps.publicBookingService.getCustomerShareRewards,
    ).toHaveBeenCalled();
  });

  it('explains booking share aspect without requiring sign-in', async () => {
    const result = await handleExplainShareRewardLogic(
      deps(),
      'biz-1',
      {},
      'What happens when I share my booking?',
    );
    expect(result.success).toBe(true);
    expect(result.details.aspect).toBe('booking_reward');
    expect(result.details.navigate).toEqual({
      path: 'account',
      query: { section: 'bookings' },
    });
  });
});
