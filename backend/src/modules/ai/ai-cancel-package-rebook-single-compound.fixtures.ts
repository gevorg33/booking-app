export type CancelPackageRebookSingleCompoundFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  orderedActions: readonly string[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const CANCEL_PACKAGE_REBOOK_SINGLE_STEP_ACTIONS = [
  'cancel_package_visit_self',
  'book_nearest_slot',
] as const;

export const CANCEL_PACKAGE_REBOOK_SINGLE_CLASSIFIER_RULES = `- cancel_package_rebook_single (compound): customer multi-step — cancel/skip one visit in a purchased package bundle, then book a standalone single service instead. Decomposes to cancel_package_visit_self (visitIndex/packageName) → book_nearest_slot with serviceName and continueAfterPackageCancel. Triggers: skip/cancel package visit + book {service} instead / book single service. Example: "Skip package visit 2 and book a trim instead", "Cancel visit 2 of my package and book a haircut instead". NOT cancel_package_visit_self alone (no replacement booking); NOT cancel_and_rebook (single appointment cancel + nearest slot, not package); NOT reschedule_package_visit_self (move package visit); NOT explain_package_visit_rules (read terms).`;

export const CANCEL_PACKAGE_REBOOK_SINGLE_EN_PROMPTS = [
  {
    id: 'skip-visit-2-trim-instead',
    prompt: 'Skip package visit 2 and book a trim instead',
    expectedParams: {
      visitIndex: 2,
      serviceName: 'trim',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'cancel-visit-2-haircut-instead',
    prompt: 'Cancel visit 2 of my package and book a haircut instead',
    expectedParams: {
      visitIndex: 2,
      serviceName: 'haircut',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'skip-next-manicure-instead',
    prompt: 'Skip my next package visit — book a manicure instead',
    expectedParams: {
      serviceName: 'manicure',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'cancel-visit-3-facial-instead',
    prompt: 'Cancel package visit 3 and book facial instead',
    expectedParams: {
      visitIndex: 3,
      serviceName: 'facial',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'skip-spa-visit-1-blowdry',
    prompt: 'Skip spa day visit 1 and book a blowdry instead',
    expectedParams: {
      visitIndex: 1,
      packageName: 'Spa Day',
      serviceName: 'blowdry',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'cancel-visit-1-trim-semicolon',
    prompt: 'Cancel visit 1 of my package; book a trim instead',
    expectedParams: {
      visitIndex: 1,
      serviceName: 'trim',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'skip-visit-2-single-haircut',
    prompt: 'Skip package visit 2, book single haircut appointment instead',
    expectedParams: {
      visitIndex: 2,
      serviceName: 'haircut',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'cancel-package-massage-instead',
    prompt: 'Cancel my package visit and book a massage instead',
    expectedParams: {
      serviceName: 'massage',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'skip-spa-bundle-nails',
    prompt: 'Skip visit 2 on my spa day bundle and book nails instead',
    expectedParams: {
      visitIndex: 2,
      packageName: 'Spa Day',
      serviceName: 'nails',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'cancel-appointment-2-color',
    prompt: 'Cancel package appointment 2 and book a color instead',
    expectedParams: {
      visitIndex: 2,
      serviceName: 'color',
      cancelPackageRebookSingle: true,
    },
  },
] as const;

function buildCancelPackageRebookSinglePrompts(): CancelPackageRebookSingleCompoundFixture[] {
  return CANCEL_PACKAGE_REBOOK_SINGLE_EN_PROMPTS.map((entry) => ({
    id: `${entry.id}-customer`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    orderedActions: CANCEL_PACKAGE_REBOOK_SINGLE_STEP_ACTIONS,
    expectedParams: entry.expectedParams,
  }));
}

export const CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS: readonly CancelPackageRebookSingleCompoundFixture[] =
  buildCancelPackageRebookSinglePrompts();

export const CANCEL_PACKAGE_REBOOK_SINGLE_RESCUE_SCENARIOS: readonly CancelPackageRebookSingleCompoundFixture[] =
  [
    {
      id: 'package-cancel-to-compound',
      prompt: 'Skip package visit 2 and book a trim instead',
      surface: 'customer',
      orderedActions: [...CANCEL_PACKAGE_REBOOK_SINGLE_STEP_ACTIONS],
      misclassifiedAction: 'cancel_package_visit_self',
    },
    {
      id: 'book-to-compound',
      prompt: 'Cancel visit 2 of my package and book a haircut instead',
      surface: 'customer',
      orderedActions: [...CANCEL_PACKAGE_REBOOK_SINGLE_STEP_ACTIONS],
      misclassifiedAction: 'book_nearest_slot',
    },
    {
      id: 'cancel-rebook-to-compound',
      prompt: 'Skip my next package visit — book a manicure instead',
      surface: 'customer',
      orderedActions: [...CANCEL_PACKAGE_REBOOK_SINGLE_STEP_ACTIONS],
      misclassifiedAction: 'cancel_and_rebook',
    },
    {
      id: 'cancel-my-booking-to-compound',
      prompt: 'Cancel package visit 3 and book facial instead',
      surface: 'customer',
      orderedActions: [...CANCEL_PACKAGE_REBOOK_SINGLE_STEP_ACTIONS],
      misclassifiedAction: 'cancel_my_booking',
    },
  ];

export const CANCEL_PACKAGE_REBOOK_SINGLE_NEGATIVE_PROMPTS = [
  {
    id: 'cancel-package-only',
    prompt: 'Cancel my package visit',
  },
  {
    id: 'cancel-rebook-nearest',
    prompt: 'Cancel Friday and book the next available slot',
  },
  {
    id: 'skip-package-only',
    prompt: 'Skip package visit 2',
  },
  {
    id: 'book-trim-only',
    prompt: 'Book a trim tomorrow',
  },
  {
    id: 'reschedule-package',
    prompt: 'Reschedule package visit 2 to Friday',
  },
] as const;
