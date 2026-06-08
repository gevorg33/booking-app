import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type { CommandResult } from './command-completion.types.js';
import { readClarifyCrossTurnContext } from './ai-clarify-cross-turn-merge.util.js';
import type { HonestFailureSuggestion } from './ai-honest-failure-clarify.fixtures.js';
import { isClarifyFollowUpTurn } from './ai-lossless-clarify-merge.util.js';
import {
  pickSuggestedActionFallback,
  SUGGESTED_ACTION_FALLBACK_SUMMARY,
} from './ai-suggested-action-fallback.util.js';
import {
  SOMETHING_ELSE_ESCAPE_LABEL,
  SOMETHING_ELSE_FOLLOWUP_PHRASES,
} from './ai-something-else-clarify.fixtures.js';

export {
  SOMETHING_ELSE_ESCAPE_LABEL,
  SOMETHING_ELSE_ESCAPE_SCENARIOS,
  SOMETHING_ELSE_FOLLOWUP_PHRASES,
} from './ai-something-else-clarify.fixtures.js';

const MIN_SOMETHING_ELSE_ALTERNATIVES = 2;
const MAX_SOMETHING_ELSE_ALTERNATIVES = 3;

const CHIP_CLARIFY_KINDS = new Set([
  'intent_disambiguation',
  'entity_disambiguation',
]);

function readClarifyRound(sessionContext?: Record<string, unknown>): number {
  const ctx = sessionContext?._clarifyContext as { clarifyRound?: number } | undefined;
  return typeof ctx?.clarifyRound === 'number' ? ctx.clarifyRound : 0;
}

function normalizeFollowUpPhrase(prompt: string): string {
  return prompt
    .trim()
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** n99-1.8 — user explicitly rejected the offered clarify chips. */
export function isSomethingElseFollowUp(prompt: string): boolean {
  const normalized = normalizeFollowUpPhrase(prompt);
  if (!normalized) return false;
  return SOMETHING_ELSE_FOLLOWUP_PHRASES.some(
    (phrase) => normalized === phrase || normalized.startsWith(`${phrase} `),
  );
}

function collectExcludedActions(input: {
  excludedActions?: string[];
  clarifyCandidates?: Array<{ action: string }>;
}): Set<string> {
  const excluded = new Set(input.excludedActions ?? []);
  for (const candidate of input.clarifyCandidates ?? []) {
    if (candidate.action && candidate.action !== 'unknown') {
      excluded.add(candidate.action);
    }
  }
  return excluded;
}

/** n99-1.8 / acc-6.6 — closest valid commands when user picks "Something else". */
export function buildSomethingElseEscapeAlternatives(input: {
  prompt: string;
  surface: ClassificationSurface;
  shortlist?: string[];
  excludedActions?: string[];
  clarifyCandidates?: Array<{ action: string; label?: string }>;
  limit?: number;
}): HonestFailureSuggestion[] {
  const excluded = collectExcludedActions(input);
  const filteredShortlist = input.shortlist?.filter(
    (action) => action && action !== 'unknown' && !excluded.has(action),
  );

  const suggestions = pickSuggestedActionFallback({
    surface: input.surface,
    prompt: input.prompt,
    shortlist: filteredShortlist,
  });

  const limit = Math.min(input.limit ?? MAX_SOMETHING_ELSE_ALTERNATIVES, MAX_SOMETHING_ELSE_ALTERNATIVES);
  return suggestions.slice(0, limit);
}

export function shouldAttachSomethingElseEscape(result: CommandResult): boolean {
  const kind = result.details.clarifyKind;
  if (typeof kind === 'string' && CHIP_CLARIFY_KINDS.has(kind)) return true;
  const candidates = result.details.clarifyCandidates;
  const entityOptions = result.details.entityOptions;
  return (
    (Array.isArray(candidates) && candidates.length >= 2) ||
    (Array.isArray(entityOptions) && entityOptions.length >= 2)
  );
}

/** Attach precomputed routing chips for the explicit "Something else" escape. */
export function attachSomethingElseEscapeToClarifyResult(
  result: CommandResult,
  input: {
    prompt: string;
    surface: ClassificationSurface;
    shortlist?: string[];
    excludedActions?: string[];
    originalAction?: string;
  },
): CommandResult {
  if (!shouldAttachSomethingElseEscape(result)) return result;

  const clarifyCandidates = result.details.clarifyCandidates as
    | Array<{ action: string; label?: string }>
    | undefined;
  const alternatives = buildSomethingElseEscapeAlternatives({
    prompt: input.prompt,
    surface: input.surface,
    shortlist: input.shortlist,
    excludedActions: input.excludedActions,
    clarifyCandidates,
  });

  if (alternatives.length < MIN_SOMETHING_ELSE_ALTERNATIVES) return result;

  return {
    ...result,
    details: {
      ...result.details,
      showSomethingElseEscape: true,
      somethingElseLabel: SOMETHING_ELSE_ESCAPE_LABEL,
      somethingElseAlternatives: alternatives,
    },
  };
}

export function buildSomethingElseRoutingClarifyResult(input: {
  prompt: string;
  surface: ClassificationSurface;
  sessionContext?: Record<string, unknown>;
  shortlist?: string[];
  excludedActions?: string[];
  clarifyCandidates?: Array<{ action: string; label?: string }>;
  originalAction?: string;
}): CommandResult | null {
  const ctx = readClarifyCrossTurnContext(input.sessionContext);
  const alternatives = buildSomethingElseEscapeAlternatives({
    prompt: ctx?.originalPrompt ?? input.prompt,
    surface: input.surface,
    shortlist: input.shortlist,
    excludedActions: input.excludedActions,
    clarifyCandidates: input.clarifyCandidates,
  });

  if (alternatives.length < MIN_SOMETHING_ELSE_ALTERNATIVES) return null;

  const clarifyRound = readClarifyRound(input.sessionContext) + 1;
  const clarifyContext = {
    originalPrompt: ctx?.originalPrompt ?? input.prompt,
    originalAction: ctx?.originalAction ?? input.originalAction ?? 'unknown',
    partialParams: ctx?.partialParams ?? {},
    clarifyRound,
    clarifyKind: 'suggested_action_fallback',
  };

  return {
    success: false,
    action: 'clarify',
    summary: SUGGESTED_ACTION_FALLBACK_SUMMARY,
    details: {
      needsClarification: true,
      clarify: true,
      clarifyKind: 'suggested_action_fallback',
      clarifySource: 'something_else_escape',
      clarifyRound,
      clarifyContext,
      suggestedCommands: alternatives,
      pipelineStage: 'clarify',
      sessionContext: {
        ...(input.sessionContext ?? {}),
        _clarifyContext: clarifyContext,
      },
    },
  };
}

/** n99-1.8 — typed "none of these" follow-up still routes via closest-command chips. */
export function resolveSomethingElseClarifyFollowUpIfNeeded(input: {
  prompt: string;
  sessionContext?: Record<string, unknown>;
  surface: ClassificationSurface;
  shortlist?: string[];
}): CommandResult | null {
  if (!isClarifyFollowUpTurn(input.sessionContext)) return null;
  if (!isSomethingElseFollowUp(input.prompt)) return null;

  const ctx = readClarifyCrossTurnContext(input.sessionContext);
  if (ctx?.clarifyKind && !CHIP_CLARIFY_KINDS.has(ctx.clarifyKind)) {
    return null;
  }

  return buildSomethingElseRoutingClarifyResult({
    prompt: input.prompt,
    surface: input.surface,
    sessionContext: input.sessionContext,
    shortlist: input.shortlist,
    originalAction: ctx?.originalAction,
  });
}
