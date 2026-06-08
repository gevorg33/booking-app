import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiEvalLabelQueue } from './entities/ai-eval-label-queue.entity.js';
import type {
  ClarifyPromptFix,
  EntityMemoryEntry,
  LearnedTelemetryRescueRule,
} from './ai-settings.types.js';
import {
  FAILURE_CLOSURE_SCENARIOS,
  type FailureFixStatus,
  type FailureFixType,
} from './ai-failure-closure.fixtures.js';
import { normalizeBusinessParaphrasePrompt } from './ai-business-paraphrase.util.js';

export {
  FAILURE_CLOSURE_SCENARIOS,
  type FailureFixStatus,
  type FailureFixType,
} from './ai-failure-closure.fixtures.js';

export interface FailureClosurePlan {
  fixType: FailureFixType;
  fixStatus: FailureFixStatus;
  fixRef: string;
  evalCaseId?: string;
  summary: string;
}

export interface FailureClosureInput {
  classifiedAction: string;
  correctedAction?: string | null;
  expectedAction?: string | null;
  expectedRescuedAction?: string | null;
  labelOutcome?: 'execution' | 'clarify';
  expectedClarifyFields?: string[] | null;
  expectedParams?: Record<string, unknown> | null;
  evalCaseId?: string | null;
}

/** acc-6.2 — map triaged label to eval case + fix track. */
export function inferFailureFixType(
  input: FailureClosureInput,
): FailureFixType {
  if (input.labelOutcome === 'clarify') return 'prompt';
  if (
    input.expectedRescuedAction &&
    input.expectedRescuedAction !== input.classifiedAction
  ) {
    return 'rescue';
  }
  if (
    input.expectedParams &&
    (input.expectedParams.customerName ||
      input.expectedParams.employeeName ||
      input.expectedParams.serviceName)
  ) {
    return 'alias';
  }
  if (input.correctedAction && input.correctedAction !== input.classifiedAction) {
    return 'fewshot';
  }
  return 'fewshot';
}

export function buildFailureClosurePlan(
  input: FailureClosureInput,
): FailureClosurePlan {
  const fixType = inferFailureFixType(input);
  const action =
    input.expectedRescuedAction ??
    input.expectedAction ??
    input.correctedAction ??
    input.classifiedAction;

  const fixRef =
    fixType === 'rescue'
      ? `telemetry-rescue:${input.classifiedAction}->${action}`
      : fixType === 'alias'
        ? `entity-alias:${JSON.stringify(input.expectedParams ?? {})}`
        : fixType === 'prompt'
          ? `clarify:${(input.expectedClarifyFields ?? []).join(',') || action}`
          : `fewshot:${action}`;

  return {
    fixType,
    fixStatus: 'open',
    fixRef,
    evalCaseId: input.evalCaseId ?? undefined,
    summary: `Track ${fixType} fix for ${action} (${fixRef})`,
  };
}

export function markFailureClosureApplied(
  plan: FailureClosurePlan,
): FailureClosurePlan {
  return { ...plan, fixStatus: 'applied' };
}

export function buildLearnedTelemetryRescueRule(
  row: Pick<
    AiEvalLabelQueue,
    | 'promptHash'
    | 'promptSnippet'
    | 'surface'
    | 'classifiedAction'
    | 'expectedRescuedAction'
    | 'correctedAction'
    | 'expectedAction'
    | 'rescueFromAction'
    | 'evalCaseId'
  >,
): LearnedTelemetryRescueRule | null {
  const toAction =
    row.expectedRescuedAction ?? row.correctedAction ?? row.expectedAction;
  const fromAction = row.rescueFromAction ?? row.classifiedAction;
  if (!toAction || toAction === fromAction) return null;

  return {
    id: `learned-${row.promptHash.slice(0, 16)}`,
    fromAction,
    toAction,
    rescueReason: `failure_closure:${fromAction}_to_${toAction}`,
    promptSnippet: row.promptSnippet,
    promptHash: row.promptHash,
    surfaces: [mapQueueSurfaceToCommandSurface(row.surface)],
    sourceEvalCaseId: row.evalCaseId ?? undefined,
    learnedAt: new Date().toISOString(),
  };
}

