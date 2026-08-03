/**
 * e2e-bug.287 — dashboard check-only "is anybody open…" must route to
 * check_providers_for_service (not check_availability). Named "is Gevorg open…"
 * stays check_availability.
 */

export type E2e287AnybodyOpenCheckOnlyCase = {
  id: string;
  prompt: string;
  surface: 'dashboard' | 'customer' | 'public';
  /** Classifier / prior misroute action fed into rescue. */
  fromAction: string;
  expectedAction: string;
  expectRescueReason?: string;
};

/** Indefinite anybody/anyone/who-is-open → check_providers on dashboard/customer. */
export const E2E287_INDEFINITE_CHECK_PROVIDERS: readonly E2e287AnybodyOpenCheckOnlyCase[] =
  [
    {
      id: 'e2e287-anybody-open-swedish',
      prompt: 'is anybody open tomorrow morning for Swedish massage',
      surface: 'dashboard',
      fromAction: 'check_availability',
      expectedAction: 'check_providers_for_service',
      expectRescueReason: 'providers_for_service',
    },
    {
      id: 'e2e287-anyone-free-swedish',
      prompt: 'is anyone free tomorrow morning for Swedish massage',
      surface: 'dashboard',
      fromAction: 'check_availability',
      expectedAction: 'check_providers_for_service',
      expectRescueReason: 'providers_for_service',
    },
    {
      id: 'e2e287-who-is-open-swedish',
      prompt: 'who is open tomorrow morning for Swedish massage',
      surface: 'dashboard',
      fromAction: 'check_availability',
      expectedAction: 'check_providers_for_service',
      expectRescueReason: 'providers_for_service',
    },
    {
      id: 'e2e287-anybody-open-evening',
      prompt: 'is anybody open tomorrow evening for massage',
      surface: 'dashboard',
      fromAction: 'check_availability',
      expectedAction: 'check_providers_for_service',
      expectRescueReason: 'providers_for_service',
    },
    {
      id: 'e2e287-see-who-is-open',
      prompt: 'see who is open tomorrow for facial',
      surface: 'dashboard',
      fromAction: 'check_availability',
      expectedAction: 'check_providers_for_service',
      expectRescueReason: 'providers_for_service',
    },
    {
      id: 'e2e287-anybody-already-providers',
      prompt: 'is anybody open tomorrow morning for Swedish massage',
      surface: 'dashboard',
      fromAction: 'check_providers_for_service',
      expectedAction: 'check_providers_for_service',
    },
    {
      id: 'e2e287-customer-anybody-open',
      prompt: 'is anybody open tomorrow morning for Swedish massage',
      surface: 'customer',
      fromAction: 'check_availability',
      expectedAction: 'check_providers_for_service',
      expectRescueReason: 'providers_for_service',
    },
  ];

/** Named provider / open-times browse stays check_availability. */
export const E2E287_NAMED_CHECK_AVAILABILITY: readonly E2e287AnybodyOpenCheckOnlyCase[] =
  [
    {
      id: 'e2e287-named-gevorg-open',
      prompt: 'is Gevorg open tomorrow morning for Swedish massage',
      surface: 'dashboard',
      fromAction: 'check_availability',
      expectedAction: 'check_availability',
    },
    {
      id: 'e2e287-named-gevorg-from-providers',
      prompt: 'is Gevorg open tomorrow morning for Swedish massage',
      surface: 'dashboard',
      fromAction: 'check_providers_for_service',
      expectedAction: 'check_availability',
      expectRescueReason: 'check_availability_pattern',
    },
    {
      id: 'e2e287-open-times-browse',
      prompt: 'What times are available for Swedish massage tomorrow?',
      surface: 'dashboard',
      fromAction: 'check_availability',
      expectedAction: 'check_availability',
    },
  ];

/** Public surface aliases team-wide checks to check_availability. */
export const E2E287_PUBLIC_CHECK_AVAILABILITY: readonly E2e287AnybodyOpenCheckOnlyCase[] =
  [
    {
      id: 'e2e287-public-from-providers',
      prompt: 'is anybody open tomorrow morning for Swedish massage',
      surface: 'public',
      fromAction: 'check_providers_for_service',
      expectedAction: 'check_availability',
      expectRescueReason: 'public_availability',
    },
  ];
