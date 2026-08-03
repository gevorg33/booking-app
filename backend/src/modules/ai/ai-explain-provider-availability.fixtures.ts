/** Customer/public classifier rules for provider-centric availability (ai-cmd-customer-4.11.3). */
export const EXPLAIN_PROVIDER_AVAILABILITY_CLASSIFIER_RULES = `- explain_provider_availability: READ — explain whether a named specialist is working or has openings on a day, or which providers have openings (thin wrapper on check_availability with provider filter). Triggers: "Is Marco working Saturday?", "Does Anna work tomorrow?", "Who has openings tomorrow?", "Which stylists are available Friday?", "Explain Gevorg availability for Swedish massage next Tuesday", "When is Mariam available this week?". Set aspect to named_schedule when asking if one person is working/in (employeeName) or team_openings when asking who has openings/who is working (allProviders=true). Named "X availability for <service> <day>" stays explain_provider_availability (NOT plain check_availability). NOT find_soonest_appointment (soonest/earliest slot), NOT recommend_specialists (best/top rated), NOT book_appointment|book_nearest_slot (mutate booking), NOT explain_provider_specialty (bio/specialty), NOT pick_provider_for_service (select stylist to book).
- Examples:
  - "Is Marco working Saturday?" → explain_provider_availability, aspect=named_schedule, employeeName=Marco, date=Saturday
  - "Does Anna work tomorrow?" → explain_provider_availability, aspect=named_schedule, employeeName=Anna
  - "Explain Gevorg availability for Swedish massage next Tuesday" → explain_provider_availability, aspect=named_schedule, employeeName=Gevorg, serviceName=Swedish massage
  - "Who has openings tomorrow?" → explain_provider_availability, aspect=team_openings, allProviders=true
  - "Which stylists are available Friday?" → explain_provider_availability, aspect=team_openings
  - "free slots on Monday for Gevorg" → check_availability (NOT explain_provider_availability)
  - "availability for Swedish massage tomorrow" (no named stylist) → check_availability`;

export type ProviderAvailabilityAspect = 'named_schedule' | 'team_openings';

export type ExplainProviderAvailabilityPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_provider_availability';
  aspect: ProviderAvailabilityAspect;
  employeeName?: string;
  rescueReason: 'explain_provider_availability';
};

export const EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS: readonly ExplainProviderAvailabilityPromptFixture[] =
  [
    {
      id: 'is-marco-working-saturday-customer',
      prompt: 'Is Marco working Saturday?',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Marco',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'does-anna-work-tomorrow-customer',
      prompt: 'Does Anna work tomorrow?',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Anna',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'is-james-in-friday-customer',
      prompt: 'Is James in on Friday?',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'James',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'is-sophie-working-monday-customer',
      prompt: 'Is Sophie working Monday?',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Sophie',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'who-has-openings-tomorrow-customer',
      prompt: 'Who has openings tomorrow?',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'team_openings',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'which-stylists-available-friday-customer',
      prompt: 'Which stylists are available Friday?',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'team_openings',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'who-is-working-saturday-customer',
      prompt: 'Who is working Saturday?',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'team_openings',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'which-providers-have-openings-customer',
      prompt: 'Which providers have openings on Friday?',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'team_openings',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'is-marco-working-saturday-public',
      prompt: 'Is Marco working Saturday?',
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Marco',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'does-anna-work-tomorrow-public',
      prompt: 'Does Anna work tomorrow?',
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Anna',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'is-alex-scheduled-tuesday-public',
      prompt: 'Is Alex scheduled on Tuesday?',
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Alex',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'is-maria-on-duty-wednesday-public',
      prompt: 'Is Maria on duty Wednesday?',
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Maria',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'who-has-openings-tomorrow-public',
      prompt: 'Who has openings tomorrow?',
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'team_openings',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'which-stylists-available-friday-public',
      prompt: 'Which stylists are available Friday?',
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'team_openings',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'who-is-working-saturday-public',
      prompt: 'Who is working Saturday?',
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'team_openings',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'which-specialists-have-openings-public',
      prompt: 'Which specialists have openings tonight?',
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'team_openings',
      rescueReason: 'explain_provider_availability',
    },
    // e2e-bug.194 — "Explain X availability for <service> <day>" must not be blocked by "availability for"
    {
      id: 'explain-gevorg-availability-swedish-next-tuesday-public',
      prompt:
        'Explain Gevorg availability for Swedish massage next Tuesday',
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Gevorg',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'explain-gevorg-availability-swedish-next-tuesday-customer',
      prompt:
        'Explain Gevorg availability for Swedish massage next Tuesday',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Gevorg',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'show-gevorg-availability-for-swedish-tomorrow-public',
      prompt: "Show Gevorg's availability for Swedish massage tomorrow",
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Gevorg',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'gevorg-availability-for-facial-friday-customer',
      prompt: 'Gevorg availability for Face Pilling on Friday',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Gevorg',
      rescueReason: 'explain_provider_availability',
    },
  ];

export const EXPLAIN_PROVIDER_AVAILABILITY_RESCUE_SCENARIOS = [
  {
    id: 'rescue-from-check-availability-named',
    prompt: 'Is Marco working Saturday?',
    misclassifiedAction: 'check_availability',
  },
  {
    id: 'rescue-from-check-availability-team',
    prompt: 'Who has openings tomorrow?',
    misclassifiedAction: 'check_availability',
  },
  {
    id: 'rescue-from-recommend-specialists',
    prompt: 'Which stylists are available Friday?',
    misclassifiedAction: 'recommend_specialists',
  },
  {
    id: 'rescue-from-find-soonest',
    prompt: 'Who is working Saturday?',
    misclassifiedAction: 'find_soonest_appointment',
  },
  {
    id: 'rescue-explain-availability-for-from-unknown',
    prompt:
      'Explain Gevorg availability for Swedish massage next Tuesday',
    misclassifiedAction: 'unknown',
  },
] as const;
