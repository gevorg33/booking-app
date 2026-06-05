export interface ProductRecommendationSettings {
  maxProductCount: number;
}

export const DEFAULT_PRODUCT_RECOMMENDATION_SETTINGS: ProductRecommendationSettings =
  {
    maxProductCount: 5,
  };

export function resolveProductRecommendationSettings(
  settings: Record<string, unknown> | null | undefined,
): ProductRecommendationSettings {
  const publicBooking =
    (settings?.publicBooking as Record<string, unknown> | undefined) ?? {};
  const raw =
    (publicBooking.recommendations as Record<string, unknown> | undefined) ??
    {};

  const maxProductCount = parsePositiveInt(
    raw.maxProductCount,
    DEFAULT_PRODUCT_RECOMMENDATION_SETTINGS.maxProductCount,
  );

  return { maxProductCount };
}

export function applyProductRecommendationSettingsToBusinessSettings(
  settings: Record<string, unknown>,
  recommendations: ProductRecommendationSettings,
): Record<string, unknown> {
  const publicBooking = {
    ...((settings.publicBooking as Record<string, unknown>) ?? {}),
  };
  publicBooking.recommendations = recommendations;
  return { ...settings, publicBooking };
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}
