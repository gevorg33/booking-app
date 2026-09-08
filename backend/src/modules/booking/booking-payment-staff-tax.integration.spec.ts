import { NotFoundException } from '@nestjs/common';
import { BookingPaymentService } from './booking-payment.service.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';

describe('Sprint 36 — staff booking tax integration', () => {
  const serviceRepo = {
  findOne: jest.fn(),
  // e2e-bug.471 — sumServicesPrepaymentAmount reads `find` for multi-service
  // totals. Empty is the honest default: a spec that has not declared extra
  // services has none, so the sum is 0 and the assertion decides, not the stub.
  find: jest.fn().mockResolvedValue([]),
};
  const businessRepo = { findOne: jest.fn() };
  const checkoutPricingService = { calculate: jest.fn() };

  const service = new BookingPaymentService(
    {} as never,
    serviceRepo as never,
    businessRepo as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { publish: jest.fn() } as never,
    {} as never,
    checkoutPricingService as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  const baseService = {
    id: 'svc-1',
    name: 'Massage',
    price: 100,
    currency: 'USD',
    prepaymentMode: PrepaymentMode.FULL,
    metadata: {},
  };

  const taxPricing = {
    servicePrice: 100,
    subtotal: 100,
    amountDue: 120,
    taxEnabled: true,
    taxName: 'VAT',
    taxRate: 20,
    taxModel: 'exclusive',
    taxAmount: 20,
    netAmount: 100,
    currency: 'USD',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        tax: { enabled: true, name: 'VAT', rate: 20, model: 'exclusive' },
      },
    });
    serviceRepo.findOne.mockResolvedValue(baseService);
    checkoutPricingService.calculate.mockResolvedValue(taxPricing);
  });

  it.each([
    { id: 'exclusive', pricing: taxPricing, expectedCents: 120 },
    {
      id: 'inclusive',
      pricing: {
        ...taxPricing,
        amountDue: 100,
        taxModel: 'inclusive',
        taxAmount: 4.76,
        netAmount: 95.24,
      },
      expectedCents: 100,
    },
    {
      id: 'stacked',
      pricing: {
        ...taxPricing,
        amountDue: 113,
        taxName: 'GST + PST',
        taxRate: 13,
        taxAmount: 13,
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
      },
      expectedCents: 113,
    },
  ])(
    'resolveStaffBookingPricing applies business tax for $id',
    async ({ pricing }) => {
      checkoutPricingService.calculate.mockResolvedValue(pricing);

      const result = await service.resolveStaffBookingPricing('biz-1', 'svc-1');

      expect(result).toEqual(pricing);
      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'biz-1',
          servicePrice: 100,
          tax: {
            enabled: true,
            name: 'VAT',
            rate: 20,
            model: 'exclusive',
            serviceRatePercent: null,
          },
        }),
      );
    },
  );

  it('throws when staff quote service is missing', async () => {
    serviceRepo.findOne.mockResolvedValue(null);

    await expect(
      service.resolveStaffBookingPricing('biz-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('enrichStaffCreateDto attaches pricing metadata for dashboard bookings', async () => {
    const enriched = await service.enrichStaffCreateDto('biz-1', {
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      startTime: new Date().toISOString(),
    });

    expect(enriched.metadata).toMatchObject({
      source: 'dashboard_booking',
      pricing: expect.objectContaining({
        amountDue: 120,
        taxEnabled: true,
        taxAmount: 20,
      }),
      amountPaid: 120,
    });
  });

  it('skips enrichment when pricing metadata already exists', async () => {
    const dto = {
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      startTime: new Date().toISOString(),
      metadata: { pricing: { amountDue: 50 } },
    };

    const enriched = await service.enrichStaffCreateDto('biz-1', dto);

    expect(enriched).toBe(dto);
    expect(checkoutPricingService.calculate).not.toHaveBeenCalled();
  });

  it.each([
    { id: 'subscription', field: 'useSubscriptionId', value: 'sub-1' },
    { id: 'package', field: 'packagePurchaseId', value: 'pkg-1' },
    { id: 'multi-service', field: 'multiServiceGroupId', value: 'group-1' },
  ])('skips enrichment for $id bookings', async ({ field, value }) => {
    const dto = {
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      startTime: new Date().toISOString(),
      [field]: value,
    };

    const enriched = await service.enrichStaffCreateDto('biz-1', dto);

    expect(enriched).toBe(dto);
    expect(checkoutPricingService.calculate).not.toHaveBeenCalled();
  });
});
