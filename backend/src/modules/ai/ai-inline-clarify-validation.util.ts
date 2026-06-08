import { applyRelativeDateFromPrompt } from '../../common/utils/date-format.util.js';
import { normalizeTime24, isValidTime24 } from '../../common/utils/time-format.util.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import {
  mergeClarifyMemoryRecord,
  readClarifyMemory,
  type ClarifyAnswerReuseContext,
} from './ai-clarify-answer-reuse.util.js';
import { readClarifyCrossTurnContext } from './ai-clarify-cross-turn-merge.util.js';
import {
  isClarifyFollowUpTurn,
  parseStructuredClarifyAnswersFromPrompt,
} from './ai-lossless-clarify-merge.util.js';
import { normalizeClarifyAnswerForValidation } from './ai-clarify-followup-normalization.util.js';
import { MULTILINGUAL_TOMORROW } from './ai-check-and-book-multilingual.util.js';
import { extractSingleIsoDayFromPrompt } from './ai-orchestration.helpers.js';
import type { CommandResult } from './command-completion.types.js';

export interface InlineClarifyValidationResult {
  valid: boolean;
  normalizedAnswer?: string;
  hint?: string;
  rejectedField?: string;
}

const VAGUE_ANSWER =
  /^(?:maybe|somewhere|sometime|some\s?time|idk|i\s?don'?t\s?know|not\s?sure|anything|whatever|\?+|later|soon)$/i;

const DATE_FIELDS = new Set(['date', 'dateFrom', 'dateTo']);
const TIME_FIELDS = new Set(['timeSlot', 'timeFrom', 'timeTo']);
const ENTITY_FIELDS = new Set(['employeeName', 'serviceName', 'customerName', 'templateName']);

function fieldLabel(field: string): string {
  switch (field) {
    case 'employeeName':
      return 'service provider';
    case 'serviceName':
      return 'service';
    case 'customerName':
      return 'customer';
    case 'date':
    case 'dateFrom':
    case 'dateTo':
      return 'date';
    case 'timeSlot':
    case 'timeFrom':
    case 'timeTo':
      return 'time';
    default:
      return field;
  }
}

function parseClarifyDateAnswer(
  answer: string,
  timeZone: string,
): string | null {
  const trimmed = answer.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/\btomorrow\b/i.test(trimmed) || MULTILINGUAL_TOMORROW.test(trimmed)) {
    const probe: Record<string, unknown> = {};
    applyRelativeDateFromPrompt(probe, 'tomorrow', timeZone);
    return typeof probe.date === 'string' ? probe.date : null;
  }
  if (/\btoday\b/i.test(trimmed)) {
    const probe: Record<string, unknown> = {};
    applyRelativeDateFromPrompt(probe, 'today', timeZone);
    return typeof probe.date === 'string' ? probe.date : null;
  }
  return (
    extractSingleIsoDayFromPrompt(answer, timeZone) ??
    (() => {
      const probe: Record<string, unknown> = {};
      applyRelativeDateFromPrompt(probe, answer, timeZone);
      return typeof probe.date === 'string' ? probe.date : null;
    })()
  );
}

function parseClarifyTimeAnswer(answer: string): string | null {
  const match = answer.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return null;
  const candidate = normalizeTime24(
    `${match[1]}:${match[2] ?? '00'}${match[3] ? ` ${match[3]}` : ''}`,
  );
  return isValidTime24(candidate) ? candidate : null;
}

function normalizeClarifyAnswer(answer: string, field?: string): string {
  return normalizeClarifyAnswerForValidation(answer, field);
}

/** n99-1.5 — reject unresolved clarify answers before re-running classify. */
export function validateInlineClarifyFollowUp(input: {
  field?: string;
  answer: string;
  timeZone?: string;
}): InlineClarifyValidationResult {
  const normalizedAnswer = normalizeClarifyAnswer(input.answer, input.field);
  const trimmed = normalizedAnswer.trim();
  if (!trimmed) {
    return {
      valid: false,
      normalizedAnswer,
      hint: 'Please choose or enter a value.',
      rejectedField: input.field,
    };
  }

  const field = input.field ?? '';
  const timeZone = input.timeZone ?? 'UTC';

  if (DATE_FIELDS.has(field)) {
    if (VAGUE_ANSWER.test(trimmed) || !parseClarifyDateAnswer(normalizedAnswer, timeZone)) {
      return {
        valid: false,
        normalizedAnswer,
        hint: 'Pick a specific date (for example tomorrow or 2026-06-10).',
        rejectedField: field,
      };
    }
    return { valid: true, normalizedAnswer };
  }

  if (TIME_FIELDS.has(field)) {
    if (VAGUE_ANSWER.test(trimmed) || !parseClarifyTimeAnswer(normalizedAnswer)) {
      return {
        valid: false,
        normalizedAnswer,
        hint: 'Pick a specific time (for example 10:00 or 2pm).',
        rejectedField: field,
      };
    }
    return { valid: true, normalizedAnswer };
  }

  if (VAGUE_ANSWER.test(trimmed)) {
    return {
      valid: false,
      normalizedAnswer,
      hint: 'Please choose or enter a value.',
      rejectedField: input.field,
    };
  }

  if (ENTITY_FIELDS.has(field) && trimmed.length < 2) {
    return {
      valid: false,
      normalizedAnswer,
      hint: `Pick a specific ${fieldLabel(field)} from the list or type the full name.`,
      rejectedField: field,
    };
  }

  return { valid: true, normalizedAnswer };
}

