/** prov-exp-1 / ai-cmd-provider-5.10.7 — provider mobile: what actions are available from a new-booking push. */

export const PROVIDER_NEW_BOOKING_PUSH_ACTIONS_CLASSIFIER_RULES = `- new_booking_push_actions: READ — list what a provider can do from a new-booking push notification (confirm / reschedule / mark paid menu). Triggers: what can I do from a new booking push, what actions are on the new booking push, what buttons does the new booking push have. NOT confirm_booking_from_push (actually performs the confirm action), NOT explain_last_push (explains the alert content, not the available actions).`;

export const PROVIDER_NEW_BOOKING_PUSH_ACTIONS_PROMPT_SCENARIOS = [
  {
    id: 'new-booking-push-actions-what-can-i-do-en',
    prompt: 'What can I do from a new booking push?',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-what-actions-en',
    prompt: 'What actions are on the new booking push?',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-buttons-en',
    prompt: 'Show me the buttons on this booking push',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-what-options-en',
    prompt: 'What options do I have on the new booking push?',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-generic-en',
    prompt: 'New booking push actions',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-what-can-i-do-the-en',
    prompt: 'What can I do from the booking push?',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-confirm-reschedule-en',
    prompt: 'Confirm or reschedule options on this booking push',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-what-buttons-en',
    prompt: 'What buttons does the new booking push have?',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-mark-paid-confirm-en',
    prompt: 'Confirm or collect payment options on this booking push',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-what-can-i-do-a-en',
    prompt: 'What can I do from a booking push?',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-hy',
    prompt: 'Ի՞նչ կարող եմ անել նոր booking push-ից',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-show-hy',
    prompt: 'Ցուցադրիր booking push-ի actions-ը',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-ru',
    prompt: 'Какие actions доступны для нового booking push?',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
  {
    id: 'new-booking-push-actions-show-ru',
    prompt: 'Покажи actions для booking push',
    surface: 'provider' as const,
    expectedAction: 'new_booking_push_actions',
  },
] as const;
