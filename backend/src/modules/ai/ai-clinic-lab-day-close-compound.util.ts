import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import {
  isListTestOrdersPrompt,
  parseListTestOrdersFromPrompt,
} from './ai-clinic-test-order.util.js';
import {
  extractOrderIdFromPrompt,
  extractReleaseCustomerNameFromPrompt,
  extractResultIdFromPrompt,
  isEnterTestResultPrompt,
  parseEnterTestResultFromPrompt,
} from './ai-clinic-test-result.util.js';
import {
  isNotifyPatientResultReadyPrompt,
  parsePatientResultReadyParams,
} from './ai-notification-date-format.util.js';

export const CLINIC_LAB_DAY_CLOSE_STEP_ACTIONS = [
  'list_test_orders',
  'enter_test_result',
  'release_test_result',
  'notify_patient_result_ready',
] as const;

export type ClinicLabDayCloseStepAction =
  (typeof CLINIC_LAB_DAY_CLOSE_STEP_ACTIONS)[number];

export const CLINIC_LAB_DAY_CLOSE_RECIPE_ID = 'clinic_lab_day_close';

const COMPOUND_MARKERS =
  /\band\s+then\b|\bthen\b|;\s*|\s+and\s+(?=(?:list|show|enter|record|log|release|publish|notify|send|tell)\b)/i;

export const CLINIC_LAB_DAY_CLOSE_CLASSIFIER_RULES = `- clinic_lab_day_close (compound): dashboard multi-step lab day close — decomposes to list_test_orders → enter_test_result → release_test_result → notify_patient_result_ready. Use for "close lab day end-to-end", "lab day close: list pending orders, enter WBC, release to Maria, notify when ready", "wrap up lab — show orders, record results, publish to patient, send notifications". NOT list_test_orders alone when user asks for full day close; NOT enter_test_result alone when prompt also asks to release and notify; NOT dashboard_clinic_compound (order + notify only).`;

const FULL_DAY_CLOSE_CUE =
  /\b(?:lab\s+day\s+close|close\s+(?:out\s+)?(?:the\s+)?lab(?:\s+day)?|end[\s-]of[\s-]lab\s+day|lab\s+closeout|wrap\s+up\s+lab|finish\s+lab\s+day|lab\s+day\s+end[\s-]to[\s-]end|close\s+the\s+day(?:\s+in\s+lab)?|lab\s+day\s+wrap[\s-]up)\b/i;

const LIST_STEP_CUE = /\b(?:list|show|what|which|pending|open)\b/i;
const LIST_ORDER_NOUN =
  /\b(?:test\s+orders?|lab\s+orders?|pending\s+(?:lab|test)|orders?\s+awaiting\s+results?)\b/i;

const ENTER_STEP_CUE = /\b(?:enter|record|log|set|input|type)\b/i;
const ENTER_VALUE_CUE =
  /\b(?:WBC|CBC|BMP|glucose|hemoglobin|sodium|lipid)\b|\b\d+(?:\.\d+)?\s+for\s+order\b/i;

const RELEASE_STEP_CUE = /\b(?:release|publish)\b/i;
const RELEASE_TARGET_CUE =
  /\b(?:results?\s+to|to\s+patient|patient\s+chart|make\s+.*available)\b/i;

const NOTIFY_STEP_CUE =
  /\b(?:notify|send|tell|alert|message|contact|inform)\b/i;
const NOTIFY_READY_CUE =
  /\b(?:results?\s+(?:are\s+)?ready|when\s+results?\s+are\s+ready|result[- ]?ready|result[- ]?ready\s+notification)\b/i;

function hasListStepCue(prompt: string): boolean {
  return (
    isListTestOrdersPrompt(prompt) ||
    (LIST_STEP_CUE.test(prompt) && LIST_ORDER_NOUN.test(prompt))
  );
}

function hasEnterStepCue(prompt: string): boolean {
  return (
    isEnterTestResultPrompt(prompt) ||
    (ENTER_STEP_CUE.test(prompt) && ENTER_VALUE_CUE.test(prompt))
  );
}

function hasReleaseStepCue(prompt: string): boolean {
  return (
    RELEASE_STEP_CUE.test(prompt) &&
    (RELEASE_TARGET_CUE.test(prompt) ||
      /\brelease\b.+\b(?:to|for)\s+[A-Z][a-z]+/i.test(prompt) ||
      /\bpublish\b.+\bresults?\b/i.test(prompt))
  );
}

