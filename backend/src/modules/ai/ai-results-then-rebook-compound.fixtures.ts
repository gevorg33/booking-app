export type ResultsThenRebookCompoundFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  orderedActions: readonly string[];
  status?: string;
  testName?: string;
  serviceName?: string;
  misclassifiedAction?: string;
};

export const RESULTS_THEN_REBOOK_STEP_ACTIONS = [
  'explain_result_status',
  'rebook_last_appointment',
] as const;

export const RESULTS_THEN_REBOOK_CLASSIFIER_RULES = `- results_then_rebook (compound): customer clinic post-results follow-up — explain lab result status (released/ready) then one-tap rebook last visit. Decomposes to explain_result_status → rebook_last_appointment with optional status, testName, serviceName. Triggers: results released|ready + book follow-up|rebook last|same as last time|repeat last visit. Example: "Results released — book follow-up like last time", "My lab results are ready; rebook my last appointment", "CBC results released, book the same as last time". NOT explain_result_status alone (status FAQ without booking); NOT rebook_last_appointment alone (repeat visit without results context); NOT rebook_and_pay (payment step present); NOT list_my_test_results (list only); NOT notify_when_results_ready (alert subscription).`;

export const RESULTS_THEN_REBOOK_EN_PROMPTS = [
  {
    id: 'released-follow-up-last',
    prompt: 'Results released — book follow-up like last time',
    status: 'Released',
  },
  {
    id: 'ready-rebook-last',
    prompt: 'My lab results are ready; rebook my last appointment',
    status: 'Released',
  },
  {
    id: 'released-same-as-last',
    prompt: 'Results released, book the same as last time',
    status: 'Released',
  },
  {
    id: 'ready-schedule-follow-up',
    prompt: 'Lab results ready — schedule follow-up like my last visit',
    status: 'Released',
  },
  {
    id: 'explain-released-follow-up',
    prompt: 'What do released results mean and book follow-up like last time',
    status: 'Released',
  },
  {
    id: 'results-out-repeat',
    prompt: 'Results are out — repeat my last booking',
    status: 'Released',
  },
  {
    id: 'cbc-released-rebook',
    prompt: 'My CBC results released; rebook last visit',
    status: 'Released',
    testName: 'CBC',
  },
  {
    id: 'ready-same-appointment',
    prompt: 'Results ready — book same appointment again',
    status: 'Released',
  },
  {
    id: 'explain-then-rebook',
    prompt: 'Explain my released results then rebook my last visit',
    status: 'Released',
  },
  {
    id: 'released-same-service',
    prompt: 'Results released; book the same service as last time',
    status: 'Released',
  },
] as const;

function buildResultsThenRebookPrompts(): ResultsThenRebookCompoundFixture[] {
  return RESULTS_THEN_REBOOK_EN_PROMPTS.map((entry) => ({
    id: `${entry.id}-customer`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    orderedActions: RESULTS_THEN_REBOOK_STEP_ACTIONS,
    ...(entry.status ? { status: entry.status } : {}),
    ...('testName' in entry && entry.testName
      ? { testName: entry.testName }
      : {}),
    ...('serviceName' in entry && typeof entry.serviceName === 'string'
      ? { serviceName: entry.serviceName }
      : {}),
  }));
}

export const RESULTS_THEN_REBOOK_COMPOUND_PROMPTS: readonly ResultsThenRebookCompoundFixture[] =
  buildResultsThenRebookPrompts();

export const RESULTS_THEN_REBOOK_RESCUE_SCENARIOS: readonly ResultsThenRebookCompoundFixture[] =
  [
    {
      id: 'explain-to-results-rebook',
      prompt: 'Results released — book follow-up like last time',
      surface: 'customer',
      orderedActions: [...RESULTS_THEN_REBOOK_STEP_ACTIONS],
      misclassifiedAction: 'explain_result_status',
    },
    {
      id: 'rebook-to-results-rebook',
      prompt: 'My lab results are ready; rebook my last appointment',
      surface: 'customer',
      orderedActions: [...RESULTS_THEN_REBOOK_STEP_ACTIONS],
      misclassifiedAction: 'rebook_last_appointment',
    },
    {
      id: 'list-to-results-rebook',
      prompt: 'Results ready — book same appointment again',
      surface: 'customer',
      orderedActions: [...RESULTS_THEN_REBOOK_STEP_ACTIONS],
      misclassifiedAction: 'list_my_test_results',
    },
    {
      id: 'track-to-results-rebook',
      prompt: 'CBC results released; rebook last visit',
      surface: 'customer',
      orderedActions: [...RESULTS_THEN_REBOOK_STEP_ACTIONS],
      misclassifiedAction: 'track_lab_order_status',
    },
  ];

export const RESULTS_THEN_REBOOK_NEGATIVE_PROMPTS = [
  {
    id: 'explain-only',
    prompt: 'What does released mean for my lab results?',
  },
  {
    id: 'rebook-only',
    prompt: 'Rebook my last appointment',
  },
  {
    id: 'list-only',
    prompt: 'Show my lab test results',
  },
] as const;
