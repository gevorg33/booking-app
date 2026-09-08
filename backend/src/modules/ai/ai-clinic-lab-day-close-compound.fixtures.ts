import type { ClinicLabDayCloseStepAction } from './ai-clinic-lab-day-close-compound.util.js';

export type ClinicLabDayCloseCompoundFixture = {
  id: string;
  prompt: string;
  orderedActions: ClinicLabDayCloseStepAction[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS: readonly ClinicLabDayCloseCompoundFixture[] = [
  {
    id: 'lab-day-close-maria-e2e-en',
    prompt:
      'Lab day close end-to-end: list pending test orders for today, enter WBC 12.5 for order abc123, release results to Maria, notify her when results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    expectedParams: {
      customerName: 'Maria',
      orderId: 'abc123',
      measurementCode: 'WBC',
      value: '12.5',
      date: 'today',
      status: 'NotCollected',
    },
    misclassifiedAction: 'enter_test_result',
  },
  {
    id: 'close-lab-day-today-john-en',
    prompt:
      'Close lab day for today — show pending lab orders, record hemoglobin 13.1 for order ord-42, publish results to John, send result-ready notification',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    expectedParams: {
      customerName: 'John',
      orderId: 'ord-42',
      measurementCode: 'hemoglobin',
      value: '13.1',
      date: 'today',
    },
    misclassifiedAction: 'list_test_orders',
  },
  {
    id: 'end-of-lab-day-sofia-en',
    prompt:
      'End-of-lab day wrap-up: list test orders awaiting results, enter glucose 95 for order abc123, release results to Sofia, notify when results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    expectedParams: {
      customerName: 'Sofia',
      orderId: 'abc123',
      measurementCode: 'glucose',
      value: '95',
    },
  },
  {
    id: 'lab-closeout-semicolon-anna-en',
    prompt:
      'Lab closeout for today; list pending lab orders; enter CBC 4.2 for order abc123; release results to Anna; notify her when results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    expectedParams: {
      customerName: 'Anna',
      orderId: 'abc123',
      measurementCode: 'CBC',
      value: '4.2',
      date: 'today',
    },
  },
  {
    id: 'wrap-up-lab-day-alex-en',
    prompt:
      'Wrap up lab day: show pending test orders, log sodium 140 for order ord-55, release results to Alex, tell patient when results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    expectedParams: {
      customerName: 'Alex',
      orderId: 'ord-55',
      measurementCode: 'sodium',
      value: '140',
    },
  },
  {
    id: 'finish-lab-day-james-en',
    prompt:
      'Finish lab day end-to-end — list lab orders for today, enter WBC 11.0 for order abc123, publish results to James, alert when results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    expectedParams: {
      customerName: 'James',
      orderId: 'abc123',
      measurementCode: 'WBC',
      value: '11.0',
      date: 'today',
    },
  },
  {
    id: 'close-out-lab-elena-en',
    prompt:
      'Close out the lab for today: list pending test orders, record hemoglobin 12.8 for order abc123, release results to Elena, send notification when results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    expectedParams: {
      customerName: 'Elena',
      orderId: 'abc123',
      measurementCode: 'hemoglobin',
      value: '12.8',
      date: 'today',
    },
  },
  {
    id: 'lab-day-close-cbc-maria-en',
    prompt:
      'Lab day close: show test orders awaiting results, enter CBC 4.5 for order ord-99, release to patient Maria, notify Maria when lab results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    expectedParams: {
      customerName: 'Maria',
      orderId: 'ord-99',
      measurementCode: 'CBC',
      value: '4.5',
    },
  },
  {
    id: 'day-close-wbc-david-en',
    prompt:
      'Close the day in lab — list pending lab orders; then enter WBC 10.2 for order abc123; release results to David; notify when results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    expectedParams: {
      customerName: 'David',
      orderId: 'abc123',
      measurementCode: 'WBC',
      value: '10.2',
    },
  },
  {
    id: 'lab-day-wrap-up-nina-en',
    prompt:
      'Lab day wrap-up end-to-end: list test orders for today, set glucose 88 for order abc123, release results to Nina, message Nina when results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    expectedParams: {
      customerName: 'Nina',
      orderId: 'abc123',
      measurementCode: 'glucose',
      value: '88',
      date: 'today',
    },
  },
  {
    id: 'full-lab-close-leo-en',
    prompt:
      'Full lab day close for today: show pending test orders, enter hemoglobin 14.0 for order ord-12, release results to Leo, notify patient when results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    expectedParams: {
      customerName: 'Leo',
      orderId: 'ord-12',
      measurementCode: 'hemoglobin',
      value: '14.0',
      date: 'today',
    },
  },
] as const satisfies readonly ClinicLabDayCloseCompoundFixture[];

export const CLINIC_LAB_DAY_CLOSE_EN_SCENARIO_IDS =
  CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS.map((row) => row.id);

export const CLINIC_LAB_DAY_CLOSE_RESCUE_SCENARIOS =
  CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS.filter(
    (scenario) =>
      'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<
    ClinicLabDayCloseCompoundFixture & { misclassifiedAction: string }
  >;
