import { PUBLIC_PROMO_FIXTURES } from './public-consumer-rewards.fixtures.js';
import {
  filterPubliclyActivePromos,
  formatPublicPromoDiscountLabel,
  isPromoPubliclyActive,
  mapPublicPromotionViews,
  toPublicPromotionView,
} from './public-consumer-rewards.util.js';
import { PromoDiscountType } from '../promo-codes/entities/promo-code.entity.js';

describe('public-consumer-rewards.util', () => {
  it.each(PUBLIC_PROMO_FIXTURES)(
    'isPromoPubliclyActive $id',
    ({ promo, now, expectedActive }) => {
      expect(isPromoPubliclyActive(promo, new Date(now))).toBe(expectedActive);
    },
  );

  it('formats percent and fixed discount labels', () => {
    expect(
      formatPublicPromoDiscountLabel({
        code: 'PCT',
        discountType: PromoDiscountType.PERCENT,
        discountValue: 15,
      }),
    ).toBe('15% off');
    expect(
      formatPublicPromoDiscountLabel(
        {
          code: 'FIX',
          discountType: PromoDiscountType.FIXED,
          discountValue: 5,
        },
        'USD',
      ),
    ).toContain('5.00');
  });

  it('maps active promos to public views', () => {
    const views = mapPublicPromotionViews(
      PUBLIC_PROMO_FIXTURES.map((fixture) => fixture.promo),
      'USD',
      new Date('2026-06-08T12:00:00.000Z'),
    );
    expect(views).toHaveLength(1);
    expect(views[0]).toMatchObject({
      code: 'SAVE10',
      discountLabel: '10% off',
      description: 'Welcome back',
    });
  });

  it('normalizes promo code casing in public view', () => {
    expect(
      toPublicPromotionView({
        code: ' save10 ',
        discountType: PromoDiscountType.PERCENT,
        discountValue: 10,
      }).code,
    ).toBe('SAVE10');
  });
});
