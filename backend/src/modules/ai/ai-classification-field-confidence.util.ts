import type { FieldLevelConfidence } from './ai-classification-engine.types.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type { CommandResult } from './command-completion.types.js';
import type { ValidationIssue } from './command-completion.types.js';
import { buildClarifySummary } from './command-completion.validator.js';
import {
  AVAILABILITY_FIELD_ACTIONS,
  BOOKING_FIELD_ACTIONS,
  DEFAULT_FIELD_CONFIDENCE_THRESHOLD,
  FIELD_CLARIFY_EXAMPLES,
  FIELD_CLARIFY_LABELS,
  FIELD_CLARIFY_MESSAGES,
  FIELD_CONFIDENCE_PARAM_KEYS,
  type FieldConfidenceParamKey,
} from './ai-classification-field-confidence.fixtures.js';
import { isFirstAvailableBookingPrompt } from './ai-intent-heuristics.js';
import type { ResolvedCommand } from './command-completion.types.js';
import {
  buildClarifyFieldContext,
  filterTargetedClarifyIssues,
  fieldSatisfiedForClarify,
} from './ai-targeted-clarify.util.js';

function hasBookingDate(params: Record<string, unknown>): boolean {
  return Boolean(
    params.date ||
      params.dateFrom ||
      params.dateTo ||
      (Array.isArray(params.weekdays) && params.weekdays.length > 0),
  );
}

function hasBookingService(params: Record<string, unknown>): boolean {
  return Boolean(
    params.serviceName ||
      params.serviceCategory ||
      (Array.isArray(params.serviceNames) && params.serviceNames.length > 0) ||
      params.serviceId,
  );
}

function hasBookingTime(params: Record<string, unknown>, prompt: string): boolean {
  if (params.timeSlot || params.timeFrom || params.timeOfDay) return true;
  if (params.bookingFirstAvailable === true) return true;
  if (isFirstAvailableBookingPrompt(prompt)) return true;
  return false;
}

function hasBookingProvider(params: Record<string, unknown>): boolean {
  return Boolean(
    params.employeeName ||
      params.allProviders === true ||
      params.bookingFirstAvailable === true ||
      (Array.isArray(params.providerFallbackNames) &&
        params.providerFallbackNames.length > 0) ||
      params.fallbackAnyProvider === true,
  );
}

export function isFieldRequiredForAction(
  action: string,
  field: FieldConfidenceParamKey,
): boolean {
  if (field === 'action') return true;

  if (BOOKING_FIELD_ACTIONS.has(action)) {
    if (field === 'serviceName') return true;
    if (field === 'date') return true;
    if (field === 'timeSlot') return action !== 'book_nearest_slot';
    if (field === 'employeeName') return false;
  }

  if (AVAILABILITY_FIELD_ACTIONS.has(action)) {
    if (field === 'serviceName') return true;
    if (field === 'date') return true;
    if (field === 'timeSlot') return false;
    if (field === 'employeeName') {
      return action === 'check_availability';
    }
  }

  if (action === 'cancel_bookings' || action === 'cancel_my_booking') {
    return field === 'date' || field === 'employeeName';
  }

  return false;
}

