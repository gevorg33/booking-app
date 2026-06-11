/** Extended clinic test result dashboard intents (ai-cmd-ext-2.1–2.4). */

import { extractVisitCustomerNameFromPrompt } from './ai-clinic-test-order.util.js';

function extractOrderIdFromExtPrompt(prompt: string): string | null {
  const hashShort = prompt.match(/\border\s+#\s*([a-z0-9-]{2,})\b/i);
  if (hashShort) return hashShort[1].trim();
  const trailingOrder = prompt.match(/\b(?:lab\s+)?order\s+([a-z0-9-]{2,})\b/i);
  return trailingOrder?.[1]?.trim() ?? null;
}

function isManualTestResultEntryPrompt(prompt: string): boolean {
  return (
    /\b(?:enter|record|log|set|input|type)\b/i.test(prompt) &&
    /\b[0-9]+(?:\.[0-9]+)?\b/.test(prompt) &&
    /\b(?:order|result)\b/i.test(prompt)
  );
}

function extractPossessiveResultCustomer(prompt: string): string | null {
  const possessive = prompt.match(
    /\b([A-Za-z][\w-]*?)(?:['’]s)\s+(?:(?:lab|test)\s+)?results?\b/i,
  );
  return possessive?.[1]?.trim() ?? null;
}

export const CLINIC_TEST_RESULT_EXT_MUTATE_INTENTS = [
  'upload_patient_result',
  'configure_test_reference_range',
] as const;

export const CLINIC_TEST_RESULT_EXT_READ_INTENTS = [
  'explain_patient_results',
  'list_abnormal_results',
] as const;

export const CLINIC_TEST_RESULT_EXT_INTENTS = [
  ...CLINIC_TEST_RESULT_EXT_MUTATE_INTENTS,
  ...CLINIC_TEST_RESULT_EXT_READ_INTENTS,
] as const;

export type ClinicTestResultExtIntent =
  (typeof CLINIC_TEST_RESULT_EXT_INTENTS)[number];

export function isClinicTestResultExtIntent(
  action: string,
): action is ClinicTestResultExtIntent {
  return (CLINIC_TEST_RESULT_EXT_INTENTS as readonly string[]).includes(action);
}

export const CLINIC_TEST_RESULT_EXT_CLASSIFIER_RULES = `- upload_patient_result: MUTATE — clinic lab: attach or import a patient test result file for an order. Requires orderId or customerName + measurement context. Use "upload lab result for order #…". NOT enter_test_result (manual value entry), NOT release_test_result.
- explain_patient_results: READ — clinic lab: explain released results for a patient (plain language summary). Requires customerName or orderId. NOT explain_patient_chart (allergies/visits chart), NOT list_test_orders.
- configure_test_reference_range: MUTATE — clinic lab: set normal reference range for a measurement code. Requires measurementCode and range values. Admin/lab manager only.
- list_abnormal_results: READ — clinic lab: list flagged/abnormal measurements awaiting review. Optional date range or customerName filter. NOT list_test_orders (order queue).`;

export function isUploadPatientResultPrompt(prompt: string): boolean {
  if (isManualTestResultEntryPrompt(prompt)) return false;
  return (
    /\b(?:upload|attach|import)\b/i.test(prompt) &&
    /\b(?:result|lab|report|file|document|pdf|scan)\b/i.test(prompt)
  );
}

export function isExplainPatientResultsPrompt(prompt: string): boolean {
  if (/\bchart\b/i.test(prompt)) return false;

  if (
    /\b(?:what\s+does|why\s+is|why\s+are|when\s+will|what\s+is)\b/i.test(
      prompt,
    ) &&
    /\b(?:pending|processing|released|completed|status|showing|appear)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(?:preparation|prep|fasting|before\s+(?:the\s+)?(?:test|lab|appointment))\b/i.test(
      prompt,
    ) &&
    /\bexplain\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(?:lab\s+result|result)\s+status\b/i.test(prompt) ||
    (/բացատրիր.*կարգավիճակ/iu.test(prompt) ||
      /объясни.*статус/iu.test(prompt))
  ) {
    return false;
  }

  if (
    /\b(?:my\s+results|booking\s+page|consumer\s+app|this\s+page|my\s+account)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  const hasLabResultNoun =
    /\b(?:lab|test|cbc|bmp|wbc|glucose|lipid(?:\s+panel)?)\s+results?\b/i.test(
      prompt,
    ) ||
    /\b[A-Za-z][\w-]*(?:'s)\s+(?:lab|test)\s+results?\b/i.test(prompt);

  return (
    hasLabResultNoun &&
    /\b(?:explain|interpret|summarize|summary|what\s+do)\b/i.test(prompt)
  );
}

export function isConfigureTestReferenceRangePrompt(prompt: string): boolean {
  const hasRangeCue =
    /\b(?:reference\s+range|normal\s+range|ref\s+range)\b/i.test(prompt);
  const hasConfigureCue =
    /\b(?:configure|set|update|change|define)\b/i.test(prompt);
  if (hasRangeCue && hasConfigureCue) return true;
  if (
    hasRangeCue &&
    /\b(?:for|of)\b/i.test(prompt) &&
    /\b(?:wbc|glucose|hemoglobin|sodium|creatinine|ldl|potassium|[A-Za-z]{2,})\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  return (
    hasConfigureCue &&
    /\b(?:normal\s+range|reference\s+range)\b/i.test(prompt)
  );
}

export function isListAbnormalResultsPrompt(prompt: string): boolean {
  if (/\btest\s+orders?\b/i.test(prompt) && !/\babnormal\b/i.test(prompt)) {
    return false;
  }
  return (
    /\b(?:list|show|which|are\s+there|any)\b/i.test(prompt) &&
    /\b(?:abnormal|flagged|out\s+of\s+range|critical)\b/i.test(prompt) &&
    /\b(?:results?|labs?|measurements?)\b/i.test(prompt)
  );
}

export function extractMeasurementCodeFromExtPrompt(
  prompt: string,
): string | null {
  const forCode = prompt.match(
    /\b(?:reference\s+range|normal\s+range|ref\s+range)\s+for\s+([A-Za-z][\w-]*)\b/i,
  );
  if (forCode?.[1]) return forCode[1].trim();

  const setCode = prompt.match(
    /\b(?:set|configure|update|change|define)\s+([A-Za-z][\w-]*)\s+(?:reference|normal)\s+range\b/i,
  );
  if (setCode?.[1]) return setCode[1].trim();

  const configureFor = prompt.match(
    /\bconfigure\s+(?:test\s+)?reference\s+range\s+for\s+([A-Za-z][\w-]*)\b/i,
  );
  if (configureFor?.[1]) return configureFor[1].trim();

  const normalFor = prompt.match(
    /\bnormal\s+range\s+for\s+([A-Za-z][\w-]*)\b/i,
  );
  if (normalFor?.[1]) return normalFor[1].trim();

  const changeRef = prompt.match(
    /\bchange\s+([A-Za-z][\w-]*)\s+ref\s+range\b/i,
  );
  if (changeRef?.[1]) return changeRef[1].trim();

  const rangeOf = prompt.match(
    /\b(?:reference|normal)\s+range\s+of\s+([A-Za-z][\w-]*)\b/i,
  );
  if (rangeOf?.[1]) return rangeOf[1].trim();

  return null;
}

export function extractReferenceRangeBounds(
  prompt: string,
): { normalLow?: string; normalHigh?: string } | null {
  const fromTo = prompt.match(
    /\b(?:from|between)\s+([0-9]+(?:\.[0-9]+)?)\s+(?:to|and)\s+([0-9]+(?:\.[0-9]+)?)\b/i,
  );
  if (fromTo?.[1] && fromTo?.[2]) {
    return { normalLow: fromTo[1], normalHigh: fromTo[2] };
  }

  const lowHigh = prompt.match(
    /\blow\s+([0-9]+(?:\.[0-9]+)?)\s+high\s+([0-9]+(?:\.[0-9]+)?)\b/i,
  );
  if (lowHigh?.[1] && lowHigh?.[2]) {
    return { normalLow: lowHigh[1], normalHigh: lowHigh[2] };
  }

  const dashRange = prompt.match(
    /\b([0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)\b/,
  );
  if (dashRange?.[1] && dashRange?.[2]) {
    return { normalLow: dashRange[1], normalHigh: dashRange[2] };
  }

  const toOnly = prompt.match(
    /\b(?:range|to)\s+([0-9]+(?:\.[0-9]+)?)\s+to\s+([0-9]+(?:\.[0-9]+)?)\b/i,
  );
  if (toOnly?.[1] && toOnly?.[2]) {
    return { normalLow: toOnly[1], normalHigh: toOnly[2] };
  }

  const plainTo = prompt.match(
    /\b([0-9]+(?:\.[0-9]+)?)\s+to\s+([0-9]+(?:\.[0-9]+)?)\b/i,
  );
  if (plainTo?.[1] && plainTo?.[2]) {
    return { normalLow: plainTo[1], normalHigh: plainTo[2] };
  }

  return null;
}

export function parseUploadPatientResultFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { orderId?: string; customerName?: string } | null {
  if (!isUploadPatientResultPrompt(prompt)) return null;
  const orderId =
    (typeof params.orderId === 'string' && params.orderId.trim()
      ? params.orderId.trim()
      : undefined) ?? extractOrderIdFromExtPrompt(prompt) ?? undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractVisitCustomerNameFromPrompt(prompt) ??
    undefined;
  if (!orderId && !customerName) return null;
  return { orderId, customerName };
}

function extractExplainPatientNameFromPrompt(prompt: string): string | null {
  const forPatient = prompt.match(
    /\b(?:for|to)\s+patient\s+([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*)?)\b/i,
  );
  if (forPatient?.[1]) return forPatient[1].trim();

  const resultsFor = prompt.match(
    /\bresults?\s+for\s+([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*)?)\b/i,
  );
  if (resultsFor?.[1]) return resultsFor[1].trim();

  const meanFor = prompt.match(/\bmean\s+for\s+([A-Za-z][\w-]*)\b/i);
  if (meanFor?.[1]) return meanFor[1].trim();

  const whatDoFor = prompt.match(
    /\bwhat\s+do\b[\s\S]{0,48}\bfor\s+([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*)?)\b/i,
  );
  if (whatDoFor?.[1]) return whatDoFor[1].trim();

  return (
    extractPossessiveResultCustomer(prompt) ??
    extractVisitCustomerNameFromPrompt(prompt)
  );
}

export function parseExplainPatientResultsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { customerName?: string; orderId?: string } | null {
  if (!isExplainPatientResultsPrompt(prompt)) return null;
  const orderId =
    (typeof params.orderId === 'string' && params.orderId.trim()
      ? params.orderId.trim()
      : undefined) ?? extractOrderIdFromExtPrompt(prompt) ?? undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ?? extractExplainPatientNameFromPrompt(prompt) ?? undefined;
  if (!orderId && !customerName) return null;
  return { orderId, customerName };
}

export function parseConfigureTestReferenceRangeFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): {
  measurementCode?: string;
  normalLow?: string;
  normalHigh?: string;
} | null {
  if (!isConfigureTestReferenceRangePrompt(prompt)) return null;
  const measurementCode =
    (typeof params.measurementCode === 'string' && params.measurementCode.trim()
      ? params.measurementCode.trim()
      : undefined) ?? extractMeasurementCodeFromExtPrompt(prompt) ?? undefined;
  const bounds = extractReferenceRangeBounds(prompt);
  const normalLow =
    (typeof params.normalLow === 'string' && params.normalLow.trim()
      ? params.normalLow.trim()
      : typeof params.normalLow === 'number'
        ? String(params.normalLow)
        : undefined) ?? bounds?.normalLow;
  const normalHigh =
    (typeof params.normalHigh === 'string' && params.normalHigh.trim()
      ? params.normalHigh.trim()
      : typeof params.normalHigh === 'number'
        ? String(params.normalHigh)
        : undefined) ?? bounds?.normalHigh;
  if (!measurementCode) return null;
  return { measurementCode, normalLow, normalHigh };
}

export function rescueClinicTestResultExtIntent(
  prompt: string,
  action: string,
): { action: ClinicTestResultExtIntent; rescueReason: string } | null {
  if (isClinicTestResultExtIntent(action)) return null;

  if (
    isConfigureTestReferenceRangePrompt(prompt) &&
    action !== 'configure_test_reference_range'
  ) {
    return {
      action: 'configure_test_reference_range',
      rescueReason: 'configure_test_reference_range',
    };
  }
  if (isUploadPatientResultPrompt(prompt) && action !== 'upload_patient_result') {
    return {
      action: 'upload_patient_result',
      rescueReason: 'upload_patient_result',
    };
  }
  if (
    isExplainPatientResultsPrompt(prompt) &&
    action !== 'explain_patient_results'
  ) {
    return {
      action: 'explain_patient_results',
      rescueReason: 'explain_patient_results',
    };
  }
  if (
    isListAbnormalResultsPrompt(prompt) &&
    action !== 'list_abnormal_results'
  ) {
    return {
      action: 'list_abnormal_results',
      rescueReason: 'list_abnormal_results',
    };
  }
  return null;
}
