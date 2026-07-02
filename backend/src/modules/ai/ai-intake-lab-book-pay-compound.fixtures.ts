import type { CommandSurface } from './ai-command-registry.types.js';

export type IntakeLabBookPayPaymentAction =
  | 'pay_online'
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

export const INTAKE_LAB_BOOK_PAY_CLASSIFIER_RULES = `- intake_lab_book_pay (compound): customer/public clinic — signed-in mutate chain: pre-visit intake questionnaire, lab-test slot booking, then online checkout payment. Decomposes to complete_intake_and_book → book_nearest_slot (customer) or book_appointment (public) → pay_online or choose_payment_method. Triggers: fill|complete|finish + intake|health form|questionnaire + book|schedule + blood draw|lab test|CBC + pay deposit|pay online|pay with card. Example: "Complete health form, book earliest blood draw, pay deposit", "Fill intake and book blood draw, pay online". NOT complete_intake_and_book when user omits payment; NOT discover_book_and_pay (budget/rank catalog filter); NOT book_lab_collection_nearest (no intake fill); NOT pay_online alone; NOT explain_public_intake_form.`;

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
] as const;

function buildIntakeLabBookPayPrompts(): IntakeLabBookPayCompoundFixture[] {
  const rows: IntakeLabBookPayCompoundFixture[] = [];
  for (const entry of INTAKE_LAB_BOOK_PAY_EN_PROMPTS) {
    for (const surface of ['customer', 'public'] as const) {
      rows.push({
        id: `${entry.id}-${surface}`,
        prompt: entry.prompt,
        surface,
        orderedActions:
          surface === 'public'
            ? ['complete_intake_and_book', 'book_appointment', 'pay_online']
            : ['complete_intake_and_book', 'book_nearest_slot', 'pay_online'],
        serviceName: entry.serviceName,
        paymentAction: entry.paymentAction,
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
