import type { CommandSurface } from './ai-command-registry.types.js';
import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import {
  extractTestOrderNamesFromPrompt,
  extractVisitCustomerNameFromPrompt,
  isCreateTestOrderPrompt,
  parseCreateTestOrderFromPrompt,
} from './ai-clinic-test-order.util.js';
import {
  extractTestNameFromResultsPrompt,
  isExplainResultStatusPrompt,
  parseExplainResultStatusFromPrompt,
} from './ai-consumer-clinic-test-results.util.js';
import {
  isNotifyPatientResultReadyPrompt,
  parsePatientResultReadyParams,
} from './ai-notification-date-format.util.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';

const UNICODE_WORD_SUFFIX = '[\\p{L}\\p{M}\\u055B]*';

const CLINIC_COMPOUND_BOOK_VERB = new RegExp(
  String.raw`\b(book|order|place|request|add|create|schedule|reserve)\b|(?:\p{L}*պատվիր${UNICODE_WORD_SUFFIX}|պատվիր${UNICODE_WORD_SUFFIX}|\p{L}*ամրագր${UNICODE_WORD_SUFFIX}|ամրագր${UNICODE_WORD_SUFFIX}|\p{L}*ավելացր${UNICODE_WORD_SUFFIX}|ավելացր${UNICODE_WORD_SUFFIX}|\p{L}*ստեղծ${UNICODE_WORD_SUFFIX}|ստեղծ${UNICODE_WORD_SUFFIX}|\p{L}*գրանց${UNICODE_WORD_SUFFIX})|(?:[Зз]акаж${UNICODE_WORD_SUFFIX}|[Зз]абронир${UNICODE_WORD_SUFFIX}|[Оо]форм${UNICODE_WORD_SUFFIX}|[Дд]обав${UNICODE_WORD_SUFFIX}|[Сс]озда${UNICODE_WORD_SUFFIX}|[Нн]азнач${UNICODE_WORD_SUFFIX}|[Зз]апиш${UNICODE_WORD_SUFFIX})`,
  'iu',
);

const CLINIC_COMPOUND_NOTIFY_VERB =
  /\b(notify|send|tell|alert|message|contact|inform)\b|տեղեկաց|ուղարկ|հաղորդ|ծանուց|уведом|сообщ|напиш|отправ/i;

const CLINIC_COMPOUND_FOLLOWUP_VERB =
  /\b(notify|alert|tell|message|send|explain)\b|տեղեկաց|ուղարկ|հաղորդ|ասա|բացատրիր|ծանուց|уведом|сообщ|напиш|отправ|скаж|объясн/i;

const CLINIC_COMPOUND_WHEN_CUE = /\bwhen\b|երբ|когда/i;

const CLINIC_COMPOUND_RESULT_READY =
  /\bresults?\s+(?:are\s+)?ready\b|\bresults?\s+(?:are\s+)?available\b|\blab\s+results?\b|\btest\s+results?\b|\bmy\s+results\b|արդյունք|результат|պատրաստ|готов|լաբորատոր/i;

const CLINIC_COMPOUND_MARKERS_MULTILINGUAL =
  /\s*;\s*|\s+և\s+|\s+եւ\s+|\s+հետո\s+|\s+ապա\s+|\s+նաև\s+|\s+и\s+|\s+затем\s+|\s+потом\s+|\s+а\s+также\s+/iu;

const CLINIC_COMPOUND_SPLIT =
  /\s*;\s*|\s+and\s+then\s+|\s+then\s+|\s+and\s+also\s+|\s+also\s+|\s+և\s+|\s+եւ\s+|\s+հետո\s+|\s+ապա\s+|\s+նաև\s+|\s+и\s+|\s+затем\s+|\s+потом\s+|\s+а\s+также\s+|\s+and\s+(?=(?:book|list|show|cancel|mark|pay|create|configure|track|add|remove|apply|notify|promo|fill|check|discover|use|get|explain|buy|choose|validate|export|summarize|trigger|switch|download|when|tell|send|alert|message|order|place|schedule|reserve|release)\b)/iu;

export const CLINIC_LAB_NOUN = new RegExp(
  String.raw`\b(lab\s+tests?|blood\s+work|cbc|bmp|lipid(?:\s+panel)?|metabolic\s+panel|panel|specimen)\b|(?:լաբորատոր|թեստ|արյան\s*աշխատանք|լիպիդ|պանել)|(?:лабораторн|анализ|липид|панел|кров)`,
  'iu',
);

