import { ReferralProgramService } from './referral-program.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('ReferralProgramService', () => {
  const loyaltyService = {
    awardFlatBonus: jest.fn().mockResolvedValue(true),
    getOrCreate: jest.fn(),
  };

  const giftCardsService = {
    create: jest.fn().mockResolvedValue({ id: 'gc-referral-1', code: 'GC123' }),
  };

  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'biz-1',
      slug: 'demo-salon',
      settings: {
        referralProgram: {
          enabled: true,
          referrerBonusPoints: 25,
          refereeBonusPoints: 25,
        },
      },
    }),
  };

  const customerRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (entity) => entity),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }]),
    })),
  };

  const bookingRepo = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const service = new ReferralProgramService(
    businessRepo as never,
    customerRepo as never,
    bookingRepo as never,
    loyaltyService as never,
    giftCardsService as never,
    { get: () => 'https://app.test' } as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('claims referral code for a new customer', async () => {
    customerRepo.findOne.mockResolvedValue({
      id: 'referee-1',
      businessId: 'biz-1',
      metadata: {},
    });

    const result = await service.claimReferralCode(
      'biz-1',
      'referee-1',
      'A1B2C3D4',
    );
    expect(result.attached).toBe(true);
    expect(result.referrerCustomerId).toBe(
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    );
    expect(result.refereePromoCode).toBeNull();
    expect(customerRepo.save).toHaveBeenCalled();
  });

  it('awards both sides on first completed booking with loyalty referrer reward', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-1',
      businessId: 'biz-1',
      customerId: 'referee-1',
      status: BookingStatus.COMPLETED,
      customer: {
        id: 'referee-1',
        metadata: {
          referredByCustomerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      },
      business: {
        settings: {
          currency: 'USD',
          referralProgram: {
            enabled: true,
            referrerRewardType: 'loyalty_points',
            referrerBonusPoints: 25,
            refereeBonusPoints: 25,
          },
        },
      },
    });
    bookingRepo.count.mockResolvedValue(1);

    const result = await service.processBookingCompleted('bk-1');
    expect(result.converted).toBe(true);
    expect(result.referrerRewardType).toBe('loyalty_points');
    expect(loyaltyService.awardFlatBonus).toHaveBeenCalledTimes(2);
    expect(giftCardsService.create).not.toHaveBeenCalled();
  });

  it('issues a gift card to referrer when configured', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-2',
      businessId: 'biz-1',
      customerId: 'referee-1',
      status: BookingStatus.COMPLETED,
      customer: {
        id: 'referee-1',
        metadata: {
          referredByCustomerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      },
      business: {
        settings: {
          currency: 'USD',
          referralProgram: {
            enabled: true,
            referrerRewardType: 'gift_card',
            referrerGiftCardAmount: 30,
            refereeBonusPoints: 10,
          },
        },
      },
    });
    bookingRepo.count.mockResolvedValue(1);

    const result = await service.processBookingCompleted('bk-2');
    expect(result.converted).toBe(true);
    expect(result.referrerRewardType).toBe('gift_card');
    expect(result.referrerGiftCardId).toBe('gc-referral-1');
    expect(giftCardsService.create).toHaveBeenCalledWith('biz-1', {
      amount: 30,
      currency: 'USD',
      purchaserCustomerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(loyaltyService.awardFlatBonus).toHaveBeenCalledTimes(1);
  });
});
