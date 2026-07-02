import type { CommandSurface } from './ai-command-registry.types.js';
import { CLINIC_PATIENT_CHART_CLASSIFIER_RULES } from './ai-clinic-patient-chart.fixtures.js';
import {
  CREATE_TEST_ORDER_PROMPTS,
  CLINIC_TEST_ORDER_CLASSIFIER_RULES,
  LIST_TEST_ORDERS_PROMPTS,
} from './ai-clinic-test-order.fixtures.js';
import {
  CLINIC_TEST_RESULT_CLASSIFIER_RULES,
  ENTER_TEST_RESULT_PROMPTS,
  RELEASE_TEST_RESULT_PROMPTS,
} from './ai-clinic-test-result.fixtures.js';
import {
  CONSUMER_CLINIC_TEST_RESULTS_CLASSIFIER_RULES,
  EXPLAIN_RESULT_STATUS_PROMPTS,
  LIST_MY_TEST_RESULTS_PROMPTS,
} from './ai-consumer-clinic-test-results.fixtures.js';
import {
  LIST_MY_COLLECTION_QUEUE_PROMPTS,
  MARK_SPECIMEN_COLLECTED_PROMPTS,
  PROVIDER_CLINIC_COLLECTION_CLASSIFIER_RULES,
} from './ai-provider-clinic-collection.fixtures.js';
import { CLINIC_COMPOUND_CLASSIFIER_RULES } from './ai-clinic-compound.fixtures.js';

export type ClinicV2Surface = Extract<
  CommandSurface,
  'dashboard' | 'provider' | 'customer' | 'public'
>;

export interface ClinicV2SurfaceScenario {
  id: string;
  surface: ClinicV2Surface;
  prompt: string;
  expectedAction: string;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
}

/** Dashboard clinic v2 classifier bundle (orders, results, chart). */
export const CLINIC_V2_DASHBOARD_CLASSIFIER_RULES = [
  CLINIC_TEST_ORDER_CLASSIFIER_RULES,
  CLINIC_TEST_RESULT_CLASSIFIER_RULES,
  CLINIC_PATIENT_CHART_CLASSIFIER_RULES,
  CLINIC_COMPOUND_CLASSIFIER_RULES,
].join('\n');

export const CLINIC_V2_PROVIDER_CLASSIFIER_RULES =
  PROVIDER_CLINIC_COLLECTION_CLASSIFIER_RULES;

export const CLINIC_V2_CONSUMER_CLASSIFIER_RULES =
  CONSUMER_CLINIC_TEST_RESULTS_CLASSIFIER_RULES;

/** Consumer app phrasing appendix (ai-cmd-clinic-v2-6). */
export const CUSTOMER_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX = `- Customer app lab results (logged-in My Results tab):
  - list_my_test_results: "Show my lab results in the app", "Open My Results", "What did the clinic release to my account?"
  - track_lab_order_status: "Are my results ready?", "Track my lab order", "Where is my blood work?"
  - explain_result_status: "Why is my CBC still pending in the app?", "What does released mean in My Results?"
  - clinic compounds: "Book lipid panel and notify me when results are ready" → book_nearest_slot then explain_result_status (NOT notify_patient_result_ready)`;

/** Public booking page phrasing appendix (ai-cmd-clinic-v2-6). */
export const PUBLIC_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX = `- Public booking page lab results (signed-in visitor or general FAQ):
  - list_my_test_results: "Where do I see my lab results on this page?", "Are my test results ready on the booking site?", "Show results after my clinic visit"
  - explain_result_status: "What does released mean for lab results?", "Why are my lab results not showing after my visit?", "When will results appear on this page?"
  - clinic compounds: "Book lipid panel and tell me when results are ready" → book_nearest_slot then notify_when_results_ready`;

export const CLINIC_V2_CROSS_SURFACE_CLASSIFIER_RULES = `- Clinic v2 surface routing:
  - dashboard: create_test_order, list_test_orders, enter_test_result, release_test_result, explain_patient_chart — staff/admin only
  - provider: list_my_collection_queue, mark_specimen_collected — provider self-scope collection queue
  - customer/public: list_my_test_results, explain_result_status — patient My Results read paths; public uses booking-page phrasing`;

