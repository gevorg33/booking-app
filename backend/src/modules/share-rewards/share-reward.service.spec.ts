import { ShareRewardService } from './share-reward.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('ShareRewardService', () => {
  const loyaltyService = {
    awardFlatBonus: jest.fn().mockResolvedValue(true),
  };
  const giftCardsService = {
    create: jest.fn().mockResolvedValue({ id: 'gc-share-1' }),
  };

  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'biz-1',
      slug: 'demo-salon',
      settings: {
        currency: 'USD',
        shareRewards: {
          enabled: true,
          cooldownHours: 24,
          salon: {
            enabled: true,
            rewardType: 'loyalty_points',
            loyaltyPoints: 5,
          },
          booking: {
            enabled: true,
            rewardType: 'loyalty_points',
            loyaltyPoints: 10,
          },
        },
      },
    }),
  };

  const customerRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (entity) => entity),
  };

  const bookingRepo = {
    findOne: jest.fn(),
  };

  const service = new ShareRewardService(
    businessRepo as never,
    customerRepo as never,
    bookingRepo as never,
    loyaltyService as never,
    giftCardsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-1',
      businessId: 'biz-1',
      metadata: {},
    });
  });

  it('returns share rewards view for customer', async () => {
    const view = await service.getShareRewardsView('biz-1', 'cust-1');
    expect(view.enabled).toBe(true);
    expect(view.salonShareEnabled).toBe(true);
    expect(view.salonRewardSummary).toContain('loyalty points');
  });

  it('awards salon share loyalty reward', async () => {
    const result = await service.claimShareReward('biz-1', 'cust-1', 'salon');
    expect(result.awarded).toBe(true);
    expect(result.loyaltyPoints).toBe(5);
    expect(loyaltyService.awardFlatBonus).toHaveBeenCalled();
    expect(customerRepo.save).toHaveBeenCalled();
  });

  it('blocks repeat salon share within cooldown', async () => {
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-1',
      businessId: 'biz-1',
      metadata: { shareRewardSalonLastAt: new Date().toISOString() },
    });
    const result = await service.claimShareReward('biz-1', 'cust-1', 'salon');
    expect(result.awarded).toBe(false);
    expect(result.reason).toBe('cooldown');
  });

  it('awards booking share gift card when configured', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      slug: 'demo-salon',
      settings: {
        currency: 'USD',
        shareRewards: {
          enabled: true,
          booking: {
            enabled: true,
            rewardType: 'gift_card',
            giftCardAmount: 15,
          },
        },
      },
    });
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      status: BookingStatus.COMPLETED,
    });

    const result = await service.claimShareReward(
      'biz-1',
      'cust-1',
      'booking',
      'bk-1',
    );
    expect(result.awarded).toBe(true);
    expect(result.giftCardId).toBe('gc-share-1');
    expect(giftCardsService.create).toHaveBeenCalled();
  });
});
