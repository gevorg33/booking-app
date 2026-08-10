/** ai-cmd-provider-5.0.1 / prov-exp-1.4 — provider mobile self-scope package visit list. */

export const PROVIDER_LIST_MY_PACKAGE_VISITS_PROMPT_SCENARIOS = [
  {
    id: 'provider-list-my-package-visits-week-en',
    prompt: 'List my package visits this week',
    surface: 'provider' as const,
    expectedAction: 'list_my_package_visits',
  },
  {
    id: 'provider-list-my-package-visits-show-appointments-en',
    prompt: 'Show my package appointments',
    surface: 'provider' as const,
    expectedAction: 'list_my_package_visits',
  },
  {
    id: 'provider-list-my-package-visits-month-en',
    prompt: 'List package visits for this month',
    surface: 'provider' as const,
    expectedAction: 'list_my_package_visits',
  },
  {
    id: 'provider-list-my-package-visits-bookings-en',
    prompt: 'Show package bookings I have',
    surface: 'provider' as const,
    expectedAction: 'list_my_package_visits',
  },
  {
    id: 'provider-list-my-package-visits-plain-en',
    prompt: 'List my package appointments',
    surface: 'provider' as const,
    expectedAction: 'list_my_package_visits',
  },
  {
    id: 'provider-list-my-package-visits-calendar-en',
    prompt: 'Show package visits on my calendar',
    surface: 'provider' as const,
    expectedAction: 'list_my_package_visits',
  },
  {
    id: 'provider-list-my-package-visits-quarter-en',
    prompt: 'List package bookings this quarter',
    surface: 'provider' as const,
    expectedAction: 'list_my_package_visits',
  },
  {
    id: 'provider-list-my-package-visits-upcoming-en',
    prompt: 'Show my upcoming package visits',
    surface: 'provider' as const,
    expectedAction: 'list_my_package_visits',
  },
  {
    id: 'provider-list-my-package-visits-overall-en',
    prompt: 'List package appointments overall',
    surface: 'provider' as const,
    expectedAction: 'list_my_package_visits',
  },
] as const;
