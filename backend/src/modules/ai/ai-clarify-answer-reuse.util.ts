import type { EntityMemoryEntry } from './ai-settings.types.js';
import { normalizeEntityAlias } from './ai-entity-memory.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildClarifyFieldContext,
  fieldSatisfiedForClarify,
} from './ai-targeted-clarify.util.js';
import type { ValidationIssue } from './command-completion.types.js';

export const CLARIFY_MEMORY_FIELD_IDS = [
  'employeeName',
  'serviceName',
  'customerName',
  'date',
  'dateFrom',
  'dateTo',
  'timeSlot',
  'timeFrom',
  'timeTo',
  'templateName',
] as const;

export type ClarifyMemoryFieldId = (typeof CLARIFY_MEMORY_FIELD_IDS)[number];

function paramHasValue(params: Record<string, unknown>, field: string): boolean {
  const value = params[field];
  if (value == null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function readClarifyMemory(
  sessionContext?: Record<string, unknown>,
): Record<string, string> {
  const memory = sessionContext?._clarifyMemory;
  if (!memory || typeof memory !== 'object') return {};
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(memory as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) normalized[key] = value.trim();
  }
  return normalized;
}

export function mergeClarifyMemoryRecord(
  prior?: Record<string, string>,
  incoming?: Record<string, string>,
): Record<string, string> {
  return { ...(prior ?? {}), ...(incoming ?? {}) };
}

/** acc-4.4 — persist answered clarify fields for the session. */
export function recordClarifyAnswerInSession(
  sessionContext: Record<string, unknown> | undefined,
  answers: Record<string, string>,
): Record<string, unknown> {
  return syncSessionContextFromClarifyMemory({
    ...(sessionContext ?? {}),
    _clarifyMemory: mergeClarifyMemoryRecord(
      readClarifyMemory(sessionContext),
      answers,
    ),
  });
}

export function absorbIncomingClarifyAnswers(
  sessionContext?: Record<string, unknown>,
  incomingAnswers?: Record<string, string>,
): Record<string, unknown> {
  if (!incomingAnswers || Object.keys(incomingAnswers).length === 0) {
    return syncSessionContextFromClarifyMemory(sessionContext ?? {});
  }
  return recordClarifyAnswerInSession(sessionContext, incomingAnswers);
}

/** Mirror clarify memory onto top-level session keys used by SESSION_INHERIT. */
export function syncSessionContextFromClarifyMemory(
  sessionContext: Record<string, unknown>,
): Record<string, unknown> {
  const memory = readClarifyMemory(sessionContext);
  if (!Object.keys(memory).length) return sessionContext;

  const next: Record<string, unknown> = {
    ...sessionContext,
    _clarifyMemory: memory,
  };
  for (const field of CLARIFY_MEMORY_FIELD_IDS) {
    const value = memory[field];
    if (value && !paramHasValue(next, field)) {
      next[field] = value;
    }
  }
  return next;
}

export function promoteParamsToClarifyMemory(
  params: Record<string, unknown>,
  priorMemory?: Record<string, string>,
): Record<string, string> {
  const memory = { ...(priorMemory ?? {}) };
  for (const field of CLARIFY_MEMORY_FIELD_IDS) {
    const value = params[field];
    if (typeof value === 'string' && value.trim()) {
      memory[field] = value.trim();
    }
  }
  return memory;
}

/** acc-4.4 — apply persisted clarify answers before classify / clarify / validate. */
export function applyClarifyMemoryToParams(
  params: Record<string, unknown>,
  sessionContext?: Record<string, unknown>,
): Record<string, unknown> {
  const memory = readClarifyMemory(sessionContext);
  if (!Object.keys(memory).length) return params;

  const merged = { ...params };
  for (const field of CLARIFY_MEMORY_FIELD_IDS) {
    const value = memory[field];
    if (value && !paramHasValue(merged, field)) {
      merged[field] = value;
      merged._clarifyAnswerSource = 'session_memory';
    }
  }
  return merged;
}

export type ClarifyAnswerReuseContext = {
  originalPrompt: string;
  originalAction: string;
  partialParams: Record<string, unknown>;
  clarifyRound: number;
  clarifyKind: string;
  clarifyFields?: string[];
};

export function buildAnswerReuseSessionContext(
  priorSession: Record<string, unknown> | undefined,
  options: {
    partialParams?: Record<string, unknown>;
    clarifyContext?: ClarifyAnswerReuseContext;
    incomingMemory?: Record<string, string>;
  },
): Record<string, unknown> {
  const priorMemory = mergeClarifyMemoryRecord(
    readClarifyMemory(priorSession),
    options.incomingMemory,
  );
  const promoted = promoteParamsToClarifyMemory(
    options.partialParams ?? {},
    priorMemory,
  );

  return syncSessionContextFromClarifyMemory({
    ...(priorSession ?? {}),
    _clarifyContext: options.clarifyContext ?? priorSession?._clarifyContext,
    _clarifyMemory: promoted,
    ...(options.partialParams ?? {}),
  });
}

export function buildSmartClarifyAnswerReuseSessionContext(
  priorSession: Record<string, unknown> | undefined,
  clarifyResult: CommandResult,
): Record<string, unknown> {
  const ctx = clarifyResult.details.clarifyContext as
    | ClarifyAnswerReuseContext
    | undefined;
  const partialParams =
    ctx?.partialParams ??
    (clarifyResult.details.partialParams as Record<string, unknown> | undefined) ??
    {};
  const clarifyFields = Array.isArray(clarifyResult.details.clarifyFields)
    ? (clarifyResult.details.clarifyFields as string[])
    : Array.isArray(clarifyResult.details.missing)
      ? (clarifyResult.details.missing as Array<{ field: string }>).map(
          (issue) => issue.field,
        )
      : undefined;
  const clarifyContext = ctx
    ? {
        ...ctx,
        ...(clarifyFields?.length ? { clarifyFields } : {}),
      }
    : undefined;
  return buildAnswerReuseSessionContext(priorSession, {
    partialParams,
    clarifyContext,
    incomingMemory: readClarifyMemory(priorSession),
  });
}

export function fieldAnsweredInClarifySession(
  field: string,
  sessionContext?: Record<string, unknown>,
  params?: Record<string, unknown>,
): boolean {
  const memory = readClarifyMemory(sessionContext);
  if (memory[field]?.trim()) return true;
  if (params && paramHasValue(params, field)) return true;
  return fieldSatisfiedForClarify(
    field,
    buildClarifyFieldContext({
      params: params ?? {},
      sessionContext,
    }),
  );
}

export function filterIssuesAnsweredInSession(
  issues: ValidationIssue[],
  sessionContext?: Record<string, unknown>,
  params?: Record<string, unknown>,
): ValidationIssue[] {
  return issues.filter(
    (issue) => !fieldAnsweredInClarifySession(issue.field, sessionContext, params),
  );
}

/** acc-4.4 + ai-i2 — turn chip/form answers into reusable business aliases. */
export function extractClarifyMemoryEntityAliases(
  prompt: string,
  clarifyMemory: Record<string, string>,
): Record<string, EntityMemoryEntry> {
  const aliases: Record<string, EntityMemoryEntry> = {};
  const lower = prompt.toLowerCase();

  if (clarifyMemory.employeeName?.trim()) {
    const employeeName = clarifyMemory.employeeName.trim();
    const nickname = normalizeEntityAlias(employeeName.split(/\s+/)[0] ?? '');
    if (nickname.length > 2 && lower.includes(nickname)) {
      aliases[nickname] = {
        employeeName,
        serviceName: clarifyMemory.serviceName ?? null,
        customerName: clarifyMemory.customerName ?? null,
      };
    }
  }

  if (clarifyMemory.customerName?.trim()) {
    const customerName = clarifyMemory.customerName.trim();
    const first = normalizeEntityAlias(customerName.split(/\s+/)[0] ?? '');
    if (first.length > 2 && lower.includes(first)) {
      aliases[first] = {
        customerName,
        employeeName: clarifyMemory.employeeName ?? null,
        serviceName: clarifyMemory.serviceName ?? null,
      };
    }
  }

  if (clarifyMemory.serviceName?.trim()) {
    const serviceName = clarifyMemory.serviceName.trim();
    const firstWord = normalizeEntityAlias(serviceName.split(/\s+/)[0] ?? '');
    if (firstWord.length > 3 && lower.includes(firstWord)) {
      aliases[firstWord] = {
        serviceName,
        employeeName: clarifyMemory.employeeName ?? null,
        customerName: clarifyMemory.customerName ?? null,
      };
    }
    for (const token of lower.split(/[^a-z0-9]+/)) {
      if (token.length < 4) continue;
      if (!serviceName.toLowerCase().includes(token)) continue;
      aliases[token] = {
        serviceName,
        employeeName: clarifyMemory.employeeName ?? null,
        customerName: clarifyMemory.customerName ?? null,
      };
    }
  }

  return aliases;
}

export function mergeClarifyMemoryIntoLearnPayload(
  payload: Record<string, unknown>,
  sessionContext?: Record<string, unknown>,
): Record<string, unknown> {
  const memory = readClarifyMemory(sessionContext);
  if (!Object.keys(memory).length) return payload;
  return {
    ...payload,
    ...memory,
    _clarifyMemory: memory,
  };
}
