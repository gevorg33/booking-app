import type { CommandSurface } from './ai-command-registry.types.js';

export type IntakeLabBookPayPaymentAction =
  | 'pay_online'
  | 'pay_cash_at_visit'
  | 'choose_payment_method';

export type IntakeLabBookPaySurface = Extract<
  CommandSurface,
  'customer' | 'public'
>;

export type IntakeLabBookPayCompoundFixture = {
  id: string;
  prompt: string;
  surface: IntakeLabBookPaySurface;
  orderedActions: readonly string[];
  serviceName?: string;
  paymentAction?: IntakeLabBookPayPaymentAction;
  misclassifiedAction?: string;
};

export const INTAKE_LAB_BOOK_PAY_CLASSIFIER_RULES = `- intake_lab_book_pay (compound): customer/public clinic — signed-in mutate chain: pre-visit intake questionnaire, lab-test slot booking, then checkout payment. Decomposes to complete_intake_and_book → book_nearest_slot (customer) or book_appointment (public) → pay_online | pay_cash_at_visit | choose_payment_method. Triggers: fill|complete|finish + intake|health form|questionnaire + book|schedule + blood draw|blood test|lab test|CBC + pay deposit|pay online|pay with card|pay cash at the visit. Example: "Complete health form, book earliest blood draw, pay deposit", "Fill intake and book blood draw, pay online", "fill my intake, book the soonest blood test slot, and pay cash at the visit". NOT complete_intake_and_book when user omits payment; NOT discover_book_and_pay (budget/rank catalog filter); NOT book_lab_collection_nearest (no intake fill); NOT pay_online|pay_cash_at_visit alone; NOT explain_public_intake_form.`;

export const INTAKE_LAB_BOOK_PAY_EN_PROMPTS = [
  {
    id: 'health-form-draw-deposit',
    prompt: 'Complete health form, book earliest blood draw, pay deposit',
    serviceName: 'blood draw',
    paymentAction: 'pay_online' as const,
  },
  {
    id: 'intake-draw-pay-online',
    prompt: 'Fill intake and book blood draw, pay online',
    serviceName: 'blood draw',
    paymentAction: 'pay_online' as const,
  },
  {
    id: 'questionnaire-lab-card',
    prompt: 'Complete health questionnaire, schedule lab test, pay with card',
    serviceName: 'lab test',
    paymentAction: 'pay_online' as const,
  },
  {
    id: 'form-cbc-deposit',
    prompt: 'Finish intake form, book nearest CBC slot, pay deposit online',
    serviceName: 'CBC',
    paymentAction: 'pay_online' as const,
  },
  {
    id: 'intake-collection-online',
    prompt: 'Fill pre-visit intake then book blood collection and pay online',
    serviceName: 'blood collection',
    paymentAction: 'pay_online' as const,
  },
  {
    id: 'questions-draw-card',
    prompt: 'Complete health questions, book earliest lab draw, pay with card',
    serviceName: 'blood draw',
    paymentAction: 'pay_online' as const,
  },
  {
    id: 'questionnaire-reserve-deposit',
    prompt: 'Fill intake questionnaire, reserve blood draw, pay deposit',
    serviceName: 'blood draw',
    paymentAction: 'pay_online' as const,
  },
  {
    id: 'intake-lipid-online',
    prompt: 'Answer intake and book lipid panel soonest slot, pay online',
    serviceName: 'lipid panel',
    paymentAction: 'pay_online' as const,
  },
  {
    id: 'form-draw-then-deposit',
    prompt: 'Complete the form, book my blood draw, then pay deposit',
    serviceName: 'blood draw',
    paymentAction: 'pay_online' as const,
  },
  {
    id: 'health-form-card',
    prompt: 'Fill health form; book earliest blood draw; pay with card',
    serviceName: 'blood draw',
    paymentAction: 'pay_online' as const,
  },
  // e2e-bug.99 — cash-at-visit + "blood test" synonym (live audit phrasings)
  {
    id: 'intake-blood-test-pay-cash',
    prompt:
      'fill my intake, book the soonest blood test slot, and pay cash at the visit',
    serviceName: 'blood test',
    paymentAction: 'pay_cash_at_visit' as const,
  },
  {
    id: 'previsit-blood-test-pay-cash',
    prompt:
      'complete my pre-visit intake, book my blood test, and I will pay cash at the visit',
    serviceName: 'blood test',
    paymentAction: 'pay_cash_at_visit' as const,
  },
] as const;

