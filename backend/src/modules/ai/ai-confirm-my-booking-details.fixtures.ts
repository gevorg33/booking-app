export type ConfirmMyBookingDetailsAspect =
  | 'time'
  | 'service'
  | 'provider'
  | 'status'
  | 'location'
  | 'all';

export type ConfirmMyBookingDetailsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'confirm_my_booking_details';
  aspect: ConfirmMyBookingDetailsAspect;
  rescueReason: 'confirm_booking_details';
  serviceName?: string;
};

export const CONFIRM_MY_BOOKING_DETAILS_PROMPTS: readonly ConfirmMyBookingDetailsPromptFixture[] =
  [
    {
      id: 'what-time-customer',
      prompt: 'What time is my appointment?',
      surface: 'customer',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'time',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'when-is-booking-customer',
      prompt: 'When is my booking?',
      surface: 'customer',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'time',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'summarize-booking-customer',
      prompt: 'Summarize my booking',
      surface: 'customer',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'all',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'appointment-details-customer',
      prompt: 'What are my appointment details?',
      surface: 'customer',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'all',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'who-is-provider-customer',
      prompt: 'Who is my appointment with?',
      surface: 'customer',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'provider',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'what-service-customer',
      prompt: 'What service did I book?',
      surface: 'customer',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'service',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'confirm-details-customer',
      prompt: 'Confirm my booking details',
      surface: 'customer',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'all',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'tomorrow-massage-time-customer',
      prompt: 'What time is my massage tomorrow?',
      surface: 'customer',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'time',
      rescueReason: 'confirm_booking_details',
      serviceName: 'massage',
    },
    {
      id: 'this-booking-customer',
      prompt: 'Tell me about this booking',
      surface: 'customer',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'all',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'status-customer',
      prompt: 'Is my appointment confirmed?',
      surface: 'customer',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'status',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'where-salon-customer',
      prompt: 'Where is my appointment?',
      surface: 'customer',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'location',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'what-time-public',
      prompt: 'What time is my appointment?',
      surface: 'public',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'time',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'summarize-booking-public',
      prompt: 'Summarize my booking',
      surface: 'public',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'all',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'appointment-details-public',
      prompt: 'Show my appointment details',
      surface: 'public',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'all',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'who-is-provider-public',
      prompt: 'Who am I booked with?',
      surface: 'public',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'provider',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'what-service-public',
      prompt: 'Which service is my booking for?',
      surface: 'public',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'service',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'confirm-details-public',
      prompt: 'Confirm my booking details',
      surface: 'public',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'all',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'just-booked-public',
      prompt: 'What did I just book?',
      surface: 'public',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'all',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'when-is-booking-public',
      prompt: 'When is my upcoming appointment?',
      surface: 'public',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'time',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'status-public',
      prompt: 'Did my booking go through?',
      surface: 'public',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'status',
      rescueReason: 'confirm_booking_details',
    },
    {
      id: 'this-appointment-public',
      prompt: 'Details for this appointment',
      surface: 'public',
      expectedAction: 'confirm_my_booking_details',
      aspect: 'all',
      rescueReason: 'confirm_booking_details',
    },
  ] as const;

export const CONFIRM_MY_BOOKING_DETAILS_RESCUE_SCENARIOS = [
  {
    id: 'list-to-confirm-details',
    prompt: 'What time is my appointment?',
    misclassifiedAction: 'list_my_appointments',
    expectedAction: 'confirm_my_booking_details',
  },
  {
    id: 'unknown-to-confirm-details',
    prompt: 'Summarize my booking',
    misclassifiedAction: 'unknown',
    expectedAction: 'confirm_my_booking_details',
  },
  {
    id: 'checkout-success-to-confirm-details',
    prompt: 'What did I just book?',
    misclassifiedAction: 'explain_consumer_checkout_success',
    expectedAction: 'confirm_my_booking_details',
  },
] as const;
