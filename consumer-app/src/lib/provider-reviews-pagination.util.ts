import type { PublicProviderReview } from './types.js';

/** e2e-bug.25 — more reviews exist beyond what is currently loaded. */
export function canLoadMoreProviderReviews(options: {
  loadedCount: number;
  reviewCount: number;
}): boolean {
  const loaded = Math.max(0, options.loadedCount);
  const total = Math.max(0, options.reviewCount);
  return loaded > 0 && loaded < total;
}

export function nextProviderReviewsPage(currentPage: number): number {
  return Math.max(1, Math.floor(currentPage) || 1) + 1;
}

/** Append a fetched page without duplicating ids (newest pages first is caller's job). */
export function mergeProviderReviewItems(
  existing: PublicProviderReview[],
  incoming: PublicProviderReview[],
): PublicProviderReview[] {
  const seen = new Set(existing.map((review) => review.id));
  const appended = incoming.filter((review) => !seen.has(review.id));
  return appended.length === 0 ? existing : [...existing, ...appended];
}
