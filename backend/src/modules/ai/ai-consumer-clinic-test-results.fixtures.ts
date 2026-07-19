/** Customer + public classifier rules for patient lab results (ai-cmd-clinic-v2-5). */
export const CONSUMER_CLINIC_TEST_RESULTS_CLASSIFIER_RULES = `- list_my_test_results: READ — clinic only, logged-in account: list released lab results visible in My Results. Triggers: my test results|my lab results|results in my account|released results|show/list/open my results. Requires sign-in. NOT track_lab_order_status (are results ready, track lab order), NOT my_appointments (bookings schedule), NOT list_providers, NOT dashboard list_test_orders.
- explain_result_status: READ — clinic only: explain lab result status (Released, pending, processing, reviewed) in patient-friendly terms; optional testName. Works signed-in or general FAQ. NOT results_then_rebook (explain status then rebook last visit compound), NOT track_lab_order_status (readiness tracking without FAQ), NOT explain_checkout_tax, NOT explain_data_rights, NOT notify_patient_result_ready, NOT tour_group_checkout / book_tour_nearest_departure ("when seats/spots are available" capacity gates on tours — never clinic).
- Examples:
  - "Show my lab test results" → list_my_test_results
  - "Are my results ready?" → track_lab_order_status (customer app)
  - "What does released mean for my lab results?" → explain_result_status, status=Released`;

export const LIST_MY_TEST_RESULTS_PROMPTS = [
  { id: 'show-lab-results', prompt: 'Show my lab test results' },
  { id: 'list-my-results', prompt: 'List my test results' },
  {
    id: 'my-results-account',
    prompt: 'What lab results do I have in my account?',
  },
  { id: 'released-results', prompt: 'Show my released lab results' },
  { id: 'open-my-results', prompt: 'Open my lab results' },
  { id: 'account-results', prompt: 'What results are in My Results?' },
  { id: 'see-test-results', prompt: 'Can I see my test results?' },
  { id: 'lab-results-account', prompt: 'My lab results on my account' },
  { id: 'check-my-results', prompt: 'Check my lab test results' },
  { id: 'where-find-results', prompt: 'Where can I find my lab results?' },
] as const;

export const EXPLAIN_RESULT_STATUS_PROMPTS = [
  {
    id: 'released-meaning',
    prompt: 'What does released mean for my lab results?',
    status: 'Released',
  },
  {
    id: 'why-not-ready',
    prompt: "Why don't I see my CBC results yet?",
    testName: 'CBC',
  },
  {
    id: 'pending-meaning',
    prompt: 'What does pending mean for test results?',
    status: 'Pending',
  },
  {
    id: 'when-available',
    prompt: 'When will my lab results be available?',
  },
  {
    id: 'still-processing',
    prompt: 'Why is my test still processing?',
  },
  {
    id: 'explain-status',
    prompt: 'Explain my lab result status',
  },
  {
    id: 'reviewed-meaning',
    prompt: 'What does reviewed mean before results are released?',
    status: 'Reviewed',
  },
  {
    id: 'waiting-results',
    prompt: 'Why are my results still waiting?',
  },
  {
    id: 'lipid-status',
    prompt: 'What is the status of my lipid panel result?',
    testName: 'lipid panel',
  },
  {
    id: 'not-showing',
    prompt: 'Why are my lab results not showing in the app?',
  },
  {
    id: 'processing-meaning',
    prompt: 'What does it mean when a lab result is still processing?',
  },
  {
    id: 'ready-vs-released',
    prompt: 'When are test results marked as released?',
    status: 'Released',
  },
] as const;

export const CONSUMER_CLINIC_TEST_RESULTS_RESCUE_SCENARIOS = [
  {
    id: 'appointments-to-results',
    prompt: 'Show my lab test results',
    misclassifiedAction: 'my_appointments',
    expectedAction: 'list_my_test_results' as const,
  },
  {
    id: 'list-appointments-to-results',
    prompt: 'List my test results',
    misclassifiedAction: 'list_my_appointments',
    expectedAction: 'list_my_test_results' as const,
  },
  {
    id: 'checkout-tax-to-status',
    prompt: 'What does released mean for my lab results?',
    misclassifiedAction: 'explain_checkout_tax',
    expectedAction: 'explain_result_status' as const,
  },
  {
    id: 'data-rights-to-status',
    prompt: 'Why are my lab results not showing in the app?',
    misclassifiedAction: 'explain_data_rights',
    expectedAction: 'explain_result_status' as const,
  },
] as const;
