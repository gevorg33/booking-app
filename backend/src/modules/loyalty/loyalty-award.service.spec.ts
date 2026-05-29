import { LoyaltyAwardService } from './loyalty-award.service.js';
import { LoyaltyService } from './loyalty.service.js';
import { LoyaltyCustomerMatcherService } from './loyalty-customer-matcher.service.js';
import { Booking, PaymentStatus } from '../booking/entities/booking.entity.js';

describe('LoyaltyAwardService', () => {
  const bookingRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const loyaltyService = {
    hasEarnedForBooking: jest.fn(),
    earnForBooking: jest.fn(),
  };
  const txRepo = { createQueryBuilder: jest.fn() };
  const accountRepo = { findOne: jest.fn(), save: jest.fn() };
  const customerMatcher = {
    resolveForBooking: jest.fn(),
  };

  const awardService = new LoyaltyAwardService(
    bookingRepo as any,
    txRepo as any,
    accountRepo as any,
    loyaltyService as unknown as LoyaltyService,
    customerMatcher as unknown as LoyaltyCustomerMatcherService,
  );

  const baseBooking = {
    id: 'booking-1',
    businessId: 'biz-1',
    paymentStatus: PaymentStatus.PAID,
    service: { price: 100 },
    business: { settings: { loyalty: { earnPercentCashback: 10 } } },
    customer: { id: 'cust-1', isActive: true },
    customerId: 'cust-1',
  } as Booking;

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyService.hasEarnedForBooking.mockResolvedValue(false);
    loyaltyService.earnForBooking.mockResolvedValue(true);
    customerMatcher.resolveForBooking.mockResolvedValue({
      status: 'matched',
      customerId: 'cust-1',
      method: 'booking_customer_id',
    });
  });

  it('awards cashback on 100% cash payment', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: { amountPaid: 100, pricing: { amountDue: 100, loyaltyDiscount: 0 } },
    });

    const result = await awardService.awardForPaidBooking('booking-1');

    expect(result.status).toBe('awarded');
    expect(result.points).toBe(10);
    expect(loyaltyService.earnForBooking).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
      10,
      'booking-1',
      expect.stringContaining('$100 cash paid'),
    );
  });

  it('awards cashback only on cash portion for mixed loyalty + cash payment', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: {
        amountPaid: 60,
        cashPaidEligible: 60,
        pricing: {
          servicePrice: 100,
          loyaltyDiscount: 40,
          loyaltyPointsRedeemed: 40,
          amountDue: 60,
        },
      },
    });

    const result = await awardService.awardForPaidBooking('booking-1');

    expect(result.status).toBe('awarded');
    expect(result.points).toBe(6);
    expect(loyaltyService.earnForBooking).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
      6,
      'booking-1',
      expect.any(String),
    );
  });

  it('awards 0 cashback for 100% loyalty payment', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: {
        amountPaid: 0,
        pricing: {
          loyaltyDiscount: 100,
          loyaltyPointsRedeemed: 100,
          amountDue: 0,
        },
      },
    });

    const result = await awardService.awardForPaidBooking('booking-1');

    expect(result.status).toBe('skipped');
    expect(result.reason).toBe('no_eligible_cash_payment');
    expect(loyaltyService.earnForBooking).not.toHaveBeenCalled();
  });

  it('prevents duplicate awards for the same booking', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: { amountPaid: 100 },
    });
    loyaltyService.hasEarnedForBooking.mockResolvedValue(true);

    const result = await awardService.awardForPaidBooking('booking-1');

    expect(result.reason).toBe('already_awarded');
    expect(loyaltyService.earnForBooking).not.toHaveBeenCalled();
  });

  it('does not earn when payment is not paid', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      paymentStatus: PaymentStatus.PENDING,
      metadata: { amountPaid: 100 },
    });

    const result = await awardService.awardForPaidBooking('booking-1');
    expect(result.reason).toBe('not_paid');
    expect(loyaltyService.earnForBooking).not.toHaveBeenCalled();
  });

  it('backfill is idempotent when bookings were already awarded', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: { amountPaid: 80 },
    });

    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        { ...baseBooking, metadata: { amountPaid: 80 } },
      ]),
    };
    bookingRepo.createQueryBuilder.mockReturnValue(qb);

    loyaltyService.hasEarnedForBooking
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    loyaltyService.earnForBooking.mockResolvedValue(true);

    const first = await awardService.backfillPaidBookings();
    const second = await awardService.backfillPaidBookings();

    expect(first.bonusesAwarded).toBe(1);
    expect(second.bonusesAwarded).toBe(0);
    expect(second.skipped.already_awarded).toBe(1);
  });
});
