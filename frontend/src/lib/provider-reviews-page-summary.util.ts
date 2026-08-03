/**
 * e2e-bug.210 — when the dedicated `/providers/{id}/reviews` page should show
 * the aggregate star/average header (same data profile already uses).
 */
export function shouldShowProviderReviewsPageSummary(options: {
  averageRating: number | null | undefined;
  reviewCount: number | null | undefined;
}): boolean {
  const count = Number(options.reviewCount ?? 0);
  const average = options.averageRating;
  if (!(count > 0)) return false;
  if (average == null || Number.isNaN(Number(average))) return false;
  return true;
}

export function resolveProviderReviewsPageSummary(options: {
  averageRating: number | null | undefined;
  reviewCount: number | null | undefined;
}): { averageRating: number; reviewCount: number } | null {
  if (!shouldShowProviderReviewsPageSummary(options)) return null;
  return {
    averageRating: Number(options.averageRating),
    reviewCount: Number(options.reviewCount),
  };
}
