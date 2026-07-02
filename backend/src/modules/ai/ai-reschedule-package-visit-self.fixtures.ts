export type ReschedulePackageVisitSelfPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'reschedule_package_visit_self';
  rescueReason: 'reschedule_package_self';
  packageName?: string;
  date?: string;
  timeSlot?: string;
  visitIndex?: number;
};

export const CUSTOMER_RESCHEDULE_PACKAGE_VISIT_SELF_CLASSIFIER_RULES = `- reschedule_package_visit_self: MUTATE — logged-in customer moves a scheduled package visit to a new date/time block. Triggers: reschedule|move|change|shift + my package visit/spa day; move package visit 3 to next week; reschedule visit 2 of my package to Friday. Optional packageName, visitIndex, bookingId, date/timeSlot or lines for multi-appointment package blocks. Uses POST /me/bookings/:id/package/reschedule. NOT reschedule_my_booking (single appointment), NOT reschedule_package_visit (staff dashboard), NOT book_package (new package purchase), NOT cancel_package_visit_self (cancel one visit), NOT explain_package_visit_rules (read bundle terms).`;

export const RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS: readonly ReschedulePackageVisitSelfPromptFixture[] =
  [
    {
      id: 'reschedule-my-spa-day-customer',
      prompt: 'Reschedule my spa day',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'reschedule-my-package-visit-customer',
      prompt: 'Reschedule my package visit',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'move-package-visit-3-next-week-customer',
      prompt: 'Move package visit 3 to next week',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      visitIndex: 3,
    },
    {
      id: 'change-package-appointment-tomorrow-customer',
      prompt: 'Change my package appointment to tomorrow',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'move-spa-day-friday-2pm-customer',
      prompt: 'Move my spa day package visit to Friday 2pm',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      packageName: 'Spa Day',
      date: 'friday',
      timeSlot: '14:00',
    },
    {
      id: 'reschedule-visit-2-next-friday-customer',
      prompt: 'Reschedule visit 2 of my package to next Friday',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      visitIndex: 2,
    },
    {
      id: 'shift-package-visit-tomorrow-customer',
      prompt: 'Shift my package visit to tomorrow',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'move-spa-day-next-week-customer',
      prompt: 'Move my spa day to next week',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'change-package-visit-1-friday-customer',
      prompt: 'Change package visit 1 to Friday afternoon',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      visitIndex: 1,
    },
    {
      id: 'reschedule-this-package-visit-customer',
      prompt: 'Reschedule this package visit',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'move-upcoming-package-visit-saturday-customer',
      prompt: 'Move my upcoming package visit to Saturday',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'reschedule-spa-day-march-15-customer',
      prompt: 'Reschedule my spa day package to March 15 at 10am',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      packageName: 'Spa Day',
    },
  ];

/** Blocks reschedule_my_booking when the user means a package bundle visit. */
export const RESCHEDULE_PACKAGE_VISIT_SELF_BLOCK = new RegExp(
  String.raw`\b(?:reschedule|move|change|shift)\b.{0,24}\b(?:my|this|upcoming)\b.{0,24}\b(?:package\s+visit|spa\s+day|package\s+appointment|package\s+bundle)\b|\b(?:reschedule|move|change)\b.{0,16}\bpackage\s+visit\s+\d+\b|\bpackage\s+visit\s+\d+\s+to\b|(?:վերամրագր|փոխել).{0,20}(?:package\s+visit|spa\s+day)|(?:перенес|перенести|измен).{0,20}(?:пакетн|spa\s+day)`,
  'iu',
);

export const RESCHEDULE_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS = [
  {
    id: 'reschedule-my-booking-to-package-visit',
    prompt: 'Reschedule my package visit',
    misclassifiedAction: 'reschedule_my_booking',
    expectedAction: 'reschedule_package_visit_self' as const,
  },
  {
    id: 'unknown-to-reschedule-package-visit',
    prompt: 'Move package visit 3 to next week',
    misclassifiedAction: 'unknown',
    expectedAction: 'reschedule_package_visit_self' as const,
  },
  {
    id: 'cancel-to-reschedule-package-visit',
    prompt: 'Move my spa day to next week',
    misclassifiedAction: 'cancel_package_visit_self',
    expectedAction: 'reschedule_package_visit_self' as const,
  },
  {
    id: 'staff-reschedule-to-self',
    prompt: 'Reschedule my spa day package visit',
    misclassifiedAction: 'reschedule_package_visit',
    expectedAction: 'reschedule_package_visit_self' as const,
  },
];