export function readClarifyFieldsFromSession(
  sessionContext?: Record<string, unknown>,
): string[] {
  const ctx = readClarifyCrossTurnContext(sessionContext) as
    | (ClarifyAnswerReuseContext & { clarifyFields?: string[] })
    | undefined;
  if (Array.isArray(ctx?.clarifyFields) && ctx.clarifyFields.length > 0) {
    return ctx.clarifyFields;
  }
  return Object.keys(readClarifyMemory(sessionContext));
}

export function collectClarifyFollowUpAnswers(input: {
  prompt: string;
  sessionContext?: Record<string, unknown>;
}): Record<string, string> {
  const structured = parseStructuredClarifyAnswersFromPrompt(input.prompt);
  return mergeClarifyMemoryRecord(readClarifyMemory(input.sessionContext), structured);
}

/** n99-1.5 — validate all clarify answers on a follow-up turn before classify. */
export function validateClarifyFollowUpAnswers(input: {
  prompt: string;
  sessionContext?: Record<string, unknown>;
  timeZone?: string;
}): InlineClarifyValidationResult {
  if (!isClarifyFollowUpTurn(input.sessionContext)) {
    return { valid: true };
  }

  const fields = readClarifyFieldsFromSession(input.sessionContext);
  const answers = collectClarifyFollowUpAnswers(input);
  const timeZone = input.timeZone ?? 'UTC';

  if (fields.length === 0) {
    return validateInlineClarifyFollowUp({
      answer: input.prompt,
      timeZone,
    });
  }

  if (fields.length === 1) {
    const field = fields[0]!;
    const answer = answers[field] ?? input.prompt;
    return validateInlineClarifyFollowUp({
      field,
      answer: normalizeClarifyAnswer(answer, field),
      timeZone,
    });
  }

  for (const field of fields) {
    const answer = answers[field];
    if (!answer?.trim()) {
      return {
        valid: false,
        hint: `Please fill in ${fieldLabel(field)} before continuing.`,
        rejectedField: field,
      };
    }
    const result = validateInlineClarifyFollowUp({
      field,
      answer: normalizeClarifyAnswer(answer, field),
      timeZone,
    });
    if (!result.valid) return result;
  }

  return { valid: true };
}

/** n99-1.5 — block classify re-run when the clarify answer still does not resolve. */
export function buildInvalidClarifyFollowUpResult(input: {
  validation: InlineClarifyValidationResult;
  sessionContext: Record<string, unknown>;
  surface?: ClassificationSurface;
  action?: string;
}): CommandResult {
  const ctx = readClarifyCrossTurnContext(input.sessionContext);
  const hint =
    input.validation.hint ??
    'That answer did not work. Please pick a specific value and try again.';

  return {
    success: false,
    action: input.action ?? ctx?.originalAction ?? 'clarify',
    summary: hint,
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: 'inline_validation',
      clarifyKind: ctx?.clarifyKind ?? 'targeted_slots',
      inlineValidationRejected: true,
      validationHint: hint,
      rejectedField: input.validation.rejectedField,
      pipelineStage: 'clarify',
      surface: input.surface,
      sessionContext: input.sessionContext,
      clarifyContext: ctx,
    },
  };
}

export function rejectInvalidClarifyFollowUpIfNeeded(input: {
  prompt: string;
  sessionContext?: Record<string, unknown>;
  timeZone?: string;
  surface?: ClassificationSurface;
}): CommandResult | null {
  const sessionContext = input.sessionContext ?? {};
  const validation = validateClarifyFollowUpAnswers({
    prompt: input.prompt,
    sessionContext,
    timeZone: input.timeZone,
  });
  if (validation.valid) return null;
  return buildInvalidClarifyFollowUpResult({
    validation,
    sessionContext,
    surface: input.surface,
  });
}
