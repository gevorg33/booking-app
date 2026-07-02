export type ShareMyBookingPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'share_my_booking';
  rescueReason: 'share_my_booking';
  bookingId?: string;
};

export const CUSTOMER_SHARE_MY_BOOKING_CLASSIFIER_RULES = `- share_my_booking: READ — signed-in customer: explain how to share a confirmed booking deep link from Account → My bookings (native share sheet). Include booking share reward when enabled. Triggers: "Share my booking", "Share my appointment with my partner", "Send my visit details to a friend". Uses session bookingId when present to highlight which visit to share. NOT get_manage_link (self-service cancel/reschedule URL), NOT share_salon_link (business deep link), NOT refer_a_friend (invite code), NOT explain_share_reward (reward policy overview), NOT confirm_my_booking_details (summary only), NOT add_booking_to_calendar (calendar links).`;

export const SHARE_MY_BOOKING_PROMPTS: readonly ShareMyBookingPromptFixture[] =
  [
    {
      id: 'share-booking-customer',
      prompt: 'Share my booking',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-appointment-partner-customer',
      prompt: 'Share my appointment with my partner',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'send-visit-friend-customer',
      prompt: 'Send my visit details to a friend',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-confirmed-booking-customer',
      prompt: 'How do I share a confirmed booking?',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-this-appointment-customer',
      prompt: 'Share this appointment with someone',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-upcoming-visit-customer',
      prompt: 'Share my upcoming visit',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'send-booking-family-customer',
      prompt: 'Send my booking to my family',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-appointment-link-customer',
      prompt: 'I want to share my appointment link',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-booking-native-customer',
      prompt: 'Use share sheet for my booking',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-massage-appointment-customer',
      prompt: 'Share my massage appointment',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
      bookingId: 'book-1',
    },
    {
      id: 'tell-partner-appointment-customer',
      prompt: 'Help me tell my partner about my appointment',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
  ];

export const SHARE_MY_BOOKING_RESCUE_SCENARIOS = [
  {
    id: 'manage-link-to-share-booking',
    prompt: 'Share my appointment with my partner',
    misclassifiedAction: 'get_manage_link',
    expectedAction: 'share_my_booking' as const,
  },
  {
    id: 'confirm-details-to-share-booking',
    prompt: 'Share my booking',
    misclassifiedAction: 'confirm_my_booking_details',
    expectedAction: 'share_my_booking' as const,
  },
  {
    id: 'share-salon-to-share-booking',
    prompt: 'Share my appointment with my partner',
    misclassifiedAction: 'share_salon_link',
    expectedAction: 'share_my_booking' as const,
  },
  {
    id: 'send-booking-link-not-manage',
    prompt: 'Send my booking link to my partner',
    misclassifiedAction: 'get_manage_link',
    expectedAction: 'share_my_booking' as const,
  },
] as const;