export const CLINIC_V2_CUSTOMER_LIST_PROMPTS = [
  {
    id: 'app-lab-results',
    prompt: 'Show my lab results in the app',
  },
  {
    id: 'open-my-results-tab',
    prompt: 'Open My Results tab',
  },
  {
    id: 'released-to-account',
    prompt: 'What did the clinic release to my account?',
  },
  {
    id: 'app-cbc-ready',
    prompt: 'Do I have CBC results in the consumer app?',
  },
  {
    id: 'my-results-app',
    prompt: 'My lab results in the app',
  },
  {
    id: 'check-app-results',
    prompt: 'Check my test results in My Results',
  },
  {
    id: 'any-released-app',
    prompt: 'Any released lab results on my account?',
  },
  {
    id: 'see-results-app',
    prompt: 'Can I see my lab results in the app now?',
  },
  {
    id: 'account-lab-panel',
    prompt: 'Show lipid panel results on my account',
    testName: 'lipid panel',
  },
  {
    id: 'list-app-results',
    prompt: 'List lab results from my clinic visits',
  },
  {
    id: 'ready-in-app',
    prompt: 'Are my test results ready in the app?',
  },
  {
    id: 'view-my-results',
    prompt: 'View my released test results',
  },
] as const;

export const CLINIC_V2_CUSTOMER_EXPLAIN_PROMPTS = [
  {
    id: 'cbc-pending-app',
    prompt: 'Why is my CBC still pending in the app?',
    testName: 'CBC',
  },
  {
    id: 'released-my-results',
    prompt: 'What does released mean in My Results?',
    status: 'Released',
  },
  {
    id: 'app-not-showing',
    prompt: "Why don't I see results in the consumer app yet?",
  },
  {
    id: 'processing-app',
    prompt: 'What does processing mean for my lab result in the app?',
  },
  {
    id: 'when-app-ready',
    prompt: 'When will my lab results show in the app?',
  },
  {
    id: 'reviewed-before-release',
    prompt: 'What does reviewed mean before results hit My Results?',
    status: 'Reviewed',
  },
  {
    id: 'lipid-app-status',
    prompt: 'What is the status of my lipid panel in the app?',
    testName: 'lipid panel',
  },
  {
    id: 'waiting-app',
    prompt: 'Why are my results still waiting in the app?',
  },
  {
    id: 'pending-meaning-app',
    prompt: 'Explain pending status for my lab tests',
    status: 'Pending',
  },
  {
    id: 'not-in-my-results',
    prompt: 'Why is my test not in My Results yet?',
  },
  {
    id: 'released-vs-ready',
    prompt: 'When are results marked released in the app?',
    status: 'Released',
  },
  {
    id: 'explain-pipeline-app',
    prompt: 'How do lab results get to My Results?',
  },
] as const;

export const CLINIC_V2_PUBLIC_LIST_PROMPTS = [
  {
    id: 'where-on-page',
    prompt: 'Where do I see my lab results on this page?',
  },
  {
    id: 'booking-site-ready',
    prompt: 'Are my test results ready on the booking site?',
  },
  {
    id: 'after-clinic-visit',
    prompt: 'Show results after my clinic visit',
  },
  {
    id: 'my-results-booking-page',
    prompt: 'My lab results on the booking page',
  },
  {
    id: 'signed-in-results',
    prompt: 'Can I view my test results here after signing in?',
  },
  {
    id: 'check-booking-results',
    prompt: 'Check my lab results on this booking site',
  },
  {
    id: 'released-booking-page',
    prompt: 'Show my released results on this page',
  },
  {
    id: 'visit-results-ready',
    prompt: 'Are lab results from my visit available here?',
  },
  {
    id: 'open-results-section',
    prompt: 'Open my test results section',
  },
  {
    id: 'see-cbc-booking',
    prompt: 'Do I have CBC results on the booking page?',
  },
  {
    id: 'list-portal-results',
    prompt: 'List my lab results on the patient portal',
  },
  {
    id: 'any-results-here',
    prompt: 'Do I have any test results available here?',
  },
] as const;