function hasNotifyStepCue(prompt: string): boolean {
  return (
    isNotifyPatientResultReadyPrompt(prompt) ||
    (NOTIFY_STEP_CUE.test(prompt) && NOTIFY_READY_CUE.test(prompt))
  );
}

function countLabDayCloseStepFamilies(prompt: string): number {
  let count = 0;
  if (hasListStepCue(prompt)) count += 1;
  if (hasEnterStepCue(prompt)) count += 1;
  if (hasReleaseStepCue(prompt)) count += 1;
  if (hasNotifyStepCue(prompt)) count += 1;
  return count;
}

export function isClinicLabDayCloseCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (text.length < 32) return false;

  const fullClose = FULL_DAY_CLOSE_CUE.test(text);
  const stepFamilies = countLabDayCloseStepFamilies(text);
  if (stepFamilies < 2) return false;
  if (!fullClose && stepFamilies < 3) return false;

  return (
    fullClose ||
    stepFamilies >= 3 ||
    COMPOUND_MARKERS.test(text) ||
    /;\s*/.test(text)
  );
}

export type ClinicLabDayCloseCompoundStep = {
  action: ClinicLabDayCloseStepAction;
  params: Record<string, unknown>;
  segment: string;
};

function buildReleaseParamsForLabDayClose(
  prompt: string,
  base: Record<string, unknown>,
): Record<string, unknown> {
  const params = { ...base };
  const orderId = extractOrderIdFromPrompt(prompt);
  if (orderId && !params.orderId) params.orderId = orderId;
  const resultId = extractResultIdFromPrompt(prompt);
  if (resultId && !params.resultId) params.resultId = resultId;
  const customerName = extractReleaseCustomerNameFromPrompt(prompt);
  if (customerName && !params.customerName) params.customerName = customerName;
  return params;
}

export function buildClinicLabDayCloseCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params = enrichParamsWithSharedEntities({}, prompt);

  const listed = parseListTestOrdersFromPrompt(prompt, params);
  if (listed?.customerName) params.customerName = listed.customerName;
  if (listed?.bookingId) params.bookingId = listed.bookingId;
  if (listed?.status) params.status = listed.status;
  if (listed?.date) params.date = listed.date;
  if (listed?.dateFrom) params.dateFrom = listed.dateFrom;
  if (listed?.dateTo) params.dateTo = listed.dateTo;
  if (
    /\bfor\s+today\b|\btoday(?:'s)?\s+lab\b/i.test(prompt) ||
    /на\s+сегодня/iu.test(prompt) ||
    /այսօր(?:վա)?/iu.test(prompt)
  ) {
    params.date = params.date ?? 'today';
  }
  if (/\bpending\b/i.test(prompt) && !params.status) {
    params.status = 'AwaitingResults';
  }

  const entered = parseEnterTestResultFromPrompt(prompt, params);
  if (entered?.orderId) params.orderId = entered.orderId;
  if (entered?.resultId) params.resultId = entered.resultId;
  if (entered?.measurementCode)
    params.measurementCode = entered.measurementCode;
  if (entered?.value) params.value = entered.value;
  if (entered?.customerName && !params.customerName) {
    params.customerName = entered.customerName;
  }

  Object.assign(params, buildReleaseParamsForLabDayClose(prompt, params));
  Object.assign(params, parsePatientResultReadyParams(prompt, params));

  return params;
}

export function decomposeClinicLabDayCloseCompoundPrompt(
  prompt: string,
): ClinicLabDayCloseCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isClinicLabDayCloseCompoundPrompt(trimmed)) return [];

  const base = buildClinicLabDayCloseCompoundParams(trimmed);
  const steps: ClinicLabDayCloseCompoundStep[] = [
    {
      action: 'list_test_orders',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'enter_test_result',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'release_test_result',
      params: buildReleaseParamsForLabDayClose(trimmed, { ...base }),
      segment: trimmed,
    },
    {
      action: 'notify_patient_result_ready',
      params: { ...base },
      segment: trimmed,
    },
  ];

  return propagateCompoundStepParamsAcrossSteps(steps);
}

export function rescueClinicLabDayCloseCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isClinicLabDayCloseCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'clinic_lab_day_close_compound',
  };
}
