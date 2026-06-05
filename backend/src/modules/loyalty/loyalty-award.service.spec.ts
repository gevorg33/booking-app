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
  const txRepo = {
    createQueryBuilder: jest.fn(),
    save: jest.fn(),
  };
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
      metadata: {
        amountPaid: 100,
        pricing: { amountDue: 100, loyaltyDiscount: 0 },
      },
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

  it('skips earn when service is excluded from bonus rate', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      serviceId: 'svc-excluded',
      business: {
        settings: {
          loyalty: {
            earnPercentCashback: 10,
            earnExcludedServiceIds: ['svc-excluded'],
          },
        },
      },
      metadata: { amountPaid: 100 },
    });

    const result = await awardService.awardForPaidBooking('booking-1');

    expect(result.status).toBe('skipped');
    expect(result.reason).toBe('service_excluded');
    expect(loyaltyService.earnForBooking).not.toHaveBeenCalled();
  });

  it('skips when booking is missing', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    const result = await awardService.awardForPaidBooking('missing');
    expect(result.reason).toBe('not_paid');
  });

  it('skips ambiguous customer matches', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: { amountPaid: 100 },
    });
    customerMatcher.resolveForBooking.mockResolvedValue({
      status: 'ambiguous',
      candidateCustomerIds: ['c1', 'c2'],
    });

    const result = await awardService.awardForPaidBooking('booking-1');
    expect(result.reason).toBe('ambiguous_match');
    expect(result.ambiguousCandidateIds).toEqual(['c1', 'c2']);
  });

  it('skips when customer cannot be matched', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: { amountPaid: 100 },
    });
    customerMatcher.resolveForBooking.mockResolvedValue({
      status: 'unmatched',
    });

    const result = await awardService.awardForPaidBooking('booking-1');
    expect(result.reason).toBe('no_customer');
  });

  it('skips zero-point earn amounts', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      business: { settings: { loyalty: { earnPercentCashback: 0 } } },
      metadata: { amountPaid: 100 },
    });

    const result = await awardService.awardForPaidBooking('booking-1');
    expect(result.reason).toBe('zero_points');
  });

  it('skips when earnForBooking reports duplicate', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: { amountPaid: 100 },
    });
    loyaltyService.earnForBooking.mockResolvedValue(false);

    const result = await awardService.awardForPaidBooking('booking-1');
    expect(result.reason).toBe('already_awarded');
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
      getMany: jest
        .fn()
        .mockResolvedValue([{ ...baseBooking, metadata: { amountPaid: 80 } }]),
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

  it('backfill tracks excluded services and ambiguous matches', async () => {
    bookingRepo.findOne
      .mockResolvedValueOnce({
        ...baseBooking,
        id: 'booking-excluded',
        serviceId: 'svc-excluded',
        business: {
          settings: { loyalty: { earnExcludedServiceIds: ['svc-excluded'] } },
        },
        metadata: { amountPaid: 100 },
      })
      .mockResolvedValueOnce({
        ...baseBooking,
        id: 'booking-ambiguous',
        metadata: { amountPaid: 100 },
      });

    customerMatcher.resolveForBooking
      .mockResolvedValueOnce({
        status: 'matched',
        customerId: 'cust-1',
        method: 'booking_customer_id',
      })
      .mockResolvedValueOnce({
        status: 'ambiguous',
        candidateCustomerIds: ['c1', 'c2'],
      });

    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          ...baseBooking,
          id: 'booking-excluded',
          businessId: 'biz-1',
          business: { name: 'Salon', slug: 'salon' },
        },
        {
          ...baseBooking,
          id: 'booking-ambiguous',
          businessId: 'biz-1',
          business: { name: 'Salon', slug: 'salon' },
        },
      ]),
    };
    bookingRepo.createQueryBuilder.mockReturnValue(qb);

    const summary = await awardService.backfillPaidBookings('biz-1');

    expect(qb.andWhere).toHaveBeenCalledWith(
      'booking.businessId = :businessId',
      {
        businessId: 'biz-1',
      },
    );
    expect(summary.skipped.service_excluded).toBe(1);
    expect(summary.skipped.ambiguous_match).toBe(1);
    expect(summary.ambiguousRecords).toHaveLength(1);
    expect(summary.byTenant).toHaveLength(1);
  });

  it('recalculates existing earnings down to zero for excluded services', async () => {
    const tx = {
      id: 'tx-1',
      accountId: 'acct-1',
      bookingId: 'booking-1',
      points: 10,
      type: 'earn',
    };
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([tx]),
    };
    txRepo.createQueryBuilder.mockReturnValue(qb);
    txRepo.save.mockImplementation(async (v) => v);
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      serviceId: 'svc-excluded',
      paymentStatus: PaymentStatus.PAID,
      business: {
        settings: {
          loyalty: {
            earnPercentCashback: 10,
            earnExcludedServiceIds: ['svc-excluded'],
          },
        },
      },
      metadata: { amountPaid: 100 },
    });
    accountRepo.findOne.mockResolvedValue({
      id: 'acct-1',
      pointsBalance: 20,
      lifetimeEarned: 30,
    });
    accountRepo.save.mockImplementation(async (v) => v);

    const result = await awardService.recalculateExistingEarnings('biz-1');

    expect(result.corrected).toBe(1);
    expect(tx.points).toBe(0);
    expect(tx.note).toBe('Service excluded from bonus earn rate');
    expect(accountRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ pointsBalance: 10, lifetimeEarned: 20 }),
    );
  });

  it('leaves zero-point transactions unchanged for excluded services', async () => {
    const tx = {
      id: 'tx-2',
      accountId: 'acct-1',
      bookingId: 'booking-1',
      points: 0,
      type: 'earn',
    };
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([tx]),
    };
    txRepo.createQueryBuilder.mockReturnValue(qb);
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      serviceId: 'svc-excluded',
      business: {
        settings: { loyalty: { earnExcludedServiceIds: ['svc-excluded'] } },
      },
    });

    const result = await awardService.recalculateExistingEarnings();
    expect(result.unchanged).toBe(1);
    expect(result.corrected).toBe(0);
    expect(txRepo.save).not.toHaveBeenCalled();
  });

  it('recalculates mismatched earn amounts for eligible services', async () => {
    const tx = {
      id: 'tx-3',
      accountId: 'acct-1',
      bookingId: 'booking-1',
      points: 5,
      type: 'earn',
    };
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([tx]),
    };
    txRepo.createQueryBuilder.mockReturnValue(qb);
    txRepo.save.mockImplementation(async (v) => v);
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      paymentStatus: PaymentStatus.PAID,
      metadata: { amountPaid: 100 },
    });
    accountRepo.findOne.mockResolvedValue({
      id: 'acct-1',
      pointsBalance: 15,
      lifetimeEarned: 25,
    });
    accountRepo.save.mockImplementation(async (v) => v);

    const result = await awardService.recalculateExistingEarnings();

    expect(result.corrected).toBe(1);
    expect(tx.points).toBe(10);
    expect(accountRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ pointsBalance: 20, lifetimeEarned: 30 }),
    );
  });

  it('counts unpaid bookings as unchanged during recalculation', async () => {
    const tx = {
      id: 'tx-4',
      accountId: 'acct-1',
      bookingId: 'booking-1',
      points: 10,
      type: 'earn',
    };
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([tx]),
    };
    txRepo.createQueryBuilder.mockReturnValue(qb);
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      paymentStatus: PaymentStatus.PENDING,
    });

    const result = await awardService.recalculateExistingEarnings();
    expect(result.unchanged).toBe(1);
  });

  it('leaves correctly calculated earn transactions unchanged', async () => {
    const tx = {
      id: 'tx-5',
      accountId: 'acct-1',
      bookingId: 'booking-1',
      points: 10,
      type: 'earn',
    };
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([tx]),
    };
    txRepo.createQueryBuilder.mockReturnValue(qb);
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      paymentStatus: PaymentStatus.PAID,
      metadata: { amountPaid: 100 },
    });

    const result = await awardService.recalculateExistingEarnings();
    expect(result.unchanged).toBe(1);
    expect(result.corrected).toBe(0);
    expect(txRepo.save).not.toHaveBeenCalled();
  });
});
