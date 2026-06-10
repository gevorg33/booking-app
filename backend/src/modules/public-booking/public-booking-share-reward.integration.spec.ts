import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';

describe('PublicBookingService share rewards (adopt-6.2)', () => {
  const business = {
    id: 'biz-1',
    slug: 'demo-salon',
    name: 'Demo Salon',
    isActive: true,
    subscriptionPlanId: 'starter',
    subscriptionStatus: 'active',
    settings: {
      shareRewards: {
        enabled: true,
        salon: { enabled: true, rewardType: 'loyalty_points', loyaltyPoints: 5 },
      },
    },
  };

  const businessService = {
    findBySlug: jest.fn().mockResolvedValue(business),
  };

  const shareRewardService = {
    getShareRewardsView: jest.fn().mockResolvedValue({
      enabled: true,
      salonShareEnabled: true,
      bookingShareEnabled: true,
      salonRewardSummary: '5 loyalty points',
      bookingRewardSummary: '10 loyalty points',
      cooldownHours: 24,
      salonNextEligibleAt: null,
      bookingNextEligibleAt: null,
    }),
    claimShareReward: jest.fn().mockResolvedValue({
      awarded: true,
      channel: 'salon',
      rewardSummary: '5 loyalty points',
      loyaltyPoints: 5,
    }),
  };

  const service = createPublicBookingServiceHarness({
    businessService: businessService as never,
    configService: { get: jest.fn() } as never,
    shareRewardService: shareRewardService as never,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns share rewards view for signed-in customer', async () => {
    await expect(service.getCustomerShareRewards('demo-salon', 'cust-1')).resolves.toEqual(
      expect.objectContaining({
        salonShareEnabled: true,
        salonRewardSummary: '5 loyalty points',
      }),
    );
  });

  it('claims share reward after native share', async () => {
    await expect(
      service.claimCustomerShareReward('demo-salon', 'cust-1', 'salon'),
    ).resolves.toEqual(
      expect.objectContaining({
        awarded: true,
        channel: 'salon',
      }),
    );
    expect(shareRewardService.claimShareReward).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
      'salon',
      undefined,
    );
  });
});
