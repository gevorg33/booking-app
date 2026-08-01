/**
 * e2e-bug.211 — dedicated `/providers/{id}/reviews` must be discoverable from
 * the profile even when all reviews fit on page 1 (`totalPages === 1`).
 */
export function shouldLinkProviderProfileToReviewsPage(options: {
  reviewCount: number | null | undefined;
  averageRating?: number | null;
}): boolean {
  return Number(options.reviewCount ?? 0) > 0;
}

/** Footer “See all reviews” whenever there is at least one review. */
export function shouldShowProviderProfileSeeAllReviewsLink(options: {
  reviewCount: number | null | undefined;
  totalPages?: number | null;
}): boolean {
  return shouldLinkProviderProfileToReviewsPage(options);
}

/**
 * Keep a distinct pagination cue only when more pages exist beyond the
 * inline profile list (legacy “See more” affordance).
 */
export function isProviderProfileReviewsPaginated(options: {
  totalPages: number | null | undefined;
}): boolean {
  return Number(options.totalPages ?? 0) > 1;
}
