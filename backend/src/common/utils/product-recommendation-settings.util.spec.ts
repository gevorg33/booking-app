import {
  applyProductRecommendationSettingsToBusinessSettings,
  resolveProductRecommendationSettings,
} from './product-recommendation-settings.util.js';

describe('product-recommendation-settings.util', () => {
  it('resolves default max product count', () => {
    expect(resolveProductRecommendationSettings({})).toEqual({
      maxProductCount: 5,
    });
  });

  it('reads max product count from business settings', () => {
    expect(
      resolveProductRecommendationSettings({
        publicBooking: { recommendations: { maxProductCount: 3 } },
      }),
    ).toEqual({ maxProductCount: 3 });
  });

  it('falls back when max count is invalid', () => {
    expect(
      resolveProductRecommendationSettings({
        publicBooking: { recommendations: { maxProductCount: 0 } },
      }),
    ).toEqual({ maxProductCount: 5 });
  });

  it('merges recommendation settings into business settings', () => {
    expect(
      applyProductRecommendationSettingsToBusinessSettings(
        { locale: 'en' },
        { maxProductCount: 4 },
      ),
    ).toEqual({
      locale: 'en',
      publicBooking: { recommendations: { maxProductCount: 4 } },
    });
  });
});
