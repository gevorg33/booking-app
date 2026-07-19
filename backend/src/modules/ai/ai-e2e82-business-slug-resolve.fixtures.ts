/**
 * e2e-bug.82 — customer handlers must resolve booking slug from businessId
 * when the classifier omits params.slug (it never extracts routing slugs).
 */
export const E2E82_HELPER_CASES = [
  {
    id: 'e2e82-helper-prefers-params-slug',
    params: { slug: 'from-params' },
    businessId: 'biz-1',
    repoSlug: 'from-db',
    expected: 'from-params',
  },
  {
    id: 'e2e82-helper-falls-back-to-businessId',
    params: {},
    businessId: 'biz-1',
    repoSlug: 'glow-salon',
    expected: 'glow-salon',
  },
  {
    id: 'e2e82-helper-null-when-business-missing',
    params: {},
    businessId: 'biz-missing',
    repoSlug: null as string | null,
    expected: null as string | null,
  },
] as const;

export const E2E82_HANDLER_NO_PARAMS_SLUG = [
  {
    id: 'e2e82-share-my-booking-no-params-slug',
    action: 'share_my_booking' as const,
  },
  {
    id: 'e2e82-list-provider-reviews-no-params-slug',
    action: 'list_provider_reviews' as const,
  },
  {
    id: 'e2e82-submit-provider-review-no-params-slug',
    action: 'submit_provider_review' as const,
  },
  {
    id: 'e2e82-submit-review-with-token-no-params-slug',
    action: 'submit_review_with_token' as const,
  },
  {
    id: 'e2e82-rebook-last-appointment-no-params-slug',
    action: 'rebook_last_appointment' as const,
  },
  {
    id: 'e2e82-pick-provider-same-as-last-no-params-slug',
    action: 'pick_provider_for_service' as const,
  },
  {
    id: 'e2e82-switch-provider-same-time-no-params-slug',
    action: 'switch_provider_same_time' as const,
  },
  {
    id: 'e2e82-update-my-locale-no-params-slug',
    action: 'update_my_locale' as const,
  },
  {
    id: 'e2e82-update-my-profile-no-params-slug',
    action: 'update_my_profile' as const,
  },
] as const;
