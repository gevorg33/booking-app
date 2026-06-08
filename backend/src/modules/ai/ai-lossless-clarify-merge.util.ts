import type { ClassificationSurface } from './ai-classification-engine.types.js';
import {
  applyClarifyMemoryToParams,
  mergeClarifyMemoryRecord,
  readClarifyMemory,
  recordClarifyAnswerInSession,
} from './ai-clarify-answer-reuse.util.js';
import {
  accumulateCrossTurnPartialParams,
  mergeCrossTurnClarifyParams,
  mergeCrossTurnClarifyPrompt,
  readClarifyCrossTurnContext,
  restoreOriginalIntentFromClarifySession,
} from './ai-clarify-cross-turn-merge.util.js';
import type { ResolvedCommand } from './command-completion.types.js';
import {
  hasRequiredBookingDate,
  hasRequiredBookingStartTime,
  isBookingFirstAvailable,
} from './booking-time-completion.util.js';
import {
  shouldValidateAction,
  validateCommand,
} from './command-completion.validator.js';
import {
  shouldValidateProviderAction,
  validateProviderCommand,
} from './provider-command-completion.validator.js';
import {
  normalizeClarifyFollowUpAnswers,
  normalizeClarifyFollowUpForMerge,
} from './ai-clarify-followup-normalization.util.js';

const STRUCTURED_CLARIFY_FIELD_PATTERNS: Array<{ field: string; pattern: RegExp }> = [
  { field: 'employeeName', pattern: /\b(?:provider|employee|stylist)\s*:\s*(.+?)(?=\.\s|$)/i },
  { field: 'serviceName', pattern: /\bservice\s*:\s*(.+?)(?=\.\s|$)/i },
  { field: 'customerName', pattern: /\bcustomer\s*:\s*(.+?)(?=\.\s|$)/i },
  { field: 'date', pattern: /\bdate\s*:\s*(.+?)(?=\.\s|$)/i },
  { field: 'timeSlot', pattern: /\b(?:time slot|time)\s*:\s*(.+?)(?=\.\s|$)/i },
];

export interface LosslessClarifyMergeResult {
  mergedPrompt: string;
  mergedParams: Record<string, unknown>;
  restoredAction: string;
  accumulatedPartialParams: Record<string, unknown>;
  sessionContext: Record<string, unknown>;
  executeImmediately: boolean;
}

/** Parse structured clarify form answers embedded in NL follow-ups (n99-1.1 / n99-1.3). */
export function parseStructuredClarifyAnswersFromPrompt(
  prompt: string,
): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const { field, pattern } of STRUCTURED_CLARIFY_FIELD_PATTERNS) {
    const match = prompt.match(pattern);
    if (match?.[1]?.trim()) {
      answers[field] = match[1].trim();
    }
  }

  const meant = prompt.match(/\bI meant\s+(.+?)(?=\.\s|$)/i);
  if (meant?.[1]?.trim()) {
    if (!answers.employeeName && !answers.serviceName && !answers.customerName) {
      answers.employeeName = meant[1].trim();
    }
  }

  return answers;
}

export function enrichSessionWithLosslessClarifyPartials(
  sessionContext: Record<string, unknown>,
): Record<string, unknown> {
  const ctx = readClarifyCrossTurnContext(sessionContext);
  const memory = readClarifyMemory(sessionContext);
  if (!ctx || !Object.keys(memory).length) return sessionContext;

  return {
    ...sessionContext,
    _clarifyContext: {
      ...ctx,
      partialParams: accumulateCrossTurnPartialParams(memory, sessionContext),
    },
  };
}

export function buildSyntheticResolvedForClarifyCheck(
  action: string,
  prompt: string,
  params: Record<string, unknown>,
  businessId = 'lossless-clarify-check',
): ResolvedCommand {
  return {
    action,
    prompt,
    businessId,
    params,
    enrichedParams: { ...params },
    entities: {
      employees: [],
      services: [],
    },
    reasoning: 'lossless-clarify-merge',
  };
}

function hasSelfServiceBookingParams(params: Record<string, unknown>): boolean {
  return (
    !!(params.serviceName || params.serviceId) &&
    hasRequiredBookingDate(params) &&
    hasRequiredBookingStartTime(params)
  );
}

function hasDashboardBookingParams(params: Record<string, unknown>): boolean {
  const anyProvider = params.allProviders === true;
  const firstAvailable = isBookingFirstAvailable(params);
  const fallbackNames = params.providerFallbackNames;
  const hasFallbackChain =
    params.fallbackAnyProvider === true ||
    (Array.isArray(fallbackNames) && fallbackNames.length > 0) ||
    (Array.isArray(params.employeeNames) && params.employeeNames.length >= 2);
  const hasProvider =
    !!(params.employeeName || params.employeeId) ||
    anyProvider ||
    firstAvailable ||
    hasFallbackChain;

  return (
    hasProvider &&
    !!(params.serviceName || params.serviceId) &&
    hasRequiredBookingDate(params) &&
    hasRequiredBookingStartTime(params)
  );
}

