export type ListMyUpcomingAppointmentsScope =
  | 'next'
  | 'this_week'
  | 'all_upcoming';

export type ListMyUpcomingAppointmentsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'list_my_upcoming_appointments';
  scope: ListMyUpcomingAppointmentsScope;
  rescueReason: 'list_upcoming_appointments';
};

export const CUSTOMER_LIST_MY_UPCOMING_APPOINTMENTS_CLASSIFIER_RULES = `- list_my_upcoming_appointments: READ — signed-in customer: list filtered upcoming confirmed visits (next appointment, this week, or all upcoming). Triggers: "What's my next appointment?", "Appointments this week", "Show my upcoming appointments". Set scope to next|this_week|all_upcoming when clear. NOT list_my_appointments (full appointment list without upcoming filter), NOT confirm_my_booking_details (single booking summary), NOT pay_online (pay online / pay with card for an upcoming visit — mutate checkout), NOT cancel_my_booking|reschedule_my_booking (mutate), NOT list_my_package_visits (package bundles).`;

export const LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS: readonly ListMyUpcomingAppointmentsPromptFixture[] =
  [
    {
      id: 'next-appointment-customer',
      prompt: "What's my next appointment?",
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'next',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'appointments-this-week-customer',
      prompt: 'Appointments this week',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'this_week',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'show-upcoming-customer',
      prompt: 'Show my upcoming appointments',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'all_upcoming',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'when-next-visit-customer',
      prompt: 'When is my next visit?',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'next',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'any-this-week-customer',
      prompt: 'Do I have any appointments this week?',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'this_week',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'coming-up-customer',
      prompt: 'What appointments do I have coming up?',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'all_upcoming',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'list-upcoming-customer',
      prompt: 'List my upcoming appointments',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'all_upcoming',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'upcoming-visits-account-customer',
      prompt: 'Show upcoming visits on my account',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'all_upcoming',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'next-booking-customer',
      prompt: "What's my next booking?",
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'next',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'any-appointments-week-customer',
      prompt: 'Any appointments this week?',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'this_week',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'tell-next-appointment-customer',
      prompt: 'Tell me about my next appointment',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'next',
      rescueReason: 'list_upcoming_appointments',
    },
  ];

export const LIST_MY_UPCOMING_APPOINTMENTS_RESCUE_SCENARIOS = [
  {
    id: 'confirm-to-upcoming-next',
    prompt: "What's my next appointment?",
    misclassifiedAction: 'confirm_my_booking_details',
    expectedAction: 'list_my_upcoming_appointments' as const,
  },
  {
    id: 'list-all-to-upcoming',
    prompt: 'List my upcoming appointments',
    misclassifiedAction: 'list_my_appointments',
    expectedAction: 'list_my_upcoming_appointments' as const,
  },
  {
    id: 'this-week-to-upcoming',
    prompt: 'Appointments this week',
    misclassifiedAction: 'unknown',
    expectedAction: 'list_my_upcoming_appointments' as const,
  },
] as const;
