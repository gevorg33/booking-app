/** Extended clinic test result dashboard intents (ai-cmd-ext-2.1–2.4). */

import {
  extractVisitCustomerNameFromPrompt,
  normalizeMultilingualCustomerName,
} from './ai-clinic-test-order.util.js';

const UNICODE_WORD_SUFFIX = '[\\p{L}\\p{M}\\u055B]*';

const UPLOAD_RESULT_VERB = new RegExp(
  String.raw`\b(?:upload|attach|import)\b|(?:\p{L}*վերբեռն${UNICODE_WORD_SUFFIX}|վերբեռն${UNICODE_WORD_SUFFIX}|\p{L}*կց${UNICODE_WORD_SUFFIX}|կց${UNICODE_WORD_SUFFIX}|\p{L}*ներմուծ${UNICODE_WORD_SUFFIX}|ներմուծ${UNICODE_WORD_SUFFIX})|(?:[Зз]агруз${UNICODE_WORD_SUFFIX}|[Пп]рикреп${UNICODE_WORD_SUFFIX}|[Ии]мпорт${UNICODE_WORD_SUFFIX})`,
  'iu',
);
const EXPLAIN_RESULTS_VERB = new RegExp(
  String.raw`\b(?:explain|interpret|summarize|summary|what\s+do)\b|(?:\p{L}*բացատր${UNICODE_WORD_SUFFIX}|բացատր${UNICODE_WORD_SUFFIX}|\p{L}*ամփոփ${UNICODE_WORD_SUFFIX}|ամփոփ${UNICODE_WORD_SUFFIX}|ինչ\s+են\s+նշանակում)|(?:[Оо]бъясн${UNICODE_WORD_SUFFIX}|summary|что\s+означают|[Сс]делай\s+summary)`,
  'iu',
);
const CONFIGURE_RANGE_VERB = new RegExp(
  String.raw`\b(?:configure|set|update|change|define)\b|(?:\p{L}*կարգավոր${UNICODE_WORD_SUFFIX}|կարգավոր${UNICODE_WORD_SUFFIX}|\p{L}*սահման${UNICODE_WORD_SUFFIX}|սահման${UNICODE_WORD_SUFFIX}|\p{L}*թարմացր${UNICODE_WORD_SUFFIX}|թարմացր${UNICODE_WORD_SUFFIX})|(?:[Уу]станов${UNICODE_WORD_SUFFIX}|[Нн]астро${UNICODE_WORD_SUFFIX}|[Оо]бнов${UNICODE_WORD_SUFFIX}|[Зз]ада${UNICODE_WORD_SUFFIX})`,
  'iu',
);
const LIST_ABNORMAL_VERB = new RegExp(
  String.raw`\b(?:list|show|which|are\s+there|any)\b|(?:\p{L}*ցուցակավոր${UNICODE_WORD_SUFFIX}|ցուցակավոր${UNICODE_WORD_SUFFIX}|\p{L}*ցույց${UNICODE_WORD_SUFFIX}|ցույց${UNICODE_WORD_SUFFIX}|ո՞ր|որ${UNICODE_WORD_SUFFIX}|ինչ${UNICODE_WORD_SUFFIX})|(?:[Сс]писок${UNICODE_WORD_SUFFIX}|[Пп]окаж${UNICODE_WORD_SUFFIX}|[Кк]акие${UNICODE_WORD_SUFFIX})`,
  'iu',
);
const RESULT_FILE_NOUN = new RegExp(
  String.raw`\b(?:result|lab|report|file|document|pdf|scan)\b|(?:արդյունք|փաստաթուղթ|результат|файл|отчет)`,
  'iu',
);
const RANGE_CUE = new RegExp(
  String.raw`\b(?:reference\s+range|normal\s+range|ref\s+range)\b`,
  'iu',
);
const ABNORMAL_CUE = new RegExp(
  String.raw`\b(?:abnormal|flagged|out\s+of\s+range|critical)\b`,
  'iu',
);
const LAB_RESULT_MEASUREMENT_NOUN = new RegExp(
  String.raw`\b(?:lab|test|cbc|bmp|wbc|glucose|lipid(?:\s+panel)?)\s+results?\b|[A-Za-z][\w-]*(?:'s)\s+(?:lab|test)\s+results?\b|(?:lab|test)\s+results?\b`,
  'iu',
);

