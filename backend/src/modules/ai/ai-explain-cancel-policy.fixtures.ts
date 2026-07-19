export type ExplainCancelPolicyPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_cancel_policy';
  rescueReason: 'cancel_policy';
};

export const CUSTOMER_EXPLAIN_CANCEL_POLICY_CLASSIFIER_RULES = `- explain_cancel_policy: READ — signed-in customer: explain salon cancellation/reschedule rules and minimum notice window (not deposit refund/forfeit math). Triggers: "Explain cancellation policy", "How much notice do I need to cancel?", "Explain reschedule policy and notice window", "What are the cancel rules for my booking?", casual "whats the deal if i cancel" / "what happens if I cancel" / typo "cancelation rulz". Optional bookingId when asking about a specific visit. NOT explain_deposit_forfeiture (deposit/prepayment forfeiture or refund), NOT explain_package_savings (package vs à-la-carte pricing — "deal on the bundle" is savings, "deal if I cancel" is cancel policy), NOT cancel_my_booking|reschedule_my_booking (mutate), NOT explain_amount_due_now (how much is due today at checkout — dollar amount), NOT explain_payment_options_for_service (cash vs online), NOT contact_support unless only asking for human help.`;

export const EXPLAIN_CANCEL_POLICY_PROMPTS: readonly ExplainCancelPolicyPromptFixture[] =
  [
    {
      id: 'explain-policy-customer',
      prompt: 'Explain the cancellation policy',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'notice-window-customer',
      prompt: 'How much notice do I need to cancel?',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'reschedule-policy-customer',
      prompt: 'Explain reschedule policy and notice window',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'cancel-rules-customer',
      prompt: 'What are the cancel rules for my booking?',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'self-service-policy-customer',
      prompt: 'Explain self-service cancel and reschedule rules',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'online-cancel-allowed-customer',
      prompt: 'Can I cancel online and what is the notice window?',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'reschedule-notice-customer',
      prompt: 'How much notice for reschedule on my appointment?',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'policy-window-customer',
      prompt: 'What is the cancellation notice window?',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'salon-cancel-rules-customer',
      prompt: 'Tell me the salon cancellation rules',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'change-appointment-policy-customer',
      prompt: 'Describe the policy for changing my appointment',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
  ];

export const EXPLAIN_CANCEL_POLICY_RESCUE_SCENARIOS = [
  {
    id: 'cancel-mutate-to-policy',
    prompt: 'Explain the cancellation policy',
    misclassifiedAction: 'cancel_my_booking',
    expectedAction: 'explain_cancel_policy' as const,
  },
  {
    id: 'unknown-to-notice-policy',
    prompt: 'How much notice do I need to cancel?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_cancel_policy' as const,
  },
  {
    id: 'deposit-forfeit-to-policy-steal-blocked',
    prompt: 'Do I lose my deposit if I cancel?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_cancel_policy' as const,
    expectNoRescue: true,
  },
] as const;
