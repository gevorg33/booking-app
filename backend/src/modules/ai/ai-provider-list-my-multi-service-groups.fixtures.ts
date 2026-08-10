/** prov-exp-1 / ai-cmd-provider-5.18.1 — provider mobile multi-service groups/blocks on own calendar. */

export const PROVIDER_LIST_MY_MULTI_SERVICE_GROUPS_CLASSIFIER_RULES = `- list_my_multi_service_groups: READ-ONLY — provider-scoped multi-service groups/blocks on own calendar. Triggers: spa day clients today, who has massage + facial, show my multi-service groups, what's on my spa day sequence. NOT list_package_appointments_today (package bundles, not ad-hoc multi-service blocks), NOT list_my_package_visits (broader date range, package-specific).`;

export const PROVIDER_LIST_MY_MULTI_SERVICE_GROUPS_PROMPT_SCENARIOS = [
  {
    id: 'list-my-multi-service-groups-show-today-en',
    prompt: 'Show my multi-service groups today',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-list-en',
    prompt: 'List my multi-service groups',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-appointments-en',
    prompt: 'Show my multi-service appointments',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-blocks-en',
    prompt: 'List my multi-service blocks for today',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-calendar-en',
    prompt: 'Show me my multi-service visits on my calendar',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-spa-day-en',
    prompt: 'Spa day clients today',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-massage-facial-en',
    prompt: 'Who has massage + facial?',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-sequence-en',
    prompt: "What's on my spa day sequence?",
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-back-to-back-en',
    prompt: 'Any back-to-back service bookings today?',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-multiple-services-en',
    prompt: "Who's booked for multiple services today?",
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-hy',
    prompt: 'Ցույց տուր իմ բազմաբնույթ ծառայությունների խմբերը',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-massage-facial-hy',
    prompt: 'Ո՞վ ունի մերսում և դիմահարդարում այսօր',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-ru',
    prompt: 'Покажи мои группы мультиуслуг',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
  {
    id: 'list-my-multi-service-groups-massage-facial-ru',
    prompt: 'У кого массаж и уход за лицом сегодня?',
    surface: 'provider' as const,
    expectedAction: 'list_my_multi_service_groups',
  },
] as const;