export const CLINIC_V2_PUBLIC_EXPLAIN_PROMPTS = [
  {
    id: 'released-faq',
    prompt: 'What does released mean for lab results?',
    status: 'Released',
  },
  {
    id: 'not-showing-after-visit',
    prompt: 'Why are my lab results not showing after my visit?',
  },
  {
    id: 'when-on-page',
    prompt: 'When will results appear on this page?',
  },
  {
    id: 'pending-booking-faq',
    prompt: 'What does pending mean for lab tests?',
    status: 'Pending',
  },
  {
    id: 'processing-booking-faq',
    prompt: 'Why is my lab test still processing?',
  },
  {
    id: 'reviewed-booking-faq',
    prompt: 'What does reviewed mean before results are published?',
    status: 'Reviewed',
  },
  {
    id: 'cbc-not-here',
    prompt: "Why don't I see my CBC results here yet?",
    testName: 'CBC',
  },
  {
    id: 'status-booking-page',
    prompt: 'Explain lab result status on the booking page',
  },
  {
    id: 'waiting-booking-site',
    prompt: 'Why are my results still waiting on the booking site?',
  },
  {
    id: 'ready-vs-released-page',
    prompt: 'When are test results marked as released?',
    status: 'Released',
  },
  {
    id: 'lipid-status-page',
    prompt: 'What is the status of my lipid panel result?',
    testName: 'lipid panel',
  },
  {
    id: 'pipeline-booking-faq',
    prompt: 'How long until lab results show up here?',
  },
] as const;

function buildDashboardScenarios(): ClinicV2SurfaceScenario[] {
  const create = CREATE_TEST_ORDER_PROMPTS.slice(0, 4).map((entry) => ({
    id: `dashboard-create-${entry.id}`,
    surface: 'dashboard' as const,
    prompt: entry.prompt,
    expectedAction: 'create_test_order',
    rescueReason: 'create_test_order',
    paramsPartial: {
      ...('customerName' in entry && entry.customerName
        ? { customerName: entry.customerName }
        : {}),
      ...('bookingId' in entry && entry.bookingId
        ? { bookingId: entry.bookingId }
        : {}),
    },
  }));
  const list = LIST_TEST_ORDERS_PROMPTS.slice(0, 3).map((entry) => ({
    id: `dashboard-list-${entry.id}`,
    surface: 'dashboard' as const,
    prompt: entry.prompt,
    expectedAction: 'list_test_orders',
    rescueReason: 'list_test_orders',
    paramsPartial: {
      ...('customerName' in entry && entry.customerName
        ? { customerName: entry.customerName }
        : {}),
      ...('status' in entry && entry.status ? { status: entry.status } : {}),
      ...('bookingId' in entry && entry.bookingId
        ? { bookingId: entry.bookingId }
        : {}),
    },
  }));
  const enter = ENTER_TEST_RESULT_PROMPTS.slice(0, 2).map((entry) => ({
    id: `dashboard-enter-${entry.id}`,
    surface: 'dashboard' as const,
    prompt: entry.prompt,
    expectedAction: 'enter_test_result',
    rescueReason: 'enter_test_result',
    paramsPartial: {
      measurementCode: entry.measurementCode,
      value: entry.value,
      ...('orderId' in entry && entry.orderId
        ? { orderId: entry.orderId }
        : {}),
      ...('resultId' in entry && entry.resultId
        ? { resultId: entry.resultId }
        : {}),
    },
  }));
  const release = RELEASE_TEST_RESULT_PROMPTS.slice(0, 2).map((entry) => ({
    id: `dashboard-release-${entry.id}`,
    surface: 'dashboard' as const,
    prompt: entry.prompt,
    expectedAction: 'release_test_result',
    rescueReason: 'release_test_result',
    paramsPartial: {
      ...('customerName' in entry && entry.customerName
        ? { customerName: entry.customerName }
        : {}),
      ...('orderId' in entry && entry.orderId
        ? { orderId: entry.orderId }
        : {}),
      ...('resultId' in entry && entry.resultId
        ? { resultId: entry.resultId }
        : {}),
    },
  }));
  const chart = [
    {
      id: 'dashboard-chart-maria',
      surface: 'dashboard' as const,
      prompt: "Explain Maria's patient chart",
      expectedAction: 'explain_patient_chart',
      rescueReason: 'explain_patient_chart',
      paramsPartial: { customerName: 'Maria' },
    },
    {
      id: 'dashboard-chart-allergies',
      surface: 'dashboard' as const,
      prompt: 'Show allergies and last visits for Maria',
      expectedAction: 'explain_patient_chart',
      rescueReason: 'explain_patient_chart',
      paramsPartial: { customerName: 'Maria' },
    },
    {
      id: 'dashboard-chart-pending',
      surface: 'dashboard' as const,
      prompt: 'What pending lab results does Maria have on her chart?',
      expectedAction: 'explain_patient_chart',
      rescueReason: 'explain_patient_chart',
      paramsPartial: { customerName: 'Maria' },
    },
  ];
  return [...create, ...list, ...enter, ...release, ...chart];
}