/** acc-3.6 — structured confidence per action/date/provider/service field. */
export function deriveFieldLevelConfidence(
  prompt: string,
  action: string,
  params: Record<string, unknown>,
  actionConfidence: number,
): FieldLevelConfidence {
  const mentionsDate = /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|\d{1,2}\/\d{1,2})\b/i.test(
    prompt,
  );
  const mentionsTime =
    /\b\d{1,2}:\d{2}\b/.test(prompt) ||
    /\b\d{1,2}\s*(am|pm)\b/i.test(prompt) ||
    /\b(morning|afternoon|evening|tonight)\b/i.test(prompt);
  const mentionsProvider =
    /\b(with|for)\s+[A-Za-z][\w.'-]{1,40}\b/i.test(prompt) ||
    /\b(is|are)\s+[A-Za-z][\w.'-]{1,40}\s+(available|free)\b/i.test(prompt);
  const mentionsService =
    /\b(massage|facial|haircut|lashes|service|appointment|package|treatment|facemassage|manicure|pedicure|wax)\b/i.test(
      prompt,
    );

  const datePresent = hasBookingDate(params);
  const servicePresent = hasBookingService(params);
  const timePresent = hasBookingTime(params, prompt);
  const providerPresent = hasBookingProvider(params);

  const scoreField = (
    field: FieldConfidenceParamKey,
    present: boolean,
    mentioned: boolean,
  ): number => {
    if (field === 'action') return actionConfidence;
    if (present) return 0.92;
    if (mentioned) return 0.42;
    if (isFieldRequiredForAction(action, field)) return 0.28;
    return 0.68;
  };

  return {
    action: scoreField('action', action !== 'unknown', true),
    date: scoreField('date', datePresent, mentionsDate),
    timeSlot: scoreField('timeSlot', timePresent, mentionsTime),
    employeeName: scoreField('employeeName', providerPresent, mentionsProvider),
    serviceName: scoreField('serviceName', servicePresent, mentionsService),
  };
}

export function listLowConfidenceFields(
  fieldConfidence: FieldLevelConfidence | undefined,
  action: string,
  params: Record<string, unknown>,
  threshold = DEFAULT_FIELD_CONFIDENCE_THRESHOLD,
): FieldConfidenceParamKey[] {
  if (!fieldConfidence) return [];

  const low: FieldConfidenceParamKey[] = [];
  for (const field of FIELD_CONFIDENCE_PARAM_KEYS) {
    if (field === 'action') {
      if ((fieldConfidence.action ?? 1) < threshold) low.push('action');
      continue;
    }
    if (!isFieldRequiredForAction(action, field)) continue;
    const score = fieldConfidence[field];
    if (typeof score !== 'number' || score >= threshold) continue;
    if (field === 'date' && hasBookingDate(params)) continue;
    if (field === 'serviceName' && hasBookingService(params)) continue;
    if (field === 'timeSlot' && hasBookingTime(params, '')) continue;
    if (field === 'employeeName' && hasBookingProvider(params)) continue;
    low.push(field);
  }
  return low;
}

export function fieldConfidenceToValidationIssues(
  fields: FieldConfidenceParamKey[],
): ValidationIssue[] {
  return fields
    .filter((field) => field !== 'action')
    .map((field) => ({
      field,
      label: FIELD_CLARIFY_LABELS[field],
      message: FIELD_CLARIFY_MESSAGES[field],
      example: FIELD_CLARIFY_EXAMPLES[field],
    }));
}

export function buildFieldConfidenceClarifySummary(
  fields: FieldConfidenceParamKey[],
): string {
  if (fields.includes('action')) {
    return 'I understood part of that, but I\'m not sure what you want me to do. Can you clarify the action?';
  }
  const issues = fieldConfidenceToValidationIssues(fields);
  if (issues.length === 0) {
    return 'I need one more detail before I can continue.';
  }
  return buildClarifySummary(issues);
}

export interface FieldConfidenceClarifyInput {
  prompt: string;
  surface: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  reasoning?: string;
  confidence?: number;
  fieldConfidence?: FieldLevelConfidence;
  actionThreshold?: number;
  fieldThreshold?: number;
  sessionContext?: Record<string, unknown>;
  resolved?: ResolvedCommand;
}

/** Returns targeted clarify when action is confident enough but specific params are not. */
export function buildFieldConfidenceClarifyIfNeeded(
  input: FieldConfidenceClarifyInput,
): CommandResult | null {
  const actionThreshold = input.actionThreshold ?? DEFAULT_FIELD_CONFIDENCE_THRESHOLD;
  const fieldThreshold = input.fieldThreshold ?? DEFAULT_FIELD_CONFIDENCE_THRESHOLD;
  const actionConfidence =
    input.fieldConfidence?.action ??
    input.confidence ??
    DEFAULT_FIELD_CONFIDENCE_THRESHOLD;

  if (actionConfidence < actionThreshold) {
    return null;
  }

  const resolvedFieldConfidence =
    input.fieldConfidence ??
    deriveFieldLevelConfidence(
      input.prompt,
      input.action,
      input.params,
      actionConfidence,
    );

  const fieldContext = buildClarifyFieldContext({
    params: input.params,
    prompt: input.prompt,
    sessionContext: input.sessionContext,
    resolved: input.resolved,
  });

  const lowFields = listLowConfidenceFields(
    resolvedFieldConfidence,
    input.action,
    input.params,
    fieldThreshold,
  ).filter(
    (field) => field !== 'action' && !fieldSatisfiedForClarify(field, fieldContext),
  );

  if (lowFields.length === 0) {
    return null;
  }

  const issues = filterTargetedClarifyIssues(
    fieldConfidenceToValidationIssues(lowFields),
    fieldContext,
  );
  if (issues.length === 0) return null;
  return {
    success: false,
    action: input.action,
    summary: buildFieldConfidenceClarifySummary(lowFields),
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: 'field_confidence',
      clarifyFields: lowFields,
      missing: issues,
      partialParams: input.params,
      fieldConfidence: resolvedFieldConfidence,
      lowConfidenceFields: lowFields,
      reasoning: input.reasoning,
      pipelineStage: 'clarify',
    },
  };
}

export function attachFieldConfidenceMetadata(
  prompt: string,
  surface: ClassificationSurface,
  intent: {
    action: string;
    params?: Record<string, unknown>;
    confidence?: number;
  },
  fieldConfidence: FieldLevelConfidence,
): void {
  intent.params = intent.params ?? {};
  intent.params._fieldConfidence = fieldConfidence;
  const lowFields = listLowConfidenceFields(
    fieldConfidence,
    intent.action,
    intent.params,
  );
  if (lowFields.length > 0) {
    intent.params._lowConfidenceFields = lowFields;
  } else {
    delete intent.params._lowConfidenceFields;
  }
}
