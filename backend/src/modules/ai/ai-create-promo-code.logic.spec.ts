import { PromoDiscountType } from '../promo-codes/entities/promo-code.entity.js';
import { handleCreatePromoCodeLogic } from './ai-create-promo-code.logic.js';

describe('ai-create-promo-code.logic', () => {
  const promoCodesService = {
    create: jest.fn(async (_businessId: string, dto: Record<string, unknown>) => ({
      id: 'promo-1',
      code: dto.code,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minOrderAmount: dto.minOrderAmount ?? null,
      maxUses: dto.maxUses ?? null,
      expiresAt: dto.expiresAt ?? null,
      description: dto.description ?? null,
      isActive: true,
    })),
  };

  it('creates promo code from parsed prompt', async () => {
    const result = await handleCreatePromoCodeLogic(
      { promoCodesService } as any,
      'biz-1',
      {},
      'Create promo code SAVE10 for 20% off',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('create_promo_code');
    expect(result.summary).toContain('SAVE10');
    expect(promoCodesService.create).toHaveBeenCalledWith('biz-1', {
      code: 'SAVE10',
      discountType: PromoDiscountType.PERCENT,
      discountValue: 20,
      minOrderAmount: undefined,
      maxUses: undefined,
      expiresAt: undefined,
      description: undefined,
    });
  });

  it('returns clarify when code is missing', async () => {
    const result = await handleCreatePromoCodeLogic(
      { promoCodesService } as any,
      'biz-1',
      { discountType: 'percent', discountValue: 10 },
      'Create a new promo code for 10% off',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toContain('code');
  });

  it('returns clarify when discount is missing', async () => {
    const result = await handleCreatePromoCodeLogic(
      { promoCodesService } as any,
      'biz-1',
      { code: 'SAVE10' },
      'Create promo code SAVE10',
    );
    expect(result.success).toBe(false);
    expect(result.details?.missing).toEqual(
      expect.arrayContaining(['discountType', 'discountValue']),
    );
  });

  it('creates fixed-amount promo codes', async () => {
    const result = await handleCreatePromoCodeLogic(
      { promoCodesService } as any,
      'biz-1',
      {},
      'Make coupon SUMMER25 with $10 off',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('$10 off');
  });

  it('returns clarify when prompt is not a create request', async () => {
    const result = await handleCreatePromoCodeLogic(
      { promoCodesService } as any,
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns failure when service throws', async () => {
    const result = await handleCreatePromoCodeLogic(
      {
        promoCodesService: {
          create: jest.fn(async () => {
            throw new Error('Promo code already exists');
          }),
        },
      } as any,
      'biz-1',
      {},
      'Create promo code SAVE10 for 20% off',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toBe('Promo code already exists');
  });

  it('includes min order and max uses in summary', async () => {
    const result = await handleCreatePromoCodeLogic(
      { promoCodesService } as any,
      'biz-1',
      {},
      'Create promo code VIP50 for 50% off minimum order $100 limited to 25 uses',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('minimum order $100');
    expect(result.summary).toContain('max 25 uses');
  });

  it('returns generic failure when service throws without message', async () => {
    const result = await handleCreatePromoCodeLogic(
      {
        promoCodesService: {
          create: jest.fn(async () => {
            throw new Error();
          }),
        },
      } as any,
      'biz-1',
      {},
      'Create promo code SAVE10 for 20% off',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toBe('Could not create promo code.');
  });
});