function buildProviderScenarios(): ClinicV2SurfaceScenario[] {
  return [
    ...LIST_MY_COLLECTION_QUEUE_PROMPTS.map((entry) => ({
      id: `provider-list-${entry.id}`,
      surface: 'provider' as const,
      prompt: entry.prompt,
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
    })),
    ...MARK_SPECIMEN_COLLECTED_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('customerName' in entry && entry.customerName) {
        paramsPartial.customerName = entry.customerName;
      }
      if ('specimenId' in entry && entry.specimenId) {
        paramsPartial.specimenId = entry.specimenId;
      }
      if ('orderId' in entry && entry.orderId) {
        paramsPartial.orderId = entry.orderId;
      }
      return {
        id: `provider-mark-${entry.id}`,
        surface: 'provider' as const,
        prompt: entry.prompt,
        expectedAction: 'mark_specimen_collected',
        rescueReason: 'mark_specimen_collected',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      };
    }),
  ];
}

function buildConsumerScenarios(
  surface: 'customer' | 'public',
  listPrompts: readonly { id: string; prompt: string; testName?: string }[],
  explainPrompts: readonly {
    id: string;
    prompt: string;
    status?: string;
    testName?: string;
  }[],
): ClinicV2SurfaceScenario[] {
  return [
    ...listPrompts.map((entry) => ({
      id: `${surface}-list-${entry.id}`,
      surface,
      prompt: entry.prompt,
      expectedAction: 'list_my_test_results',
      rescueReason: 'list_my_test_results',
      ...(entry.testName
        ? { paramsPartial: { testName: entry.testName } }
        : {}),
    })),
    ...explainPrompts.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if (entry.status) paramsPartial.status = entry.status;
      if (entry.testName) paramsPartial.testName = entry.testName;
      return {
        id: `${surface}-explain-${entry.id}`,
        surface,
        prompt: entry.prompt,
        expectedAction: 'explain_result_status',
        rescueReason: 'explain_result_status',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      };
    }),
  ];
}

export const CLINIC_V2_DASHBOARD_SCENARIOS = buildDashboardScenarios();
export const CLINIC_V2_PROVIDER_SCENARIOS = buildProviderScenarios();
export const CLINIC_V2_CUSTOMER_SCENARIOS = buildConsumerScenarios(
  'customer',
  CLINIC_V2_CUSTOMER_LIST_PROMPTS,
  CLINIC_V2_CUSTOMER_EXPLAIN_PROMPTS,
);
export const CLINIC_V2_PUBLIC_SCENARIOS = buildConsumerScenarios(
  'public',
  CLINIC_V2_PUBLIC_LIST_PROMPTS,
  CLINIC_V2_PUBLIC_EXPLAIN_PROMPTS,
);

/** Tagged NL scenarios for classifier + rescue eval (ai-cmd-clinic-v2-6). */
export const CLINIC_V2_SURFACE_SCENARIOS: ClinicV2SurfaceScenario[] = [
  ...CLINIC_V2_DASHBOARD_SCENARIOS,
  ...CLINIC_V2_PROVIDER_SCENARIOS,
  ...CLINIC_V2_CUSTOMER_SCENARIOS,
  ...CLINIC_V2_PUBLIC_SCENARIOS,
];

/** Minimum NL prompt count per surface gate (ai-cmd-clinic-v2-6). */
export const CLINIC_V2_MIN_PROMPTS_PER_SURFACE = 10 as const;

/** Legacy consumer prompts retained for v2-5 regression coverage. */
export const CLINIC_V2_LEGACY_CONSUMER_PROMPTS = [
  ...LIST_MY_TEST_RESULTS_PROMPTS,
  ...EXPLAIN_RESULT_STATUS_PROMPTS,
] as const;
