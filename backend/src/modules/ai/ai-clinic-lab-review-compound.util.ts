import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import {
  extractReleaseCustomerNameFromPrompt,
  extractOrderIdFromPrompt,
} from './ai-clinic-test-result.util.js';
import { extractVisitCustomerNameFromPrompt } from './ai-clinic-test-order.util.js';
import {
  isExplainPatientResultsPrompt,
  isListAbnormalResultsPrompt,
  parseExplainPatientResultsFromPrompt,
  parseListAbnormalResultsFromPrompt,
} from './ai-clinic-test-result-ext.util.js';

export const CLINIC_LAB_REVIEW_STEP_ACTIONS = [
  'list_abnormal_results',
  'explain_patient_results',
] as const;

export type ClinicLabReviewStepAction =
  (typeof CLINIC_LAB_REVIEW_STEP_ACTIONS)[number];

export const CLINIC_LAB_REVIEW_RECIPE_ID = 'clinic_lab_review';

const COMPOUND_MARKERS =
  /\band\s+then\b|\band\s+also\b|\bthen\b|;\s*|\s+and\s+(?=(?:list|show|explain|interpret|summarize|review)\b)/i;

const LIST_STEP_CUE = /\b(?:list|show|which|review)\b/i;
const LIST_ABNORMAL_NOUN =
  /\b(?:abnormal|flagged|out\s+of\s+range|critical)\b/i;
const LIST_RESULT_NOUN = /\b(?:results?|labs?|measurements?|flags?)\b/i;

const EXPLAIN_STEP_CUE =
  /\b(?:explain|interpret|summarize|summary|what\s+do|what\s+they\s+mean)\b/i;
const EXPLAIN_RESULT_NOUN =
  /\b(?:lab|test|cbc|bmp|wbc|glucose|lipid(?:\s+panel)?)\s+results?\b|\b(?:results?|labs?|measurements?)\b|\bwhat\s+they\s+mean\b/i;

function hasListAbnormalStepCue(prompt: string): boolean {
  if (isListAbnormalResultsPrompt(prompt)) return true;
  return (
    LIST_STEP_CUE.test(prompt) &&
    LIST_ABNORMAL_NOUN.test(prompt) &&
    LIST_RESULT_NOUN.test(prompt)
  );
}

function hasExplainResultsStepCue(prompt: string): boolean {
  if (isExplainPatientResultsPrompt(prompt)) return true;
  if (
    /\bchart\b/i.test(prompt) &&
    !/\b(?:lab|test)\s+results?\b/i.test(prompt)
  ) {
    return false;
  }
  return EXPLAIN_STEP_CUE.test(prompt) && EXPLAIN_RESULT_NOUN.test(prompt);
}

export const CLINIC_LAB_REVIEW_CLASSIFIER_RULES = `- clinic_lab_review (compound): dashboard multi-step flagged-result review — decomposes to list_abnormal_results → explain_patient_results (share customerName/orderId). Use for "lab review for Maria — list abnormal flags then explain results", "review flagged lab results and explain in plain language", "show abnormal measurements for John and explain his lab results". NOT list_abnormal_results alone when user also asks to explain/summarize; NOT explain_patient_results alone when prompt also asks to list/show abnormal/flagged results; NOT clinic_lab_day_close (orders + enter + release + notify).`;

const FULL_LAB_REVIEW_CUE =
  /\b(?:lab\s+review|review\s+(?:flagged|abnormal)|flagged\s+(?:lab\s+)?results?\s+review|abnormal\s+results?\s+review|review\s+abnormal\s+(?:lab\s+)?results?)\b/i;

function countLabReviewStepFamilies(prompt: string): number {
  let count = 0;
  if (hasListAbnormalStepCue(prompt)) count += 1;
  if (hasExplainResultsStepCue(prompt)) count += 1;
  return count;
}

export function isClinicLabReviewCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (text.length < 24) return false;

  const fullReview = FULL_LAB_REVIEW_CUE.test(text);
  const stepFamilies = countLabReviewStepFamilies(text);
  if (stepFamilies < 2) return false;

  return fullReview || COMPOUND_MARKERS.test(text) || /;\s*/.test(text);
}

export type ClinicLabReviewCompoundStep = {
  action: ClinicLabReviewStepAction;
  params: Record<string, unknown>;
  segment: string;
};

export function buildClinicLabReviewCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params = enrichParamsWithSharedEntities({}, prompt);

  const listed = parseListAbnormalResultsFromPrompt(prompt, params);
  if (listed?.customerName && !params.customerName) {
    params.customerName = listed.customerName;
  }
  if (listed?.orderId && !params.orderId) {
    params.orderId = listed.orderId;
  }

  const explained = parseExplainPatientResultsFromPrompt(prompt, params);
  if (explained?.customerName && !params.customerName) {
    params.customerName = explained.customerName;
  }
  if (explained?.orderId && !params.orderId) {
    params.orderId = explained.orderId;
  }

  if (!params.customerName) {
    const customerName =
      extractReleaseCustomerNameFromPrompt(prompt) ??
      extractVisitCustomerNameFromPrompt(prompt);
    if (customerName) params.customerName = customerName;
  }
  if (!params.orderId) {
    const orderId = extractOrderIdFromPrompt(prompt);
    if (orderId) params.orderId = orderId;
  }

  return params;
}

export function decomposeClinicLabReviewCompoundPrompt(
  prompt: string,
): ClinicLabReviewCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isClinicLabReviewCompoundPrompt(trimmed)) return [];

  const base = buildClinicLabReviewCompoundParams(trimmed);
  const steps: ClinicLabReviewCompoundStep[] = [
    {
      action: 'list_abnormal_results',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'explain_patient_results',
      params: { ...base },
      segment: trimmed,
    },
  ];

  return propagateCompoundStepParamsAcrossSteps(steps);
}

export function rescueClinicLabReviewCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isClinicLabReviewCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'clinic_lab_review_compound',
  };
}
