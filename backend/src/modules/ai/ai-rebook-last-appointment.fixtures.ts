export type RebookLastAppointmentPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'rebook_last_appointment';
  rescueReason: 'rebook_last_appointment';
  serviceName?: string;
};

export const CUSTOMER_REBOOK_LAST_APPOINTMENT_CLASSIFIER_RULES = `- rebook_last_appointment: READ — signed-in customer one-tap rebooks their last completed visit with the same service, provider, and preferred time prefilled. Returns navigate to checkout/book with rebook=1. Triggers: rebook last appointment, book the same as last time, repeat last visit, book same again. Requires sign-in. NOT results_then_rebook (lab results released + follow-up rebook compound), NOT book_appointment|book_nearest_slot (new service/time), NOT list_my_appointments|list_my_upcoming_appointments (list only), NOT reschedule_my_booking (move an upcoming visit), NOT book_another_service (fresh booking after checkout).`;

export const REBOOK_LAST_APPOINTMENT_PROMPTS: readonly RebookLastAppointmentPromptFixture[] =
  [
    {
      id: 'rebook-last-appointment-customer',
      prompt: 'Rebook my last appointment',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'book-same-as-last-time-customer',
      prompt: 'Book the same as last time',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'repeat-last-visit-customer',
      prompt: 'Repeat my last visit',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'rebook-last-haircut-customer',
      prompt: 'Rebook my last haircut',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
      serviceName: 'haircut',
    },
    {
      id: 'book-same-again-customer',
      prompt: 'Book same again',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'same-appointment-last-time-customer',
      prompt: 'Same appointment as last time',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'one-tap-rebook-customer',
      prompt: 'One tap rebook my last booking',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'schedule-same-service-customer',
      prompt: 'Schedule the same service again',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'book-last-visit-again-customer',
      prompt: 'Book my last visit again',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'repeat-last-appointment-customer',
      prompt: 'Repeat last appointment',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'rebook-what-i-had-customer',
      prompt: 'Rebook what I had last time',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'same-service-last-time-customer',
      prompt: 'Book the same service as last time',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
  ];

export const REBOOK_LAST_APPOINTMENT_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-book-appointment',
    prompt: 'Book the same as last time',
    misclassifiedAction: 'book_appointment',
    expectedAction: 'rebook_last_appointment' as const,
  },
  {
    id: 'misclassified-list-appointments',
    prompt: 'Repeat my last visit',
    misclassifiedAction: 'list_my_appointments',
    expectedAction: 'rebook_last_appointment' as const,
  },
  {
    id: 'misclassified-book-another',
    prompt: 'Rebook my last appointment',
    misclassifiedAction: 'book_another_service',
    expectedAction: 'rebook_last_appointment' as const,
  },
  {
    id: 'misclassified-reschedule',
    prompt: 'Book same again',
    misclassifiedAction: 'reschedule_my_booking',
    expectedAction: 'rebook_last_appointment' as const,
  },
];