function isClinicCompoundMarkerPrompt(prompt: string): boolean {
  return (
    isCompoundPrompt(prompt) ||
    CLINIC_COMPOUND_MARKERS_MULTILINGUAL.test(prompt)
  );
}

const DASHBOARD_BOOK_ACTIONS = new Set(['create_test_order']);
const DASHBOARD_FOLLOWUP_ACTIONS = new Set(['notify_patient_result_ready']);
const CONSUMER_BOOK_ACTIONS = new Set([
  'book_nearest_slot',
  'book_appointment',
]);
const CONSUMER_FOLLOWUP_ACTIONS = new Set(['explain_result_status']);

export type ClinicCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function bookActionsForSurface(surface: CommandSurface): Set<string> {
  if (surface === 'dashboard') return DASHBOARD_BOOK_ACTIONS;
  if (surface === 'public') return new Set(['book_appointment']);
  return new Set(['book_nearest_slot']);
}

function followUpActionsForSurface(surface: CommandSurface): Set<string> {
  if (surface === 'dashboard') return DASHBOARD_FOLLOWUP_ACTIONS;
  return CONSUMER_FOLLOWUP_ACTIONS;
}

export function isClinicLabBookSegment(prompt: string): boolean {
  return (
    CLINIC_COMPOUND_BOOK_VERB.test(prompt) &&
    CLINIC_LAB_NOUN.test(prompt) &&
    !CLINIC_COMPOUND_NOTIFY_VERB.test(prompt)
  );
}

export function isClinicResultFollowUpSegment(
  prompt: string,
  surface: CommandSurface,
): boolean {
  if (surface === 'dashboard') {
    if (isNotifyPatientResultReadyPrompt(prompt)) return true;
    return (
      CLINIC_COMPOUND_NOTIFY_VERB.test(prompt) &&
      CLINIC_COMPOUND_RESULT_READY.test(prompt)
    );
  }
  if (
    CLINIC_COMPOUND_FOLLOWUP_VERB.test(prompt) ||
    CLINIC_COMPOUND_WHEN_CUE.test(prompt)
  ) {
    return (
      CLINIC_COMPOUND_RESULT_READY.test(prompt) ||
      isExplainResultStatusPrompt(prompt)
    );
  }
  return false;
}

export function extractLabPanelNameFromSegment(prompt: string): string | null {
  const bookMatch = prompt.match(
    /\b(?:book|schedule|reserve|order|place|request|add|create)\b\s+(?:a|an|the)?\s*([A-Za-z][\w\s-]*?)(?:\s+(?:lab\s+test|panel|blood\s+work|visit|appointment|for\b)|$)/i,
  );
  const fromBook = bookMatch?.[1]
    ?.trim()
    .replace(/\s+(?:visit|appointment)$/i, '');
  if (fromBook && CLINIC_LAB_NOUN.test(fromBook)) {
    return fromBook.replace(/\s+panel$/i, ' panel').trim();
  }

  const named = prompt.match(
    /\b(CBC|BMP|lipid(?:\s+panel)?|metabolic\s+panel|blood\s+work)\b/i,
  );
  if (named?.[1]) return named[1].trim();

  const testNames = extractTestOrderNamesFromPrompt(prompt);
  return testNames[0] ?? null;
}

function buildDashboardBookParams(segment: string): Record<string, unknown> {
  const params = enrichParamsWithSharedEntities({}, segment);
  const parsed = parseCreateTestOrderFromPrompt(segment, params);
  if (parsed?.customerName) params.customerName = parsed.customerName;
  if (parsed?.bookingId) params.bookingId = parsed.bookingId;
  if (parsed?.testNames?.length) params.testNames = parsed.testNames;
  if (parsed?.date) params.date = parsed.date;

  if (!params.customerName) {
    const customerName = extractVisitCustomerNameFromPrompt(segment);
    if (customerName) params.customerName = customerName;
  }
  if (!params.testNames) {
    const testNames = extractTestOrderNamesFromPrompt(segment);
    if (testNames.length) params.testNames = testNames;
  }
  return params;
}

