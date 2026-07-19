export type ExplainDepositForfeiturePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_deposit_forfeiture';
  rescueReason: 'deposit_forfeiture';
};

export const CUSTOMER_PUBLIC_EXPLAIN_DEPOSIT_FORFEITURE_CLASSIFIER_RULES = `- explain_deposit_forfeiture: READ — customer app or public booking web: explain whether an online deposit or prepayment is forfeited when the user cancels, whether a percentage (e.g. 50%) is refundable, and how the salon notice window interacts with deposit prepaymentMode=deposit. Triggers: "Do I lose my deposit if I cancel?", "Is the 50% refundable?", "Will I get my deposit back?", "What happens to my deposit if I cancel late?", "Do I forfeit my prepayment?", "why do I have to pay a deposit to book?", "explain the deposit forfeiture policy if I cancel late". Optional bookingId when asking about a specific visit. Uses salon self-service notice settings + service prepaymentMode/deposit percent. NOT explain_cancel_policy (general notice/reschedule rules without deposit focus), NOT explain_amount_due_now (checkout dollar amount due today), NOT cancel_my_booking (mutate cancel), NOT explain_why_stripe_required (why pay online / why Stripe — without deposit forfeit/cancel framing), NOT explain_checkout_currency (currency display), NOT explain_package_visit_rules (package bundle visits).`;

const DEPOSIT_FORFEITURE_EN_PROMPTS = [
  {
    id: 'lose-deposit',
    prompt: 'Do I lose my deposit if I cancel?',
  },
  {
    id: 'deposit-refundable',
    prompt: 'Is the 50% refundable?',
  },
  {
    id: 'deposit-back',
    prompt: 'Will I get my deposit back if I cancel?',
  },
  {
    id: 'cancellation-fee',
    prompt: "What's the cancellation fee?",
  },
  {
    id: 'forfeit-prepayment',
    prompt: 'Do I forfeit my prepayment if I cancel late?',
  },
  {
    id: 'late-cancel-deposit',
    prompt: 'What happens to my deposit if I cancel late?',
  },
  {
    id: 'cancel-for-free-deposit',
    prompt: 'Can I cancel for free?',
  },
  {
    id: 'refund-deposit-percent',
    prompt: 'Is my deposit refundable if I cancel early?',
  },
  {
    id: 'lose-prepayment-online',
    prompt: 'If I paid a deposit online, do I lose it when I cancel?',
  },
  {
    id: 'deposit-inside-notice',
    prompt: 'Do I forfeit my deposit inside the notice window?',
  },
  {
    id: 'e2e113-why-pay-deposit-to-book',
    prompt: 'why do I have to pay a deposit to book?',
  },
  {
    id: 'e2e113-deposit-forfeiture-policy-late',
    prompt: 'explain the deposit forfeiture policy if I cancel late',
  },
] as const;

function buildDepositForfeiturePrompts(): ExplainDepositForfeiturePromptFixture[] {
  const rows: ExplainDepositForfeiturePromptFixture[] = [];
  for (const entry of DEPOSIT_FORFEITURE_EN_PROMPTS) {
    for (const surface of ['customer', 'public'] as const) {
      rows.push({
        id: `${entry.id}-${surface}`,
        prompt: entry.prompt,
        surface,
        expectedAction: 'explain_deposit_forfeiture',
        rescueReason: 'deposit_forfeiture',
      });
    }
  }
  return rows;
}

export const EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS: readonly ExplainDepositForfeiturePromptFixture[] =
  buildDepositForfeiturePrompts();

export const EXPLAIN_DEPOSIT_FORFEITURE_RESCUE_SCENARIOS = [
  {
    id: 'cancel-mutate-to-deposit-forfeiture',
    prompt: 'Do I lose my deposit if I cancel?',
    misclassifiedAction: 'cancel_my_booking',
    expectedAction: 'explain_deposit_forfeiture' as const,
  },
  {
    id: 'amount-due-to-deposit-forfeiture',
    prompt: 'Is the 50% refundable?',
    misclassifiedAction: 'explain_amount_due_now',
    expectedAction: 'explain_deposit_forfeiture' as const,
  },
  {
    id: 'cancel-policy-to-deposit-forfeiture',
    prompt: 'Will I get my deposit back if I cancel?',
    misclassifiedAction: 'explain_cancel_policy',
    expectedAction: 'explain_deposit_forfeiture' as const,
  },
  {
    id: 'unknown-to-deposit-forfeiture',
    prompt: 'What happens to my deposit if I cancel late?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_deposit_forfeiture' as const,
  },
  {
    id: 'e2e113-currency-to-deposit-forfeiture',
    prompt: 'why do I have to pay a deposit to book?',
    misclassifiedAction: 'explain_checkout_currency',
    expectedAction: 'explain_deposit_forfeiture' as const,
  },
  {
    id: 'e2e113-stripe-to-deposit-forfeiture',
    prompt: 'explain the deposit forfeiture policy if I cancel late',
    misclassifiedAction: 'explain_why_stripe_required',
    expectedAction: 'explain_deposit_forfeiture' as const,
  },
] as const;