function buildIntakeLabBookPayPrompts(): IntakeLabBookPayCompoundFixture[] {
  const rows: IntakeLabBookPayCompoundFixture[] = [];
  for (const entry of INTAKE_LAB_BOOK_PAY_EN_PROMPTS) {
    const paymentAction = entry.paymentAction;
    for (const surface of ['customer', 'public'] as const) {
      const bookAction =
        surface === 'public' ? 'book_appointment' : 'book_nearest_slot';
      rows.push({
        id: `${entry.id}-${surface}`,
        prompt: entry.prompt,
        surface,
        orderedActions: ['complete_intake_and_book', bookAction, paymentAction],
        serviceName: entry.serviceName,
        paymentAction,
      });
    }
  }
  return rows;
}

export const INTAKE_LAB_BOOK_PAY_COMPOUND_PROMPTS: readonly IntakeLabBookPayCompoundFixture[] =
  buildIntakeLabBookPayPrompts();

export const INTAKE_LAB_BOOK_PAY_RESCUE_SCENARIOS: readonly IntakeLabBookPayCompoundFixture[] =
  [
    {
      id: 'intake-only-to-intake-lab-pay',
      prompt: 'Fill intake and book blood draw, pay online',
      surface: 'customer',
      orderedActions: [
        'complete_intake_and_book',
        'book_nearest_slot',
        'pay_online',
      ],
      misclassifiedAction: 'complete_intake_and_book',
    },
    {
      id: 'pay-online-to-intake-lab-pay',
      prompt: 'Complete health form, book earliest blood draw, pay deposit',
      surface: 'customer',
      orderedActions: [
        'complete_intake_and_book',
        'book_nearest_slot',
        'pay_online',
      ],
      misclassifiedAction: 'pay_online',
    },
    {
      id: 'appointment-to-intake-lab-pay-public',
      prompt: 'Complete health questionnaire, schedule lab test, pay with card',
      surface: 'public',
      orderedActions: [
        'complete_intake_and_book',
        'book_appointment',
        'pay_online',
      ],
      misclassifiedAction: 'book_appointment',
    },
    {
      id: 'explain-to-intake-lab-pay',
      prompt: 'Fill pre-visit intake then book blood collection and pay online',
      surface: 'customer',
      orderedActions: [
        'complete_intake_and_book',
        'book_nearest_slot',
        'pay_online',
      ],
      misclassifiedAction: 'explain_public_intake_form',
    },
    {
      id: 'e2e99-self-service-steal-to-intake-lab-pay',
      prompt:
        'fill my intake, book the soonest blood test slot, and pay cash at the visit',
      surface: 'customer',
      orderedActions: [
        'complete_intake_and_book',
        'book_nearest_slot',
        'pay_cash_at_visit',
      ],
      misclassifiedAction: 'book_nearest_slot',
    },
    {
      id: 'e2e99-confirm-details-steal-to-intake-lab-pay',
      prompt:
        'complete my pre-visit intake, book my blood test, and I will pay cash at the visit',
      surface: 'customer',
      orderedActions: [
        'complete_intake_and_book',
        'book_nearest_slot',
        'pay_cash_at_visit',
      ],
      misclassifiedAction: 'confirm_my_booking_details',
    },
  ];

export const INTAKE_LAB_BOOK_PAY_NEGATIVE_PROMPTS = [
  {
    id: 'intake-book-no-pay',
    prompt: 'Fill intake and book blood draw',
    surface: 'customer' as const,
  },
  {
    id: 'discover-pay-no-intake',
    prompt: 'Book cheapest massage under $60 tomorrow and pay online',
    surface: 'customer' as const,
  },
  {
    id: 'lab-nearest-no-intake',
    prompt: 'Book lab draw earliest slot',
    surface: 'customer' as const,
  },
] as const;
