export const DASHBOARD_REVIEWS_READ_INTENTS = ['list_reviews'] as const;

export const CUSTOMER_REVIEWS_MUTATE_INTENTS = ['submit_review'] as const;

export const REVIEWS_INTENTS = [
  ...DASHBOARD_REVIEWS_READ_INTENTS,
  ...CUSTOMER_REVIEWS_MUTATE_INTENTS,
] as const;

export type ReviewsIntent = (typeof REVIEWS_INTENTS)[number];

export function isReviewsIntent(action: string): action is ReviewsIntent {
  return (REVIEWS_INTENTS as readonly string[]).includes(action);
}

export function isListReviewsPrompt(prompt: string): boolean {
  return (
    /\b(list|show|open|recent|latest|inbox)\b/i.test(prompt) &&
    /\breviews?\b/i.test(prompt)
  );
}

export function isSubmitReviewPrompt(prompt: string): boolean {
  return (
    /\b(submit|leave|post|write|rate)\b/i.test(prompt) &&
    /\breviews?\b/i.test(prompt)
  );
}

export function rescueReviewsIntent(
  prompt: string,
  action: string,
): { action: ReviewsIntent; rescueReason: string } | null {
  if (isListReviewsPrompt(prompt) && action !== 'list_reviews') {
    return { action: 'list_reviews', rescueReason: 'list_reviews' };
  }
  if (isSubmitReviewPrompt(prompt) && action !== 'submit_review') {
    return { action: 'submit_review', rescueReason: 'submit_review' };
  }
  return null;
}
