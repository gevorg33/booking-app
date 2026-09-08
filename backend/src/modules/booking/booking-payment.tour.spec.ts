import { BookingPaymentService } from './booking-payment.service.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';

describe('BookingPaymentService tour pricing', () => {
  const checkoutPricingService = { calculate: jest.fn().mockResolvedValue({}) };
  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'USD' },
    }),
  };

  const service = new BookingPaymentService(
    {} as any,
    {} as any,
    businessRepo as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    checkoutPricingService as any,
    { getPlanCheckoutDetails: jest.fn() } as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  // e2e-bug.520 — these three assertions expected prepaymentAmount to fall back
  // to the full catalog price, which is the exact fallback api-bug.7 /
  // e2e-bug.222 removed: with prepaymentMode NONE the online prepayment is 0 and
  // the catalog total stays in servicePrice. The fixture below declares
  // PrepaymentMode.NONE, so the tests contradicted their own setup. What each
  // test is actually named for — the paxCount multiplication — is asserted by
  // servicePrice, and that was correct all along.
  const tourService = {
    id: 'svc-tour',
    name: 'City Tour',
    price: 85,
    currency: 'USD',
    prepaymentMode: PrepaymentMode.NONE,
    metadata: {
      serviceType: TOUR_SERVICE_TYPE,
      maxGroupSize: 12,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('multiplies per-person tour price by paxCount for checkout', async () => {
    await service.resolveCheckoutPricing('biz-1', tourService as any, {
      serviceId: 'svc-tour',
      startTime: new Date().toISOString(),
      customer: { name: 'Group' },
      paxCount: 4,
    });

    expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        servicePrice: 340,
        prepaymentAmount: 0,
      }),
    );
  });

  it('uses single traveler price when paxCount is omitted', async () => {
    await service.resolveCheckoutPricing('biz-1', tourService as any, {
      serviceId: 'svc-tour',
      startTime: new Date().toISOString(),
      customer: { name: 'Solo' },
    });

    expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        servicePrice: 85,
        prepaymentAmount: 0,
      }),
    );
  });

  // e2e-bug.520 — the assertions above had to drop to prepaymentAmount 0 to match
  // PrepaymentMode.NONE, which would have left the pax multiplication of the
  // *charge* unasserted: `chargeBase` runs through multiplyTourPrice too. This is
  // the test the original three were reaching for, with a fixture that supports
  // it — FULL mode returns the catalog price, so a 4-person tour charges 4x.
  it('scales the prepayment by paxCount when the tour requires prepayment', async () => {
    await service.resolveCheckoutPricing(
      'biz-1',
      { ...tourService, prepaymentMode: PrepaymentMode.FULL } as any,
      {
        serviceId: 'svc-tour',
        startTime: new Date().toISOString(),
        customer: { name: 'Group' },
        paxCount: 4,
      },
    );

    expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        servicePrice: 340,
        prepaymentAmount: 340,
      }),
    );
  });

  it('does not multiply non-tour services by paxCount', async () => {
    await service.resolveCheckoutPricing(
      'biz-1',
      {
        ...tourService,
        metadata: {},
      } as any,
      {
        serviceId: 'svc-tour',
        startTime: new Date().toISOString(),
        customer: { name: 'Guest' },
        paxCount: 3,
      },
    );

    expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        servicePrice: 85,
        prepaymentAmount: 0,
      }),
    );
  });

  it('multiplies deposit prepayment for tour groups', async () => {
    await service.resolveCheckoutPricing(
      'biz-1',
      {
        ...tourService,
        prepaymentMode: PrepaymentMode.DEPOSIT,
        depositAmount: 20,
      } as any,
      {
        serviceId: 'svc-tour',
        startTime: new Date().toISOString(),
        customer: { name: 'Group' },
        paxCount: 3,
      },
    );

    expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        prepaymentAmount: 60,
        servicePrice: 255,
      }),
    );
  });
});