function buildConsumerBookParams(
  segment: string,
  surface: 'customer' | 'public',
): Record<string, unknown> {
  const params = enrichParamsWithSharedEntities({}, segment);
  const panel = extractLabPanelNameFromSegment(segment);
  if (panel) {
    params.serviceName = panel;
    params.testName = panel;
  }
  if (surface === 'customer') {
    params.bookingFirstAvailable = true;
  }
  return params;
}

function buildDashboardNotifyParams(segment: string): Record<string, unknown> {
  return parsePatientResultReadyParams(
    segment,
    enrichParamsWithSharedEntities({}, segment),
  );
}

function buildConsumerFollowUpParams(segment: string): Record<string, unknown> {
  const params = enrichParamsWithSharedEntities({}, segment);
  const parsed = parseExplainResultStatusFromPrompt(segment, params);
  if (parsed?.testName) params.testName = parsed.testName;
  if (parsed?.status) params.status = parsed.status;
  if (!params.testName) {
    const testName = extractTestNameFromResultsPrompt(segment);
    if (testName) params.testName = testName;
  }
  return params;
}

export function classifyClinicCompoundSegment(
  segment: string,
  surface: CommandSurface,
): ClinicCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  if (surface === 'dashboard') {
    if (isClinicResultFollowUpSegment(text, surface)) {
      return {
        action: 'notify_patient_result_ready',
        params: buildDashboardNotifyParams(text),
        segment: text,
      };
    }
    if (isCreateTestOrderPrompt(text) || isClinicLabBookSegment(text)) {
      return {
        action: 'create_test_order',
        params: buildDashboardBookParams(text),
        segment: text,
      };
    }
    return null;
  }

  if (surface === 'customer' || surface === 'public') {
    if (isClinicResultFollowUpSegment(text, surface)) {
      return {
        action: 'explain_result_status',
        params: buildConsumerFollowUpParams(text),
        segment: text,
      };
    }
    if (isClinicLabBookSegment(text)) {
      return {
        action: surface === 'public' ? 'book_appointment' : 'book_nearest_slot',
        params: buildConsumerBookParams(text, surface),
        segment: text,
      };
    }
  }

  return null;
}

function hasRequiredClinicCompoundMix(
  steps: ClinicCompoundStep[],
  surface: CommandSurface,
): boolean {
  const bookActions = bookActionsForSurface(surface);
  const followUpActions = followUpActionsForSurface(surface);
  return (
    steps.some((step) => bookActions.has(step.action)) &&
    steps.some((step) => followUpActions.has(step.action))
  );
}

export function decomposeClinicCompoundPrompt(
  prompt: string,
  surface: CommandSurface,
): ClinicCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isClinicCompoundMarkerPrompt(trimmed)) return [];

  const segments = trimmed
    .split(CLINIC_COMPOUND_SPLIT)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length <= 1) return [];

  const steps: ClinicCompoundStep[] = [];
  for (const segment of segments) {
    const step = classifyClinicCompoundSegment(segment, surface);
    if (step) steps.push(step);
  }

  if (steps.length < 2 || !hasRequiredClinicCompoundMix(steps, surface)) {
    return [];
  }

  return propagateCompoundStepParamsAcrossSteps(steps);
}

export function decomposeDashboardClinicCompoundPrompt(
  prompt: string,
): ClinicCompoundStep[] {
  return decomposeClinicCompoundPrompt(prompt, 'dashboard');
}

export function decomposeCustomerClinicCompoundPrompt(
  prompt: string,
): ClinicCompoundStep[] {
  return decomposeClinicCompoundPrompt(prompt, 'customer');
}

export function decomposePublicClinicCompoundPrompt(
  prompt: string,
): ClinicCompoundStep[] {
  return decomposeClinicCompoundPrompt(prompt, 'public');
}

export function isClinicCompoundPrompt(
  prompt: string,
  surface: CommandSurface,
): boolean {
  return decomposeClinicCompoundPrompt(prompt, surface).length >= 2;
}

export function isAnyClinicCompoundPrompt(prompt: string): boolean {
  return (
    isClinicCompoundPrompt(prompt, 'dashboard') ||
    isClinicCompoundPrompt(prompt, 'customer') ||
    isClinicCompoundPrompt(prompt, 'public')
  );
}

export function rescueClinicCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isClinicCompoundMarkerPrompt(prompt)) return null;
  if (!isAnyClinicCompoundPrompt(prompt)) return null;
  return { action: 'compound_intent', rescueReason: 'clinic_compound' };
}
