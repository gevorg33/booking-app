/** Customer/public classifier rules for same-slot provider switch (ai-cmd-customer-4.11.4). */
export const SWITCH_PROVIDER_SAME_TIME_CLASSIFIER_RULES = `- switch_provider_same_time: MUTATE — keep the selected appointment time/slot but switch to a different stylist (or a named stylist) and re-run availability for that slot block. Triggers: "Keep 3pm but different stylist", "Same time with Maria instead", "Keep my slot but switch stylist", "Switch to Anna but keep 3pm". Set mode to keep_time_any_provider when no target person is named or keep_time_named_provider when switching to a named stylist (providerName). Requires serviceId and date from session or prompt; timeSlot from prompt or session startTime. NOT pick_provider_for_service (provider pick without keeping a fixed slot), NOT reschedule_my_booking (move date/time), NOT change_provider_on_reschedule (reschedule flow only), NOT check_availability (read-only slot search), NOT book_appointment (fresh booking without keep-time cue).
- Examples:
  - "Keep 3pm but different stylist" → switch_provider_same_time, mode=keep_time_any_provider, timeSlot=15:00
  - "Same time but a different provider" → switch_provider_same_time, mode=keep_time_any_provider
  - "Keep 3pm but switch to Anna" → switch_provider_same_time, mode=keep_time_named_provider, providerName=Anna, timeSlot=15:00
  - "Same time with Maria instead" → switch_provider_same_time, mode=keep_time_named_provider, providerName=Maria
  - "Book with Anna for color" → pick_provider_for_service (NOT switch_provider_same_time)
  - "Reschedule my booking to Friday" → reschedule_my_booking (NOT switch_provider_same_time)`;

export type SwitchProviderSameTimeMode =
  | 'keep_time_any_provider'
  | 'keep_time_named_provider';

export type SwitchProviderSameTimePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'switch_provider_same_time';
  mode: SwitchProviderSameTimeMode;
  timeSlot?: string;
  providerName?: string;
  rescueReason: 'switch_provider_same_time';
};

export const SWITCH_PROVIDER_SAME_TIME_PROMPTS: readonly SwitchProviderSameTimePromptFixture[] =
  [
    {
      id: 'keep-3pm-different-stylist-customer',
      prompt: 'Keep 3pm but different stylist',
      surface: 'customer',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      timeSlot: '15:00',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'same-time-another-provider-customer',
      prompt: 'Same time but a different provider',
      surface: 'customer',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'keep-slot-switch-stylist-customer',
      prompt: 'Keep my slot but switch stylist',
      surface: 'customer',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'different-stylist-same-time-customer',
      prompt: 'I want a different stylist at the same time',
      surface: 'customer',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'keep-3pm-switch-anna-customer',
      prompt: 'Keep 3pm but switch to Anna',
      surface: 'customer',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_named_provider',
      providerName: 'Anna',
      timeSlot: '15:00',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'same-time-maria-instead-customer',
      prompt: 'Same time with Maria instead',
      surface: 'customer',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_named_provider',
      providerName: 'Maria',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'keep-appointment-change-stylist-customer',
      prompt: 'Keep my appointment time but change stylist',
      surface: 'customer',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'switch-stylist-keep-3pm-customer',
      prompt: 'Switch stylist but keep 3pm',
      surface: 'customer',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      timeSlot: '15:00',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'keep-3pm-different-stylist-public',
      prompt: 'Keep 3pm but different stylist',
      surface: 'public',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      timeSlot: '15:00',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'same-time-another-provider-public',
      prompt: 'Same time but a different provider',
      surface: 'public',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'keep-slot-switch-stylist-public',
      prompt: 'Keep my slot but switch stylist',
      surface: 'public',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'different-stylist-same-time-public',
      prompt: 'I want a different stylist at the same time',
      surface: 'public',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'keep-3pm-switch-anna-public',
      prompt: 'Keep 3pm but switch to Anna',
      surface: 'public',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_named_provider',
      providerName: 'Anna',
      timeSlot: '15:00',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'same-time-maria-instead-public',
      prompt: 'Same time with Maria instead',
      surface: 'public',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_named_provider',
      providerName: 'Maria',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'keep-appointment-change-stylist-public',
      prompt: 'Keep my appointment time but change stylist',
      surface: 'public',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      rescueReason: 'switch_provider_same_time',
    },
    {
      id: 'switch-stylist-keep-3pm-public',
      prompt: 'Switch stylist but keep 3pm',
      surface: 'public',
      expectedAction: 'switch_provider_same_time',
      mode: 'keep_time_any_provider',
      timeSlot: '15:00',
      rescueReason: 'switch_provider_same_time',
    },
  ];

export const SWITCH_PROVIDER_SAME_TIME_RESCUE_SCENARIOS = [
  {
    id: 'rescue-from-book-appointment',
    prompt: 'Keep 3pm but different stylist',
    misclassifiedAction: 'book_appointment',
  },
  {
    id: 'rescue-from-pick-provider',
    prompt: 'Same time with Maria instead',
    misclassifiedAction: 'pick_provider_for_service',
  },
  {
    id: 'rescue-from-check-availability',
    prompt: 'Keep my slot but switch stylist',
    misclassifiedAction: 'check_availability',
  },
  {
    id: 'rescue-from-reschedule',
    prompt: 'Switch stylist but keep 3pm',
    misclassifiedAction: 'reschedule_my_booking',
  },
] as const;
