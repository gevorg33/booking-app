/**
 * e2e-bug.278 — recommend / who-is-best + day-part must stay on
 * recommend_specialists (not check_providers_for_service / check_availability).
 */

export type E2e278DetectionCase = {
  id: string;
  prompt: string;
  expectProviderRank: boolean;
  expectRecommendSpecialists: boolean;
  expectSubjective: boolean;
};

export type E2e278RescueCase = {
  id: string;
  prompt: string;
  fromAction: string;
  expectedAction: 'recommend_specialists';
  rescueReason: 'rank_provider_specialists';
  serviceCategory: string;
};

export type E2e278NegativeCase = {
  id: string;
  prompt: string;
  expectProviderRank: boolean;
};

/** Detection edge cases (guru QA corpus). */
export const E2E278_DETECTION_CASES: readonly E2e278DetectionCase[] = [
  {
    id: 'e2e278-detect-who-recommend-massage-tomorrow',
    prompt: 'Who do you recommend for a massage tomorrow?',
    expectProviderRank: true,
    expectRecommendSpecialists: true,
    expectSubjective: false,
  },
  {
    id: 'e2e278-detect-who-is-best-massage-tonight',
    prompt: 'Who is best for massage tonight?',
    expectProviderRank: true,
    expectRecommendSpecialists: true,
    expectSubjective: false,
  },
  {
    id: 'e2e278-detect-recommend-someone-evening',
    prompt: 'recommend someone for massage this evening',
    expectProviderRank: true,
    expectRecommendSpecialists: true,
    expectSubjective: false,
  },
  {
    id: 'e2e278-detect-who-recommend-bare',
    prompt: 'Who do you recommend for a massage?',
    expectProviderRank: true,
    expectRecommendSpecialists: true,
    expectSubjective: false,
  },
  {
    id: 'e2e278-detect-best-rated-this-week',
    prompt: 'best rated specialists for massage this week',
    expectProviderRank: true,
    expectRecommendSpecialists: true,
    expectSubjective: false,
  },
  {
    id: 'e2e278-detect-suggest-someone-haircut-tomorrow',
    prompt: 'suggest someone for a haircut tomorrow',
    expectProviderRank: true,
    expectRecommendSpecialists: true,
    expectSubjective: false,
  },
  {
    id: 'e2e278-detect-who-is-the-best-color-tonight',
    prompt: 'Who is the best for color tonight?',
    expectProviderRank: true,
    expectRecommendSpecialists: true,
    expectSubjective: false,
  },
  {
    id: 'e2e278-detect-subjective-first-time-control',
    prompt: "What's the best option for a first-time haircut?",
    expectProviderRank: false,
    expectRecommendSpecialists: false,
    expectSubjective: true,
  },
];

/** Rescue from availability / provider-check misroutes. */
export const E2E278_RESCUE_CASES: readonly E2e278RescueCase[] = [
  {
    id: 'e2e278-rescue-recommend-tomorrow-from-check-providers',
    prompt: 'Who do you recommend for a massage tomorrow?',
    fromAction: 'check_providers_for_service',
    expectedAction: 'recommend_specialists',
    rescueReason: 'rank_provider_specialists',
    serviceCategory: 'massage',
  },
  {
    id: 'e2e278-rescue-who-is-best-tonight-from-check-providers',
    prompt: 'Who is best for massage tonight?',
    fromAction: 'check_providers_for_service',
    expectedAction: 'recommend_specialists',
    rescueReason: 'rank_provider_specialists',
    serviceCategory: 'massage',
  },
  {
    id: 'e2e278-rescue-recommend-someone-evening-from-check-availability',
    prompt: 'recommend someone for massage this evening',
    fromAction: 'check_availability',
    expectedAction: 'recommend_specialists',
    rescueReason: 'rank_provider_specialists',
    serviceCategory: 'massage',
  },
  {
    id: 'e2e278-rescue-recommend-someone-evening-from-check-providers',
    prompt: 'recommend someone for massage this evening',
    fromAction: 'check_providers_for_service',
    expectedAction: 'recommend_specialists',
    rescueReason: 'rank_provider_specialists',
    serviceCategory: 'massage',
  },
  {
    id: 'e2e278-rescue-who-recommend-from-unknown',
    prompt: 'Who do you recommend for a massage tomorrow?',
    fromAction: 'unknown',
    expectedAction: 'recommend_specialists',
    rescueReason: 'rank_provider_specialists',
    serviceCategory: 'massage',
  },
  {
    id: 'e2e278-rescue-who-recommend-from-list-services',
    prompt: 'Who do you recommend for a massage tomorrow?',
    fromAction: 'list_services',
    expectedAction: 'recommend_specialists',
    rescueReason: 'rank_provider_specialists',
    serviceCategory: 'massage',
  },
];

/** Plain availability must NOT become recommend_specialists. */
export const E2E278_NEGATIVE_CASES: readonly E2e278NegativeCase[] = [
  {
    id: 'e2e278-neg-who-available-this-week',
    prompt: 'Who is available for massage this week?',
    expectProviderRank: false,
  },
  {
    id: 'e2e278-neg-who-is-free-tonight',
    prompt: 'who is free tomorrow evening for lashes',
    expectProviderRank: false,
  },
  {
    id: 'e2e278-neg-is-gevorg-available',
    prompt: 'is Gevorg available for massage tomorrow at 09:00',
    expectProviderRank: false,
  },
];
