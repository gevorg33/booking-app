/**
 * e2e-bug.26 — optimistic average after submit must use plain values, not nested
 * setState updaters (React Strict Mode can double-invoke and inflate the average).
 */
export function computeOptimisticAverageRating(
  currentAverage: number | null | undefined,
  previousCount: number,
  newRating: number,
): number {
  const safePrev = Math.max(0, previousCount);
  if (safePrev <= 0 || currentAverage == null || Number.isNaN(currentAverage)) {
    return Math.round(newRating * 10) / 10;
  }
  const next = safePrev + 1;
  return Math.round(((currentAverage * safePrev + newRating) / next) * 10) / 10;
}

export function applyOptimisticReviewSummary(options: {
  currentAverage: number | null | undefined;
  previousCount: number;
  newRating: number;
}): { reviewCount: number; averageRating: number } {
  const previousCount = Math.max(0, options.previousCount);
  return {
    reviewCount: previousCount + 1,
    averageRating: computeOptimisticAverageRating(
      options.currentAverage,
      previousCount,
      options.newRating,
    ),
  };
}
