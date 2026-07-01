export type BookAnotherServicePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'book_another_service';
  rescueReason: 'book_another_service';
  sameDay?: boolean;
  serviceName?: string;
};

export const CUSTOMER_PUBLIC_BOOK_ANOTHER_SERVICE_CLASSIFIER_RULES = `- book_another_service: READ — start a fresh booking flow after checkout success without stale BookPage success state. Returns navigate to services or a named service checkout with freshBook=1 and optional same-day date from the just-finished booking. Triggers: "Book another service", "Book another service same day", "Schedule another appointment today", "Book something else after this booking". NOT explain_consumer_checkout_success (what the success-screen button does), NOT book_appointment|book_nearest_slot (specific service/time booking), NOT rebook_last_appointment (repeat last visit), NOT list_my_appointments.`;

export const BOOK_ANOTHER_SERVICE_PROMPTS: readonly BookAnotherServicePromptFixture[] =
  [
    {
      id: 'book-another-customer',
      prompt: 'Book another service',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
    },
    {
      id: 'book-another-same-day-customer',
      prompt: 'Book another service same day',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'book-another-today-customer',
      prompt: 'I want to book another appointment today',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'schedule-another-after-booking-customer',
      prompt: 'Schedule another service after this booking',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
    },
    {
      id: 'book-something-else-today-customer',
      prompt: 'Book something else for today',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'can-i-book-another-today-customer',
      prompt: 'Can I book another service today?',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'start-another-booking-customer',
      prompt: 'Start another booking after my appointment',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
    },
    {
      id: 'different-service-same-day-customer',
      prompt: 'Book a different service same day',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'another-service-afternoon-customer',
      prompt: 'I would like to book another service this afternoon',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'another-visit-today-customer',
      prompt: 'Book another visit today',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'take-me-book-another-customer',
      prompt: 'Take me to book another service',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
    },
    {
      id: 'book-another-public',
      prompt: 'Book another service',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
    },
    {
      id: 'book-another-same-day-public',
      prompt: 'Book another service same day',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'book-another-today-public',
      prompt: 'I want to book another appointment today',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'schedule-another-after-booking-public',
      prompt: 'Schedule another service after this booking',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
    },
    {
      id: 'book-something-else-today-public',
      prompt: 'Book something else for today',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'can-i-book-another-today-public',
      prompt: 'Can I book another service today?',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'start-another-booking-public',
      prompt: 'Start another booking after my appointment',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
    },
    {
      id: 'different-service-same-day-public',
      prompt: 'Book a different service same day',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'another-service-afternoon-public',
      prompt: 'I would like to book another service this afternoon',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'another-visit-today-public',
      prompt: 'Book another visit today',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'take-me-book-another-public',
      prompt: 'Take me to book another service',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
    },
  ];

export const BOOK_ANOTHER_SERVICE_RESCUE_SCENARIOS = [
  {
    id: 'checkout-success-to-book-another',
    prompt: 'Book another service same day',
    misclassifiedAction: 'explain_consumer_checkout_success',
    expectedAction: 'book_another_service' as const,
  },
  {
    id: 'book-appointment-to-book-another',
    prompt: 'Book another service',
    misclassifiedAction: 'book_appointment',
    expectedAction: 'book_another_service' as const,
  },
] as const;
