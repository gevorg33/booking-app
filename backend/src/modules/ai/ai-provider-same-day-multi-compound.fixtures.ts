export type ProviderSameDayMultiCompoundFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  orderedActions: readonly string[];
  providerName?: string;
  serviceNames?: string[];
  timeOfDay?: string;
  misclassifiedAction?: string;
};

export const PROVIDER_SAME_DAY_MULTI_STEP_ACTIONS = [
  'pick_provider_for_service',
  'check_multi_service_availability',
  'book_multi_service',
] as const;

export const PROVIDER_SAME_DAY_MULTI_CLASSIFIER_RULES = `- provider_same_day_multi (compound): customer multi-step named-provider + same-day multi-service block — decomposes to pick_provider_for_service → check_multi_service_availability → book_multi_service with shared providerName, serviceNames (≥2), and same-day/time window (same afternoon/day/morning/evening). Triggers: Anna|Maria|named stylist + massage and facial + same afternoon/day. Example: "Anna — massage and facial same afternoon", "Book with Maria — haircut and color same day", "With James — manicure and pedicure same morning". NOT pick_provider_for_service alone (single service), NOT multi_service_day (no named provider), NOT book_multi_service alone, NOT switch_provider_same_time.`;

export const PROVIDER_SAME_DAY_MULTI_EN_PROMPTS = [
  {
    id: 'anna-massage-facial-afternoon',
    prompt: 'Anna — massage and facial same afternoon',
    providerName: 'Anna',
    serviceNames: ['massage', 'facial'],
    timeOfDay: 'afternoon',
  },
  {
    id: 'maria-haircut-color-same-day',
    prompt: 'Book with Maria — haircut and color same day',
    providerName: 'Maria',
    serviceNames: ['haircut', 'color'],
  },
  {
    id: 'james-manicure-pedicure-morning',
    prompt: 'With James — manicure and pedicure same morning',
    providerName: 'James',
    serviceNames: ['manicure', 'pedicure'],
    timeOfDay: 'morning',
  },
  {
    id: 'alex-color-blowdry-afternoon',
    prompt: 'Alex — color and blowdry same afternoon',
    providerName: 'Alex',
    serviceNames: ['color', 'blowdry'],
    timeOfDay: 'afternoon',
  },
  {
    id: 'sophia-facial-peel-same-visit',
    prompt: 'Sophia for facial and peel same visit',
    providerName: 'Sophia',
    serviceNames: ['facial', 'peel'],
  },
  {
    id: 'emma-massage-body-scrub-day',
    prompt: 'Emma — massage and body scrub same day',
    providerName: 'Emma',
    serviceNames: ['massage', 'body scrub'],
  },
  {
    id: 'liam-haircut-beard-same-afternoon',
    prompt: 'Book with Liam — haircut and beard trim same afternoon',
    providerName: 'Liam',
    serviceNames: ['haircut', 'beard trim'],
    timeOfDay: 'afternoon',
  },
  {
    id: 'olivia-wax-facial-evening',
    prompt: 'Olivia — wax and facial same evening',
    providerName: 'Olivia',
    serviceNames: ['wax', 'facial'],
    timeOfDay: 'evening',
  },
  {
    id: 'noah-deep-tissue-swedish-afternoon',
    prompt: 'Noah for deep tissue and Swedish massage same afternoon',
    providerName: 'Noah',
    serviceNames: ['deep tissue', 'Swedish massage'],
    timeOfDay: 'afternoon',
  },
  {
    id: 'ava-massage-facial-block',
    prompt: 'Ava — massage and facial same afternoon block',
    providerName: 'Ava',
    serviceNames: ['massage', 'facial'],
    timeOfDay: 'afternoon',
  },
] as const;

function buildProviderSameDayMultiPrompts(): ProviderSameDayMultiCompoundFixture[] {
  return PROVIDER_SAME_DAY_MULTI_EN_PROMPTS.map((entry) => ({
    id: `${entry.id}-customer`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    orderedActions: PROVIDER_SAME_DAY_MULTI_STEP_ACTIONS,
    providerName: entry.providerName,
    serviceNames: [...entry.serviceNames],
    ...('timeOfDay' in entry && entry.timeOfDay
      ? { timeOfDay: entry.timeOfDay }
      : {}),
  }));
}

export const PROVIDER_SAME_DAY_MULTI_COMPOUND_PROMPTS: readonly ProviderSameDayMultiCompoundFixture[] =
  buildProviderSameDayMultiPrompts();

export const PROVIDER_SAME_DAY_MULTI_RESCUE_SCENARIOS: readonly ProviderSameDayMultiCompoundFixture[] =
  [
    {
      id: 'pick-provider-to-compound',
      prompt: 'Anna — massage and facial same afternoon',
      surface: 'customer',
      orderedActions: [...PROVIDER_SAME_DAY_MULTI_STEP_ACTIONS],
      misclassifiedAction: 'pick_provider_for_service',
    },
    {
      id: 'multi-service-day-to-compound',
      prompt: 'Book with Maria — haircut and color same day',
      surface: 'customer',
      orderedActions: [...PROVIDER_SAME_DAY_MULTI_STEP_ACTIONS],
      misclassifiedAction: 'book_multi_service',
    },
    {
      id: 'check-multi-to-compound',
      prompt: 'With James — manicure and pedicure same morning',
      surface: 'customer',
      orderedActions: [...PROVIDER_SAME_DAY_MULTI_STEP_ACTIONS],
      misclassifiedAction: 'check_multi_service_availability',
    },
    {
      id: 'multi-day-to-compound',
      prompt: 'Alex — color and blowdry same afternoon',
      surface: 'customer',
      orderedActions: [...PROVIDER_SAME_DAY_MULTI_STEP_ACTIONS],
      misclassifiedAction: 'add_services_to_cart',
    },
  ];

export const PROVIDER_SAME_DAY_MULTI_NEGATIVE_PROMPTS = [
  {
    id: 'pick-provider-single-service',
    prompt: 'Book with Anna for color',
  },
  {
    id: 'multi-service-no-provider',
    prompt: 'Massage and facial same afternoon — find a time',
  },
  {
    id: 'provider-no-multi-service',
    prompt: 'I want Maria as my stylist',
  },
] as const;
