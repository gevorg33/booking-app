export type CancelAndRebookCompoundFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  orderedActions: readonly string[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const CANCEL_AND_REBOOK_CLASSIFIER_RULES = `- cancel_and_rebook (compound): customer multi-step cancel upcoming visit + book nearest slot. Decomposes to cancel_my_booking → book_nearest_slot with bookingFirstAvailable=true. Use for "Cancel Friday and book the next available slot", "Cancel my massage tomorrow and book the soonest opening", "Cancel my appointment and schedule nearest slot". Requires cancel cue (cancel my/upcoming visit or cancel + weekday/date) AND book-nearest cue (nearest/soonest/next available). NOT cancel_my_booking alone; NOT reschedule_my_booking (move without rebook); NOT cancel_package_visit_self; NOT cancel_package_rebook_single (package visit cancel + book single service instead); NOT explain_cancel_policy.`;

export const CANCEL_AND_REBOOK_CUSTOMER_PROMPTS: readonly CancelAndRebookCompoundFixture[] =
  [
    {
      id: 'cancel-rebook-friday-nearest-en',
      prompt: 'Cancel Friday and book the next available slot',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-tomorrow-massage-en',
      prompt: "Cancel tomorrow's massage and book the soonest slot",
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { serviceName: 'massage', bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-my-appointment-en',
      prompt: 'Cancel my appointment and book the nearest available slot',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-friday-soonest-en',
      prompt: 'Cancel my booking on Friday and book the soonest opening',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-haircut-then-book-en',
      prompt: 'Cancel my haircut tomorrow then book the next available time',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { serviceName: 'haircut', bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-upcoming-nearest-en',
      prompt: 'Cancel my upcoming visit and book nearest slot',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-saturday-asap-en',
      prompt: 'Cancel Saturday appointment and schedule ASAP nearest slot',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-facial-earliest-en',
      prompt:
        'Cancel the facial I booked for tomorrow and book earliest opening',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { serviceName: 'facial', bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-next-appointment-en',
      prompt: 'Cancel my next appointment and book the soonest slot available',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-monday-nearest-en',
      prompt: 'Cancel Monday and book nearest slot',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-massage-friday-en',
      prompt: 'Cancel my massage on Friday; book the next available slot',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { serviceName: 'massage', bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-it-and-rebook-en',
      prompt:
        "Don't need my visit anymore — cancel it and book the nearest slot",
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
  ];

export const CANCEL_AND_REBOOK_COMPOUND_PROMPTS = [
  ...CANCEL_AND_REBOOK_CUSTOMER_PROMPTS,
] as const;

export const CANCEL_AND_REBOOK_RESCUE_SCENARIOS: readonly CancelAndRebookCompoundFixture[] =
  CANCEL_AND_REBOOK_CUSTOMER_PROMPTS.slice(0, 4).map((row) => ({
    ...row,
    misclassifiedAction: 'cancel_my_booking',
  }));

export const CANCEL_AND_REBOOK_NEGATIVE_PROMPTS = [
  {
    id: 'cancel-only-no-book',
    prompt: 'Cancel my booking',
  },
  {
    id: 'book-only-no-cancel',
    prompt: 'Book the nearest slot tomorrow',
  },
  {
    id: 'reschedule-not-cancel-rebook',
    prompt: 'Reschedule my booking to Friday 3pm',
  },
  {
    id: 'cancel-package-visit',
    prompt: 'Cancel my package visit and book nearest slot',
  },
  {
    id: 'e2e114-dated-cancel-rebook-is-reschedule',
    prompt:
      'cancel my facemassage booking and rebook it for next Friday instead',
  },
] as const;
