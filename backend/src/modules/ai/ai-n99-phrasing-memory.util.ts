/** n99-2.3 — per-business phrasing memory for no-clarify completion (acc-3.2). */

import type { ClassificationSurface } from './ai-classification-engine.types.js';
import { matchBusinessLearnedParaphrase } from './ai-business-paraphrase.util.js';
import {
  findPhrasingMemoryHits,
  inferIntentBiasFromPhrasing,
} from './ai-classification-phrasing.util.js';
import { applyEntityMemoryToParams } from './ai-entity-memory.util.js';
import type { BusinessParaphraseEntry, EntityMemory, EntityMemoryEntry } from './ai-settings.types.js';

export const N99_PHRASING_MEMORY_PARAM_KEYS = [
  'employeeName',
  'serviceName',
  'customerName',
  'templateName',
] as const;

export function resolveEntityMemoryForNoClarify(
  explicit?: EntityMemory,
  sessionContext?: Record<string, unknown>,
): EntityMemory | undefined {
  const contextAliases = sessionContext?._entityMemoryAliases;
  const contextParaphrases = sessionContext?._entityMemoryParaphrases;
  const aliases =
    explicit?.aliases ??
    (contextAliases && typeof contextAliases === 'object'
      ? (contextAliases as Record<string, EntityMemoryEntry>)
      : undefined);
  const paraphrases =
    explicit?.paraphrases ??
    (Array.isArray(contextParaphrases)
      ? (contextParaphrases as BusinessParaphraseEntry[])
      : undefined);

  if (!aliases && !paraphrases?.length) return explicit;
  return {
    aliases: aliases ?? {},
    paraphrases: paraphrases ?? [],
  };
}

export type PhrasingMemoryActionSource = 'phrasing_alias' | 'business_paraphrase';

export interface PhrasingMemoryGroundingInput {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  surface: ClassificationSurface;
  entityMemory?: EntityMemory;
  actionConfidence?: number;
}

export interface PhrasingMemoryGroundingResult {
  action: string;
  params: Record<string, unknown>;
  filledFields: string[];
  matchedAliases: string[];
  actionSource?: PhrasingMemoryActionSource;
  suggestedAction?: string;
}

function trackFilledFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const filled: string[] = [];
  for (const key of N99_PHRASING_MEMORY_PARAM_KEYS) {
    if ((before[key] == null || before[key] === '') && after[key] != null && after[key] !== '') {
      filled.push(key);
    }
  }
  return filled;
}

function shouldRescueAction(action: string, actionConfidence?: number): boolean {
  if (action === 'unknown') return true;
  return typeof actionConfidence === 'number' && actionConfidence < 0.55;
}

/** Apply learned aliases, nicknames, and habitual phrases to missing params. */
export function applyPhrasingMemoryGrounding(
  input: PhrasingMemoryGroundingInput,
): PhrasingMemoryGroundingResult {
  const before = { ...input.params };
  const hits = findPhrasingMemoryHits(
    input.prompt,
    input.entityMemory,
    input.surface,
  );

  let params = before;
  let filledFields: string[] = [];
  let matchedAliases: string[] = [];
  let suggestedAction: string | undefined;

  if (hits.length > 0) {
    const bias = inferIntentBiasFromPhrasing(hits, input.prompt, input.surface);
    params = applyEntityMemoryToParams(
      { ...before, ...bias.suggestedParams },
      input.entityMemory ?? { aliases: {} },
      input.prompt,
    );
    filledFields = trackFilledFields(before, params);
    matchedAliases = hits.map((hit) => hit.alias);
    suggestedAction = bias.suggestedAction;

    if (hits[0]?.alias) {
      params._phrasingMemoryAlias = hits[0].alias;
    }
    if (hits.length > 1) {
      params._phrasingMemoryAliases = matchedAliases;
    }
  }

  const actionResolution = resolveActionFromPhrasingMemory({
    prompt: input.prompt,
    action: input.action,
    actionConfidence: input.actionConfidence,
    surface: input.surface,
    entityMemory: input.entityMemory,
    suggestedAction,
  });

  return {
    action: actionResolution.action,
    params,
    filledFields,
    matchedAliases,
    actionSource: actionResolution.source,
    suggestedAction,
  };
}

export function resolveActionFromPhrasingMemory(input: {
  prompt: string;
  action: string;
  actionConfidence?: number;
  surface: ClassificationSurface;
  entityMemory?: EntityMemory;
  suggestedAction?: string;
}): { action: string; source?: PhrasingMemoryActionSource } {
  const paraphraseMatch = matchBusinessLearnedParaphrase(
    input.prompt,
    input.entityMemory?.paraphrases ?? [],
    input.surface,
  );

  if (paraphraseMatch && shouldRescueAction(input.action, input.actionConfidence)) {
    return { action: paraphraseMatch.action, source: 'business_paraphrase' };
  }

  if (
    input.suggestedAction &&
    shouldRescueAction(input.action, input.actionConfidence)
  ) {
    return { action: input.suggestedAction, source: 'phrasing_alias' };
  }

  return { action: input.action };
}

export function trimNeedlessClarifyIssuesFromPhrasing(input: {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  issues: Array<{ field: string; message: string; example?: string }>;
  entityMemory?: EntityMemory;
  surface: ClassificationSurface;
}): Array<{ field: string; message: string; example?: string }> {
  const grounded = applyPhrasingMemoryGrounding({
    prompt: input.prompt,
    action: input.action,
    params: input.params,
    surface: input.surface,
    entityMemory: input.entityMemory,
  });

  return input.issues.filter((issue) => {
    const paramValue = grounded.params[issue.field];
    if (paramValue != null && paramValue !== '') return false;
    return true;
  });
}

export function buildPhrasingMemorySessionPromotion(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const promotion: Record<string, unknown> = {};
  if (typeof params.employeeName === 'string' && params.employeeName.trim()) {
    promotion.lastEmployeeName = params.employeeName;
  }
  if (typeof params.serviceName === 'string' && params.serviceName.trim()) {
    promotion.lastServiceName = params.serviceName;
  }
  if (typeof params.customerName === 'string' && params.customerName.trim()) {
    promotion.lastCustomerName = params.customerName;
  }
  if (typeof params._phrasingMemoryAlias === 'string') {
    promotion.lastPhrasingAlias = params._phrasingMemoryAlias;
  }
  return promotion;
}
