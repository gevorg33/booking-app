/** ai-cmd-provider-5.25.1 / 5.25.2 / 5.25.3 — dashboard-handoff explainers built on PROVIDER_EXP_UI_AI_PARITY. */

export const PROVIDER_DASHBOARD_HANDOFF_CLASSIFIER_RULES = `- explain_dashboard_only_action: READ — provider mobile only: explains why a specific feature (loyalty points, message templates, full intake answers, calling a client, review policy, app language) is dashboard-only, not available from the mobile assistant. Triggers: adjust loyalty points, edit message templates. NOT explain_reassign_limit / explain_time_off_approval (their own dedicated dashboard-only explainers), NOT explain_accessibility_settings (local device UI, not a dashboard-only feature).
- explain_reassign_limit: READ — provider mobile only: explains why multi-service bookings can't be reassigned to another provider via the mobile assistant. Triggers: why can't AI reassign multi-service, use reassign button. NOT reassign_booking_same_day / list_reassign_options (the live single-service reassignment actions themselves).
- explain_time_off_approval: READ — provider mobile only: explains who approves time-off requests (your manager) and where (dashboard). Triggers: who approves my time off, pending manager approval. NOT request_time_off / list_my_time_off_requests (the live actions themselves).`;

export const PROVIDER_EXPLAIN_DASHBOARD_ONLY_ACTION_PROMPT_SCENARIOS = [
  {
    id: 'explain-dashboard-only-loyalty-en',
    prompt: 'Adjust loyalty points',
    surface: 'provider' as const,
    expectedAction: 'explain_dashboard_only_action',
  },
  {
    id: 'explain-dashboard-only-templates-en',
    prompt: 'Edit message templates',
    surface: 'provider' as const,
    expectedAction: 'explain_dashboard_only_action',
  },
  {
    id: 'explain-dashboard-only-intake-en',
    prompt: 'Open the full intake answers',
    surface: 'provider' as const,
    expectedAction: 'explain_dashboard_only_action',
  },
  // e2e-bug.282 — call-client FAQ (was stolen by summarize_client)
  {
    id: 'explain-dashboard-only-call-en',
    prompt: "Why can't I call the client?",
    surface: 'provider' as const,
    expectedAction: 'explain_dashboard_only_action',
  },
  {
    id: 'explain-dashboard-only-call-hy',
    prompt: 'Ինչու չեմ կարող զանգահարել հաճախորդին',
    surface: 'provider' as const,
    expectedAction: 'explain_dashboard_only_action',
  },
  {
    id: 'explain-dashboard-only-call-ru',
    prompt: 'Почему я не могу позвонить клиенту?',
    surface: 'provider' as const,
    expectedAction: 'explain_dashboard_only_action',
  },
  {
    id: 'explain-dashboard-only-call-hy-zang',
    prompt: 'Ինչու չեմ կարող զանգել հաճախորդին',
    surface: 'provider' as const,
    expectedAction: 'explain_dashboard_only_action',
  },
  {
    id: 'explain-dashboard-only-templates-hy',
    prompt: 'Ինչու չեմ կարող խմբագրել հաղորդագրության ձևանմուշները',
    surface: 'provider' as const,
    expectedAction: 'explain_dashboard_only_action',
  },
  {
    id: 'explain-dashboard-only-loyalty-hy',
    prompt: 'Ինչու չեմ կարող կարգավորել հավատարմության միավորները',
    surface: 'provider' as const,
    expectedAction: 'explain_dashboard_only_action',
  },
] as const;

export const PROVIDER_EXPLAIN_REASSIGN_LIMIT_PROMPT_SCENARIOS = [
  {
    id: 'explain-reassign-limit-why-en',
    prompt: "Why can't AI reassign multi-service?",
    surface: 'provider' as const,
    expectedAction: 'explain_reassign_limit',
  },
  {
    id: 'explain-reassign-limit-button-en',
    prompt: 'Use reassign button',
    surface: 'provider' as const,
    expectedAction: 'explain_reassign_limit',
  },
  {
    id: 'explain-reassign-limit-hy',
    prompt: 'Ինչու չեմ կարող վերանշանակել բազմածառայության ամրագրումը',
    surface: 'provider' as const,
    expectedAction: 'explain_reassign_limit',
  },
  {
    id: 'explain-reassign-limit-ru',
    prompt: 'Почему нельзя переназначить мультиуслугу?',
    surface: 'provider' as const,
    expectedAction: 'explain_reassign_limit',
  },
] as const;

export const PROVIDER_EXPLAIN_TIME_OFF_APPROVAL_PROMPT_SCENARIOS = [
  {
    id: 'explain-time-off-approval-who-en',
    prompt: 'Who approves my time off?',
    surface: 'provider' as const,
    expectedAction: 'explain_time_off_approval',
  },
  {
    id: 'explain-time-off-approval-pending-en',
    prompt: 'Pending manager approval',
    surface: 'provider' as const,
    expectedAction: 'explain_time_off_approval',
  },
  {
    id: 'explain-time-off-approval-hy',
    prompt: 'Ով է հաստատում իմ արձակուրդը',
    surface: 'provider' as const,
    expectedAction: 'explain_time_off_approval',
  },
  {
    id: 'explain-time-off-approval-ru',
    prompt: 'Кто одобряет мой отпуск?',
    surface: 'provider' as const,
    expectedAction: 'explain_time_off_approval',
  },
] as const;
