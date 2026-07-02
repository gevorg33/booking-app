/** Customer/public classifier rules for named provider selection (ai-cmd-customer-4.11.2). */
export const PICK_PROVIDER_FOR_SERVICE_CLASSIFIER_RULES = `- pick_provider_for_service: MUTATE — pre-select a named specialist (and optional service) and navigate to booking with employeeId prefilled. Triggers: "Book with Anna for color", "Pick Maria for highlights", "I want Alex as my stylist", "Use my usual stylist", "I want the same stylist as last time". Set mode to named_provider when a person is named (providerName, optional serviceName) or same_as_last when reusing the stylist from the customer's last visit (requires sign-in). NOT provider_same_day_multi (named stylist + two services same day); NOT switch_provider_same_time (keep fixed time/slot but different stylist), NOT book_appointment|book_nearest_slot (full slot/date booking), NOT rebook_last_appointment (repeat last visit time+service), NOT explain_provider_specialty (bio/specialty read), NOT explain_any_provider_option (Any stylist picker), NOT check_availability (slot search), NOT recommend_specialists (ranked picks).
- Examples:
  - "Book with Anna for color" → pick_provider_for_service, mode=named_provider, providerName=Anna, serviceName=color
  - "I want Maria as my stylist" → pick_provider_for_service, mode=named_provider, providerName=Maria
  - "I want the same stylist as last time" → pick_provider_for_service, mode=same_as_last
  - "Use my usual stylist" → pick_provider_for_service, mode=same_as_last
  - "Pick James for a haircut" → pick_provider_for_service, mode=named_provider, providerName=James, serviceName=haircut
  - "Book the same as last time" → rebook_last_appointment (NOT pick_provider_for_service)`;

export type PickProviderMode = 'named_provider' | 'same_as_last';

export type PickProviderForServicePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'pick_provider_for_service';
  mode: PickProviderMode;
  providerName?: string;
  serviceName?: string;
  rescueReason: 'pick_provider_for_service';
};

export const PICK_PROVIDER_FOR_SERVICE_PROMPTS: readonly PickProviderForServicePromptFixture[] =
  [
    {
      id: 'book-with-anna-for-color-customer',
      prompt: 'Book with Anna for color',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Anna',
      serviceName: 'color',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'schedule-maria-highlights-customer',
      prompt: 'Schedule with Maria for highlights',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Maria',
      serviceName: 'highlights',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'want-anna-stylist-customer',
      prompt: 'I want Anna as my stylist',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Anna',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'pick-james-haircut-customer',
      prompt: 'Pick James for a haircut',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'James',
      serviceName: 'haircut',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'choose-sophie-balayage-customer',
      prompt: 'Choose Sophie for balayage',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Sophie',
      serviceName: 'balayage',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'prefer-emma-specialist-customer',
      prompt: 'I prefer Emma as my specialist',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Emma',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'same-stylist-last-time-customer',
      prompt: 'I want the same stylist as last time',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'same_as_last',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'usual-stylist-customer',
      prompt: 'Use my usual stylist',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'same_as_last',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'stylist-from-last-visit-customer',
      prompt: 'Book with the stylist from my last visit',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'same_as_last',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'same-specialist-before-customer',
      prompt: 'I want the same specialist I had before',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'same_as_last',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'book-with-anna-color-public',
      prompt: 'Book with Anna for color',
      surface: 'public',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Anna',
      serviceName: 'color',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'pick-maria-highlights-public',
      prompt: 'Pick Maria for highlights',
      surface: 'public',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Maria',
      serviceName: 'highlights',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'want-alex-stylist-public',
      prompt: 'I want Alex as my stylist',
      surface: 'public',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Alex',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'choose-sophie-color-public',
      prompt: 'Choose Sophie for color',
      surface: 'public',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Sophie',
      serviceName: 'color',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'usual-stylist-public',
      prompt: 'Use my usual stylist',
      surface: 'public',
      expectedAction: 'pick_provider_for_service',
      mode: 'same_as_last',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'same-stylist-last-time-public',
      prompt: 'I want the same stylist as last time',
      surface: 'public',
      expectedAction: 'pick_provider_for_service',
      mode: 'same_as_last',
      rescueReason: 'pick_provider_for_service',
    },
  ];

export const PICK_PROVIDER_FOR_SERVICE_RESCUE_SCENARIOS = [
  {
    id: 'rescue-from-book-appointment',
    prompt: 'Book with Anna for color',
    misclassifiedAction: 'book_appointment',
  },
  {
    id: 'rescue-from-explain-provider-specialty',
    prompt: 'Pick Maria for highlights',
    misclassifiedAction: 'explain_provider_specialty',
  },
  {
    id: 'rescue-from-check-availability',
    prompt: 'I want Anna as my stylist',
    misclassifiedAction: 'check_availability',
  },
  {
    id: 'rescue-same-stylist-from-rebook',
    prompt: 'I want the same stylist as last time',
    misclassifiedAction: 'rebook_last_appointment',
  },
] as const;
