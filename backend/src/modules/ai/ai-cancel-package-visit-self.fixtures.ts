export type CancelPackageVisitSelfPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'cancel_package_visit_self';
  rescueReason: 'cancel_package_self';
  packageName?: string;
  visitIndex?: number;
};

export const CUSTOMER_CANCEL_PACKAGE_VISIT_SELF_CLASSIFIER_RULES = `- cancel_package_visit_self: MUTATE — logged-in customer cancels one visit within a purchased service package (spa day / multi-visit bundle). Triggers: cancel|skip + my package visit/spa day/package appointment; cancel visit 2 of my package; skip next package appointment. Uses POST /me/bookings/:id/package/cancel. Optional packageName, visitIndex, bookingId. NOT cancel_package_rebook_single (cancel package visit + book single service instead compound); NOT cancel_my_booking (single appointment), NOT cancel_package_visit (staff dashboard for named customer), NOT cancel_bookings (staff bulk), NOT remove_service_from_cart (drop service from cart), NOT explain_cancel_policy (read policy), NOT explain_package_visit_rules (read bundle terms).`;

export const CANCEL_PACKAGE_VISIT_SELF_PROMPTS: readonly CancelPackageVisitSelfPromptFixture[] =
  [
    {
      id: 'cancel-my-package-visit-customer',
      prompt: 'Cancel my package visit',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'cancel-spa-day-package-visit-customer',
      prompt: 'Cancel my spa day package visit',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'cancel-visit-2-of-package-customer',
      prompt: 'Cancel visit 2 of my package',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      visitIndex: 2,
    },
    {
      id: 'skip-next-package-appointment-customer',
      prompt: 'Skip next package appointment',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'cancel-my-package-appointment-customer',
      prompt: 'Cancel my package appointment',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'need-cancel-spa-day-customer',
      prompt: 'I need to cancel my spa day',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'cancel-upcoming-package-visit-customer',
      prompt: 'Cancel my upcoming package visit',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'cancel-this-package-visit-customer',
      prompt: 'Cancel this package visit',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'cancel-visit-3-spa-day-bundle-customer',
      prompt: 'Cancel visit 3 on my spa day bundle',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      visitIndex: 3,
      packageName: 'Spa Day',
    },
    {
      id: 'cancel-my-spa-day-customer',
      prompt: 'Cancel my spa day',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'skip-next-package-visit-customer',
      prompt: 'Skip my next package visit',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'cancel-deluxe-spa-package-visit-customer',
      prompt: 'Cancel visit 1 of my "Deluxe Spa" package',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      visitIndex: 1,
      packageName: 'Deluxe Spa',
    },
  ];

/** Blocks cancel_my_booking when the user means a package bundle visit. */
export const CANCEL_PACKAGE_VISIT_SELF_BLOCK = new RegExp(
  String.raw`\b(?:cancel|skip)\b.{0,24}\b(?:my|this|next|upcoming)\b.{0,24}\b(?:package\s+visit|spa\s+day|package\s+appointment|package\s+bundle)\b|\b(?:cancel|skip)\b.{0,16}\bvisit\s+\d+\s+(?:of|on)\s+my\b|\bvisit\s+\d+\s+of\s+my\s+["']?[\w\s]+["']?\s+package\b|(?:չեղարկ|չեղարկել).{0,20}(?:package\s+visit|spa\s+day)|(?:отмен|отменить).{0,20}(?:пакетн|spa\s+day)`,
  'iu',
);

export const CANCEL_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS = [
  {
    id: 'cancel-my-booking-to-package-visit',
    prompt: 'Cancel my package visit',
    misclassifiedAction: 'cancel_my_booking',
    expectedAction: 'cancel_package_visit_self' as const,
  },
  {
    id: 'unknown-to-cancel-package-visit',
    prompt: 'Skip next package appointment',
    misclassifiedAction: 'unknown',
    expectedAction: 'cancel_package_visit_self' as const,
  },
  {
    id: 'list-package-to-cancel-visit',
    prompt: 'Cancel visit 2 of my package',
    misclassifiedAction: 'list_my_package_visits',
    expectedAction: 'cancel_package_visit_self' as const,
  },
  {
    id: 'staff-cancel-to-self',
    prompt: 'Cancel my spa day package visit',
    misclassifiedAction: 'cancel_package_visit',
    expectedAction: 'cancel_package_visit_self' as const,
  },
];
