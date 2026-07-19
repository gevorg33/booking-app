import { describe, expect, it, jest } from '@jest/globals';
import { handleListPromoCodesLogic } from './ai-list-promo-codes.logic.js';

describe('handleListPromoCodesLogic', () => {
  it('lists active promo codes', async () => {
    const result = await handleListPromoCodesLogic(
      {
        promoCodesService: {
          list: jest.fn(async () => [
            {
              id: '1',
              code: 'SUMMER15',
              discountType: 'percent',
              discountValue: 15,
              isActive: true,
            },
            {
              id: '2',
              code: 'OLD',
              discountType: 'fixed',
              discountValue: 5,
              isActive: false,
            },
          ]),
        } as any,
      },
      'biz-1',
      { activeOnly: true },
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('SUMMER15');
    expect(result.summary).not.toContain('OLD');
  });

  it('reports empty catalog', async () => {
    const result = await handleListPromoCodesLogic(
      {
        promoCodesService: {
          list: jest.fn(async () => []),
        } as any,
      },
      'biz-1',
      {},
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/no promo codes/i);
  });
});