/** n99-1.4 — merged command validates cleanly → execute without another clarify turn. */
export function shouldExecuteClarifyImmediately(
  action: string,
  prompt: string,
  params: Record<string, unknown>,
  surface: ClassificationSurface = 'dashboard',
): boolean {
  if (action === 'book_appointment') {
    return hasSelfServiceBookingParams(params);
  }
  if (action === 'create_booking') {
    return hasDashboardBookingParams(params);
  }
  if (surface === 'provider' && shouldValidateProviderAction(action)) {
    return validateProviderCommand(action, params).ok;
  }
  if (!shouldValidateAction(action)) return false;
  return validateCommand(buildSyntheticResolvedForClarifyCheck(action, prompt, params)).ok;
}

export function applyLosslessMergeToResolved(
  resolved: ResolvedCommand,
  sessionContext?: Record<string, unknown>,
  surface: ClassificationSurface = 'dashboard',
): ResolvedCommand {
  const mergedParams = mergeCrossTurnClarifyParams(resolved.params, sessionContext, { surface });
  const mergedEnriched = mergeCrossTurnClarifyParams(
    resolved.enrichedParams ?? resolved.params,
    sessionContext,
    { surface },
  );
  return {
    ...resolved,
    params: mergedParams,
    enrichedParams: mergedEnriched,
  };
}

/** acc-4.5 / n99-1.4 — lossless slot merge into the original intent. */
export function mergeLosslessClarifyFollowUp(input: {
  followUpPrompt: string;
  followUpAnswers?: Record<string, string>;
  sessionContext?: Record<string, unknown>;
  surface?: ClassificationSurface;
  classifierAction?: string;
  classifierParams?: Record<string, unknown>;
}): LosslessClarifyMergeResult {
  const normalizedPrompt = normalizeClarifyFollowUpForMerge(input.followUpPrompt);
  const parsedAnswers = parseStructuredClarifyAnswersFromPrompt(normalizedPrompt);
  const normalizedParsed = normalizeClarifyFollowUpAnswers(parsedAnswers);
  const normalizedIncoming = normalizeClarifyFollowUpAnswers(input.followUpAnswers ?? {});
  const incomingAnswers = mergeClarifyMemoryRecord(
    mergeClarifyMemoryRecord(readClarifyMemory(input.sessionContext), normalizedParsed),
    normalizedIncoming,
  );

  let sessionContext = recordClarifyAnswerInSession(
    input.sessionContext ?? {},
    incomingAnswers,
  );
  sessionContext = enrichSessionWithLosslessClarifyPartials(sessionContext);

  const ctx = readClarifyCrossTurnContext(sessionContext);
  const intent = restoreOriginalIntentFromClarifySession(
    {
      action: input.classifierAction ?? ctx?.originalAction ?? 'unknown',
      params: { ...(input.classifierParams ?? {}) },
    },
    sessionContext,
  );

  let mergedParams = mergeCrossTurnClarifyParams(intent.params ?? {}, sessionContext, {
    surface: input.surface,
  });
  mergedParams = applyClarifyMemoryToParams(mergedParams, sessionContext);
  for (const [field, value] of Object.entries(incomingAnswers)) {
    if (value.trim()) mergedParams[field] = value.trim();
  }

  const mergedPrompt = mergeCrossTurnClarifyPrompt(normalizedPrompt, sessionContext);
  const accumulatedPartialParams = readClarifyPartialParamsFromSession(sessionContext);
  const executeImmediately = shouldExecuteClarifyImmediately(
    intent.action,
    mergedPrompt,
    mergedParams,
    input.surface,
  );

  return {
    mergedPrompt,
    mergedParams,
    restoredAction: intent.action,
    accumulatedPartialParams,
    sessionContext,
    executeImmediately,
  };
}

function readClarifyPartialParamsFromSession(
  sessionContext: Record<string, unknown>,
): Record<string, unknown> {
  const ctx = readClarifyCrossTurnContext(sessionContext);
  return { ...(ctx?.partialParams ?? {}) };
}

export function isClarifyFollowUpTurn(
  sessionContext?: Record<string, unknown>,
): boolean {
  const ctx = readClarifyCrossTurnContext(sessionContext);
  return (ctx?.clarifyRound ?? 0) >= 1;
}
