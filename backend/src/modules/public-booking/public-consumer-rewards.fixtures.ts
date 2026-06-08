import { PromoDiscountType } from '../promo-codes/entities/promo-code.entity.js';
import type { PromoCodeLike } from './public-consumer-rewards.util.js';

export const PUBLIC_PROMO_FIXTURES: Array<{
  id: string;
  promo: PromoCodeLike;
  now: string;
  expectedActive: boolean;
}> = [
  {
    id: 'active-percent',
    promo: {
      code: 'SAVE10',
      discountType: PromoDiscountType.PERCENT,
      discountValue: 10,
      minOrderAmount: null,
      maxUses: null,
      usedCount: 0,
      expiresAt: null,
      description: 'Welcome back',
      isActive: true,
    },
    now: '2026-06-08T12:00:00.000Z',
    expectedActive: true,
  },
  {
    id: 'expired',
    promo: {
      code: 'OLD',
      discountType: PromoDiscountType.FIXED,
      discountValue: 5,
      minOrderAmount: null,
      maxUses: null,
      usedCount: 0,
      expiresAt: '2026-06-01T00:00:00.000Z',
      description: null,
      isActive: true,
    },
    now: '2026-06-08T12:00:00.000Z',
    expectedActive: false,
  },
  {
    id: 'max-uses-reached',
    promo: {
      code: 'LIMIT',
      discountType: PromoDiscountType.PERCENT,
      discountValue: 15,
      minOrderAmount: null,
      maxUses: 10,
      usedCount: 10,
      expiresAt: null,
      description: null,
      isActive: true,
    },
    now: '2026-06-08T12:00:00.000Z',
    expectedActive: false,
  },
];
