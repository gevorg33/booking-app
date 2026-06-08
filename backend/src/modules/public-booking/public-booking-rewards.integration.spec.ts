import { PublicBookingService } from './public-booking.service.js';
import { PromoDiscountType } from '../promo-codes/entities/promo-code.entity.js';

describe('PublicBookingService consumer rewards (adopt-4.6)', () => {
  const business = {
    id: 'biz-1',
    slug: 'demo-salon',
    name: 'Demo Salon',
    isActive: true,
    subscriptionPlanId: 'starter',
    subscriptionStatus: 'active',
    settings: { currency: 'USD', loyalty: { earnPercentCashback: 10 } },
  };

  const businessService = {
    findBySlug: jest.fn().mockResolvedValue(business),
  };
  const promoCodesService = {
    listActiveForPublic: jest.fn().mockResolvedValue([
      {
        code: 'WELCOME10',
        discountType: PromoDiscountType.PERCENT,
        discountValue: 10,
        minOrderAmount: null,
        maxUses: null,
        usedCount: 0,
        expiresAt: null,
        description: 'Welcome offer',
        isActive: true,
      },
      {
        code: 'EXPIRED',
        discountType: PromoDiscountType.FIXED,
        discountValue: 5,
        minOrderAmount: null,
        maxUses: null,
        usedCount: 0,
        expiresAt: new Date('2026-01-01T00:00:00.000Z'),
        description: null,
        isActive: true,
      },
    ]),
  };
  const loyaltyService = {
    getOrCreate: jest.fn().mockResolvedValue({
      pointsBalance: 12,
      lifetimeEarned: 20,
    }),
    getPublicSummary: jest.fn().mockReturnValue({
      pointsBalance: 12,
      lifetimeEarned: 20,
      pointsValue: 12,
      earnPercentCashback: 10,
      bonusDollarValue: 1,
    }),
  };
  const planEntitlementsService = {
    getEntitlements: jest.fn().mockResolvedValue({
      flags: { promoCodes: true, loyalty: true },
    }),
  };

  const service = new PublicBookingService(
    businessService as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    promoCodesService as any,
    loyaltyService as any,
    planEntitlementsService as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    { get: jest.fn() } as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns active public promotions when promo codes are enabled', async () => {
    await expect(service.getPublicPromotions('demo-salon')).resolves.toEqual({
      promotions: [
        expect.objectContaining({
          code: 'WELCOME10',
          discountLabel: '10% off',
          description: 'Welcome offer',
        }),
      ],
    });
  });

  it('returns empty promotions when plan disallows promo codes', async () => {
    planEntitlementsService.getEntitlements.mockResolvedValueOnce({
      flags: { promoCodes: false, loyalty: true },
    });
    await expect(service.getPublicPromotions('demo-salon')).resolves.toEqual({
      promotions: [],
    });
    expect(promoCodesService.listActiveForPublic).not.toHaveBeenCalled();
  });

  it('returns loyalty and promotions for signed-in customer rewards', async () => {
    await expect(
      service.getCustomerRewards('demo-salon', 'cust-1'),
    ).resolves.toEqual({
      loyaltyEnabled: true,
      loyalty: expect.objectContaining({ pointsBalance: 12, pointsValue: 12 }),
      promotions: [
        expect.objectContaining({ code: 'WELCOME10' }),
      ],
    });
  });

  it('omits loyalty when plan disallows loyalty program', async () => {
    planEntitlementsService.getEntitlements.mockResolvedValueOnce({
      flags: { promoCodes: true, loyalty: false },
    });
    await expect(
      service.getCustomerRewards('demo-salon', 'cust-1'),
    ).resolves.toEqual({
      loyaltyEnabled: false,
      loyalty: null,
      promotions: [expect.objectContaining({ code: 'WELCOME10' })],
    });
    expect(loyaltyService.getOrCreate).not.toHaveBeenCalled();
  });
});
