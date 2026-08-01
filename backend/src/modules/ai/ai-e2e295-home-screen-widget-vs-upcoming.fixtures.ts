/**
 * e2e-bug.295 — "Add next appointment to home screen" must stay on
 * explain_home_screen_widget, not list_my_upcoming_appointments (NEXT_CUE steal
 * + classified-phase adoption rescue gap from e2e-bug.276).
 */

export const E2E295_WIDGET_FROM_LIST_MISROUTES = [
  {
    id: 'e295-add-next-appointment-home-screen',
    prompt: 'Add next appointment to home screen',
    fromAction: 'list_my_upcoming_appointments',
    expectedAction: 'explain_home_screen_widget' as const,
  },
  {
    id: 'e295-add-my-next-appointment-to-home-screen',
    prompt: 'Add my next appointment to the home screen',
    fromAction: 'list_my_upcoming_appointments',
    expectedAction: 'explain_home_screen_widget' as const,
  },
  {
    id: 'e295-put-next-appointment-on-home-screen',
    prompt: 'Put next appointment on home screen',
    fromAction: 'list_my_upcoming_appointments',
    expectedAction: 'explain_home_screen_widget' as const,
  },
  {
    id: 'e295-how-add-next-appointment-widget',
    prompt: 'How do I add next appointment to the home screen widget?',
    fromAction: 'list_my_upcoming_appointments',
    expectedAction: 'explain_home_screen_widget' as const,
  },
  {
    id: 'e295-show-next-appointment-on-home-screen',
    prompt: 'Show next appointment on home screen',
    fromAction: 'list_my_upcoming_appointments',
    expectedAction: 'explain_home_screen_widget' as const,
  },
  {
    id: 'e295-add-next-visit-home-screen-widget',
    prompt: 'Add next visit to home screen widget',
    fromAction: 'list_my_upcoming_appointments',
    expectedAction: 'explain_home_screen_widget' as const,
  },
] as const;

export const E2E295_UNKNOWN_AND_OTHER_MISROUTES = [
  {
    id: 'e295-from-unknown',
    prompt: 'Add next appointment to home screen',
    fromAction: 'unknown',
    expectedAction: 'explain_home_screen_widget' as const,
  },
  {
    id: 'e295-from-my-appointments',
    prompt: 'Add my next appointment to the home screen',
    fromAction: 'my_appointments',
    expectedAction: 'explain_home_screen_widget' as const,
  },
  {
    id: 'e295-from-confirm-details',
    prompt: 'Add next appointment to home screen',
    fromAction: 'confirm_my_booking_details',
    expectedAction: 'explain_home_screen_widget' as const,
  },
  {
    id: 'e295-add-my-next-not-crm-list',
    prompt: 'Add my next appointment to the home screen',
    fromAction: 'unknown',
    expectedAction: 'explain_home_screen_widget' as const,
  },
] as const;

export const E2E295_LIST_UPCOMING_CONTROLS = [
  {
    id: 'e295-ctrl-whats-my-next',
    prompt: "What's my next appointment?",
    expectedAction: 'list_my_upcoming_appointments' as const,
  },
  {
    id: 'e295-ctrl-show-upcoming',
    prompt: 'Show my upcoming appointments',
    expectedAction: 'list_my_upcoming_appointments' as const,
  },
  {
    id: 'e295-ctrl-list-upcoming',
    prompt: 'List my upcoming appointments',
    expectedAction: 'list_my_upcoming_appointments' as const,
  },
] as const;

export const E2E295_HOME_TAB_NO_STEAL = [
  {
    id: 'e295-ctrl-home-tab',
    prompt: 'How do I use the Home tab?',
    mustNotBeWidget: true,
  },
] as const;

export const E2E295_SURFACES = ['customer', 'public'] as const;