function extractOrderIdFromExtPrompt(prompt: string): string | null {
  const hashShort = prompt.match(/\border\s+#\s*([a-z0-9-]{2,})\b/i);
  if (hashShort) return hashShort[1].trim();
  const trailingOrder = prompt.match(/\b(?:lab\s+)?order\s+([a-z0-9-]{2,})\b/i);
  if (trailingOrder?.[1]) return trailingOrder[1].trim();

  const hyOrderDative = prompt.match(/([a-z0-9-]{2,})\s+պատվերին/iu);
  if (hyOrderDative?.[1]) return hyOrderDative[1].trim();

  const hyOrderFor = prompt.match(/պատվերի\s+համար\s+#?\s*([a-z0-9-]{2,})/iu);
  if (hyOrderFor?.[1]) return hyOrderFor[1].trim();

  const hyOrder = prompt.match(/պատվեր(?:ի)?\s+#?\s*([a-z0-9-]{2,})/iu);
  if (hyOrder?.[1]) return hyOrder[1].trim();

  const ruOrder = prompt.match(/(?:к\s+)?заказ(?:у)?\s+([a-z0-9-]{2,})/iu);
  if (ruOrder?.[1]) return ruOrder[1].trim();

  const ruOrderFor = prompt.match(
    /(?:для\s+)?заказ(?:а)?\s+#?\s*([a-z0-9-]{2,})/iu,
  );
  return ruOrderFor?.[1]?.trim() ?? null;
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
- list_abnormal_results: READ — clinic lab: list flagged/abnormal measurements awaiting review. Optional date range or customerName filter. NOT list_test_orders (order queue).
- HY/RU dashboard phrasing for these four intents lives in CLASSIFIER_MULTILINGUAL_RULES (CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES): upload «վերբեռնիր/загрузи», explain «բացատրիր/объясни», configure «կարգավորիր/установи», abnormal list «abnormal/flagged/out of range» with Latin measurement codes (WBC, glucose, CBC).`;

export function isUploadPatientResultPrompt(prompt: string): boolean {
  if (isManualTestResultEntryPrompt(prompt)) return false;
  return UPLOAD_RESULT_VERB.test(prompt) && RESULT_FILE_NOUN.test(prompt);
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
    /բացատրիր.*կարգավիճակ/iu.test(prompt) ||
    /объясни.*статус/iu.test(prompt)
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

  return (
    LAB_RESULT_MEASUREMENT_NOUN.test(prompt) &&
    EXPLAIN_RESULTS_VERB.test(prompt)
  );
}

export function isConfigureTestReferenceRangePrompt(prompt: string): boolean {
  const hasRangeCue = RANGE_CUE.test(prompt);
  const hasConfigureCue = CONFIGURE_RANGE_VERB.test(prompt);
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
  return hasConfigureCue && hasRangeCue;
}

export function isListAbnormalResultsPrompt(prompt: string): boolean {
  if (/\btest\s+orders?\b/i.test(prompt) && !/\babnormal\b/i.test(prompt)) {
    return false;
  }
  return (
    LIST_ABNORMAL_VERB.test(prompt) &&
    ABNORMAL_CUE.test(prompt) &&
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
    /(?:^|\s)(?:set|configure|update|change|define|կարգավորիր|սահմանիր|թարմացրու|установи|настрой|обнови|задай)\s+([A-Za-z][\w-]*)\s+(?:reference|normal)\s+range\b/iu,
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

  const codeBeforeRange = prompt.match(
    /\b([A-Za-z][\w-]*)\s+(?:reference|normal)\s+range\b/i,
  );
  if (codeBeforeRange?.[1] && !CONFIGURE_RANGE_VERB.test(codeBeforeRange[1])) {
    return codeBeforeRange[1].trim();
  }

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

  const ruFromTo = prompt.match(
    /от\s+([0-9]+(?:\.[0-9]+)?)\s+до\s+([0-9]+(?:\.[0-9]+)?)/iu,
  );
  if (ruFromTo?.[1] && ruFromTo?.[2]) {
    return { normalLow: ruFromTo[1], normalHigh: ruFromTo[2] };
  }

  const hyFromTo = prompt.match(
    /([0-9]+(?:\.[0-9]+)?)-ից\s+([0-9]+(?:\.[0-9]+)?)/iu,
  );
  if (hyFromTo?.[1] && hyFromTo?.[2]) {
    return { normalLow: hyFromTo[1], normalHigh: hyFromTo[2] };
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
      : undefined) ??
    extractOrderIdFromExtPrompt(prompt) ??
    undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractVisitCustomerNameFromPrompt(prompt) ??
    undefined;
  if (!orderId && !customerName) return null;
  return { orderId, customerName };
}

function normalizeExtCustomerName(name: string): string {
  return name.replace(/\s+(?:and|then|also|or|but)\.?\s*$/i, '').trim();
}

function extractExplainPatientNameFromPrompt(prompt: string): string | null {
  const forPatient = prompt.match(
    /\b(?:for|to)\s+patient\s+([A-Za-z][\w-]*(?:\s+(?!and\b|then\b|also\b|or\b)[A-Za-z][\w-]*)?)\b/i,
  );
  if (forPatient?.[1]) return normalizeExtCustomerName(forPatient[1]);

  const resultsFor = prompt.match(
    /\bresults?\s+for\s+([A-Za-z][\w-]*(?:\s+(?!and\b|then\b|also\b|or\b)[A-Za-z][\w-]*)?)\b/i,
  );
  if (resultsFor?.[1]) return normalizeExtCustomerName(resultsFor[1]);

  const meanFor = prompt.match(/\bmean\s+for\s+([A-Za-z][\w-]*)\b/i);
  if (meanFor?.[1]) return normalizeExtCustomerName(meanFor[1]);

  const whatDoFor = prompt.match(
    /\bwhat\s+do\b[\s\S]{0,48}\bfor\s+([A-Za-z][\w-]*(?:\s+(?!and\b|then\b|also\b|or\b)[A-Za-z][\w-]*)?)\b/i,
  );
  if (whatDoFor?.[1]) return normalizeExtCustomerName(whatDoFor[1]);

  const hyPossessiveResults = prompt.match(
    /([\p{L}]+)ի\s+(?:lab|test)\s+results?/iu,
  );
  if (hyPossessiveResults?.[1]) {
    return normalizeMultilingualCustomerName(hyPossessiveResults[1] + 'ի');
  }

  const hyForCustomer = prompt.match(/([\p{L}]{2,})-?ի\s+համար/iu);
  if (hyForCustomer?.[1]) {
    return normalizeMultilingualCustomerName(hyForCustomer[1]);
  }

  const ruResultsGenitive = prompt.match(/results?\s+([\p{L}]+)\s+простым/iu);
  if (ruResultsGenitive?.[1]) {
    return normalizeMultilingualCustomerName(ruResultsGenitive[1]);
  }

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
      : undefined) ??
    extractOrderIdFromExtPrompt(prompt) ??
    undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractExplainPatientNameFromPrompt(prompt) ??
    undefined;
  if (!orderId && !customerName) return null;
  return { orderId, customerName };
}

export function parseListAbnormalResultsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { customerName?: string; orderId?: string } | null {
  if (!isListAbnormalResultsPrompt(prompt)) return null;
  const orderId =
    (typeof params.orderId === 'string' && params.orderId.trim()
      ? params.orderId.trim()
      : undefined) ??
    extractOrderIdFromExtPrompt(prompt) ??
    undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractExplainPatientNameFromPrompt(prompt) ??
    extractVisitCustomerNameFromPrompt(prompt) ??
    undefined;
  return {
    ...(customerName ? { customerName } : {}),
    ...(orderId ? { orderId } : {}),
  };
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
      : undefined) ??
    extractMeasurementCodeFromExtPrompt(prompt) ??
    undefined;
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

/** Deterministic classifier/heuristic path when LLM labels the ext intent correctly (no rescue). */
export function detectClinicTestResultExtIntentFromPrompt(prompt: string): {
  action: ClinicTestResultExtIntent;
  params: Record<string, unknown>;
} | null {
  if (isConfigureTestReferenceRangePrompt(prompt)) {
    const parsed = parseConfigureTestReferenceRangeFromPrompt(prompt);
    if (parsed) {
      return { action: 'configure_test_reference_range', params: parsed };
    }
  }
  if (isUploadPatientResultPrompt(prompt)) {
    const parsed = parseUploadPatientResultFromPrompt(prompt);
    if (parsed) {
      return { action: 'upload_patient_result', params: parsed };
    }
  }
  if (isExplainPatientResultsPrompt(prompt)) {
    const parsed = parseExplainPatientResultsFromPrompt(prompt);
    if (parsed) {
      return { action: 'explain_patient_results', params: parsed };
    }
  }
  if (isListAbnormalResultsPrompt(prompt)) {
    const parsed = parseListAbnormalResultsFromPrompt(prompt);
    return {
      action: 'list_abnormal_results',
      params: parsed ?? {},
    };
  }
  return null;
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
  if (
    isUploadPatientResultPrompt(prompt) &&
    action !== 'upload_patient_result'
  ) {
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
