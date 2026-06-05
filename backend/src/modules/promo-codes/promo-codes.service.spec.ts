import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PromoCodesService } from './promo-codes.service.js';
import { PromoDiscountType } from './entities/promo-code.entity.js';

describe('PromoCodesService', () => {
  const promoRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    increment: jest.fn(),
  };

  const planEntitlements = {
    assertFeature: jest.fn().mockResolvedValue(undefined),
  };

  const service = new PromoCodesService(
    promoRepo as any,
    planEntitlements as any,
  );

  const basePromo = {
    id: 'promo-1',
    businessId: 'biz-1',
    code: 'SAVE10',
    discountType: PromoDiscountType.PERCENT,
    discountValue: 10,
    minOrderAmount: null,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    isActive: true,
    description: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    promoRepo.create.mockImplementation((v) => v);
    promoRepo.save.mockImplementation(async (v) => ({ ...basePromo, ...v }));
    promoRepo.findOne.mockResolvedValue(null);
  });

  it('lists promo codes for a business', async () => {
    promoRepo.find.mockResolvedValue([basePromo]);
    await expect(service.list('biz-1')).resolves.toEqual([basePromo]);
    expect(promoRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'biz-1' } }),
    );
  });

  it('creates a promo code without expiration', async () => {
    const created = await service.create('biz-1', {
      code: ' save10 ',
      discountType: PromoDiscountType.PERCENT,
      discountValue: 10,
    });

    expect(created.code).toBe('SAVE10');
    expect(created.expiresAt).toBeNull();
    expect(promoRepo.save).toHaveBeenCalled();
  });

  it('creates a promo code with expiration date', async () => {
    const expiresAt = '2026-12-31T23:59:59.999Z';
    const created = await service.create('biz-1', {
      code: 'HOLIDAY',
      discountType: PromoDiscountType.FIXED,
      discountValue: 15,
      expiresAt,
      minOrderAmount: 50,
      maxUses: 100,
      description: 'Holiday sale',
    });

    expect(created.expiresAt).toEqual(new Date(expiresAt));
    expect(created.minOrderAmount).toBe(50);
    expect(created.maxUses).toBe(100);
    expect(created.description).toBe('Holiday sale');
  });

  it('rejects duplicate promo codes', async () => {
    promoRepo.findOne.mockResolvedValue(basePromo);
    await expect(
      service.create('biz-1', {
        code: 'SAVE10',
        discountType: PromoDiscountType.PERCENT,
        discountValue: 10,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty promo code', async () => {
    await expect(
      service.create('biz-1', {
        code: '   ',
        discountType: PromoDiscountType.PERCENT,
        discountValue: 10,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid discount values', async () => {
    await expect(
      service.create('biz-1', {
        code: 'BAD',
        discountType: PromoDiscountType.PERCENT,
        discountValue: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.create('biz-1', {
        code: 'BAD',
        discountType: PromoDiscountType.PERCENT,
        discountValue: 101,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deactivates an existing promo code', async () => {
    promoRepo.findOne.mockResolvedValue({ ...basePromo });
    promoRepo.save.mockImplementation(async (v) => v);

    const result = await service.deactivate('biz-1', 'promo-1');
    expect(result.isActive).toBe(false);
  });

  it('throws when deactivating missing promo code', async () => {
    promoRepo.findOne.mockResolvedValue(null);
    await expect(service.deactivate('biz-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('validates promo for checkout', async () => {
    promoRepo.findOne.mockResolvedValue({ ...basePromo });
    await expect(
      service.findValidForCheckout('biz-1', 'save10', 100),
    ).resolves.toEqual(expect.objectContaining({ code: 'SAVE10' }));
  });

  it('rejects expired promo codes at checkout', async () => {
    promoRepo.findOne.mockResolvedValue({
      ...basePromo,
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    });

    await expect(
      service.findValidForCheckout('biz-1', 'SAVE10', 100),
    ).rejects.toThrow('Promo code has expired');
  });

  it('accepts promo codes before expiration', async () => {
    promoRepo.findOne.mockResolvedValue({
      ...basePromo,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await expect(
      service.findValidForCheckout('biz-1', 'SAVE10', 100),
    ).resolves.toBeTruthy();
  });

  it('rejects inactive, missing, max-use, and min-order promos', async () => {
    promoRepo.findOne.mockResolvedValue(null);
    await expect(
      service.findValidForCheckout('biz-1', 'MISSING', 100),
    ).rejects.toThrow('Invalid promo code');

    promoRepo.findOne.mockResolvedValue({ ...basePromo, isActive: false });
    await expect(
      service.findValidForCheckout('biz-1', 'SAVE10', 100),
    ).rejects.toThrow('no longer active');

    promoRepo.findOne.mockResolvedValue({
      ...basePromo,
      maxUses: 5,
      usedCount: 5,
    });
    await expect(
      service.findValidForCheckout('biz-1', 'SAVE10', 100),
    ).rejects.toThrow('usage limit');

    promoRepo.findOne.mockResolvedValue({ ...basePromo, minOrderAmount: 200 });
    await expect(
      service.findValidForCheckout('biz-1', 'SAVE10', 100),
    ).rejects.toThrow('Minimum order amount');
  });

  it('calculates percent and fixed discounts', () => {
    expect(
      service.calculateDiscount(
        {
          ...basePromo,
          discountType: PromoDiscountType.PERCENT,
          discountValue: 10,
        } as any,
        100,
      ),
    ).toBe(10);

    expect(
      service.calculateDiscount(
        {
          ...basePromo,
          discountType: PromoDiscountType.FIXED,
          discountValue: 25,
        } as any,
        100,
      ),
    ).toBe(25);

    expect(
      service.calculateDiscount(
        {
          ...basePromo,
          discountType: PromoDiscountType.FIXED,
          discountValue: 150,
        } as any,
        100,
      ),
    ).toBe(100);
  });

  it('records promo use', async () => {
    await service.recordUse('promo-1');
    expect(promoRepo.increment).toHaveBeenCalledWith(
      { id: 'promo-1' },
      'usedCount',
      1,
    );
  });
});
