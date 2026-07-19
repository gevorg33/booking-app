export type CancelAllUpcomingBookingsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'cancel_all_upcoming_bookings';
  rescueReason: 'cancel_all_upcoming_bookings';
};

export const CUSTOMER_CANCEL_ALL_UPCOMING_BOOKINGS_CLASSIFIER_RULES = `- cancel_all_upcoming_bookings: MUTATE — logged-in customer cancels ALL of their upcoming confirmed bookings at once, not a single booking. Triggers: "Cancel all my upcoming appointments", "Cancel all my bookings", "Cancel every visit I have". Two-step confirm flow: never set confirm=true on the first ask — the assistant previews the affected bookings and asks the customer to confirm. On the follow-up turn, when the customer replies "yes" / "yes, cancel them all" / "confirm" / "go ahead" after that preview, set params.confirm=true (and keep action cancel_all_upcoming_bookings). NOT cancel_my_booking (single named/most-recent booking — "cancel my booking"/"cancel my appointment" without "all"/"every").`;

export const CANCEL_ALL_UPCOMING_BOOKINGS_PROMPTS: readonly CancelAllUpcomingBookingsPromptFixture[] =
  [
    {
      id: 'cancel-all-upcoming-appointments',
      prompt: 'Cancel all my upcoming appointments',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-all-my-bookings',
      prompt: 'Cancel all my bookings',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-every-upcoming-visit',
      prompt: 'Cancel every upcoming visit',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-all-reservations',
      prompt: 'I want to cancel all my reservations',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-every-appointment-i-have',
      prompt: 'Cancel every appointment I have',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-all-my-visits',
      prompt: 'Cancel all my visits',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'please-cancel-all-bookings',
      prompt: 'Please cancel all of my bookings',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-every-booking-scheduled',
      prompt: 'Cancel every booking I have scheduled',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'i-need-to-cancel-all-appointments',
      prompt: 'I need to cancel all my appointments',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-all-upcoming-reservations',
      prompt: 'Cancel all upcoming reservations on my account',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-everything-i-have-booked',
      prompt: 'Cancel every visit I have booked',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
  ];