export function mergeLearnedTelemetryRescueRules(
  existing: LearnedTelemetryRescueRule[],
  incoming: LearnedTelemetryRescueRule,
): LearnedTelemetryRescueRule[] {
  const index = new Map(existing.map((rule) => [rule.id, rule]));
  index.set(incoming.id, incoming);
  return [...index.values()]
    .sort((a, b) => b.learnedAt.localeCompare(a.learnedAt))
    .slice(0, 200);
}

export function buildClarifyPromptFix(
  row: Pick<
    AiEvalLabelQueue,
    | 'promptHash'
    | 'promptSnippet'
    | 'classifiedAction'
    | 'expectedClarifyFields'
    | 'evalCaseId'
  >,
): ClarifyPromptFix | null {
  const clarifyFields = row.expectedClarifyFields ?? [];
  if (clarifyFields.length === 0) return null;
  return {
    id: `clarify-fix-${row.promptHash.slice(0, 16)}`,
    promptHash: row.promptHash,
    promptSnippet: row.promptSnippet,
    clarifyAction: row.classifiedAction,
    clarifyFields,
    sourceEvalCaseId: row.evalCaseId ?? undefined,
    learnedAt: new Date().toISOString(),
  };
}

export function mergeClarifyPromptFixes(
  existing: ClarifyPromptFix[],
  incoming: ClarifyPromptFix,
): ClarifyPromptFix[] {
  const index = new Map(existing.map((fix) => [fix.id, fix]));
  index.set(incoming.id, incoming);
  return [...index.values()]
    .sort((a, b) => b.learnedAt.localeCompare(a.learnedAt))
    .slice(0, 200);
}

export function buildEntityAliasesFromExpectedParams(
  params: Record<string, unknown>,
): Record<string, EntityMemoryEntry> {
  const aliases: Record<string, EntityMemoryEntry> = {};
  const assign = (field: keyof EntityMemoryEntry, value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) return;
    aliases[value.toLowerCase().trim()] = { [field]: value.trim() };
  };
  assign('customerName', params.customerName);
  assign('employeeName', params.employeeName);
  assign('serviceName', params.serviceName);
  assign('templateName', params.templateName);
  return aliases;
}

export function matchLearnedTelemetryRescueRule(
  prompt: string,
  fromAction: string,
  rules: LearnedTelemetryRescueRule[],
  surface?: CommandSurface,
): LearnedTelemetryRescueRule | null {
  const normalizedPrompt = normalizeBusinessParaphrasePrompt(prompt);
  for (const rule of rules) {
    if (rule.fromAction !== fromAction) continue;
    if (
      rule.surfaces?.length &&
      surface &&
      !rule.surfaces.includes(surface)
    ) {
      continue;
    }
    const normalizedSnippet = normalizeBusinessParaphrasePrompt(rule.promptSnippet);
    if (
      normalizedPrompt === normalizedSnippet ||
      normalizedPrompt.includes(normalizedSnippet) ||
      normalizedSnippet.includes(normalizedPrompt)
    ) {
      return rule;
    }
  }
  return null;
}

export function findClarifyPromptFixForPrompt(
  prompt: string,
  action: string,
  fixes: ClarifyPromptFix[],
): ClarifyPromptFix | null {
  const normalizedPrompt = normalizeBusinessParaphrasePrompt(prompt);
  for (const fix of fixes) {
    if (fix.clarifyAction !== action) continue;
    const normalizedSnippet = normalizeBusinessParaphrasePrompt(fix.promptSnippet);
    if (
      normalizedPrompt === normalizedSnippet ||
      normalizedPrompt.includes(normalizedSnippet) ||
      fix.promptHash &&
        normalizeBusinessParaphrasePrompt(fix.promptSnippet) &&
        normalizedPrompt.includes(normalizedSnippet)
    ) {
      return fix;
    }
  }
  return null;
}

function mapQueueSurfaceToCommandSurface(
  surface: string,
): 'dashboard' | 'provider' | 'customer' | 'public' {
  if (surface === 'provider') return 'provider';
  if (surface === 'customer') return 'customer';
  if (surface === 'public') return 'public';
  return 'dashboard';
}
