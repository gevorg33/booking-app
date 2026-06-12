import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import { AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES } from './eval/ai-command-eval.cases.js';
import type { IntentAnchor } from './ai-semantic-intent.types.js';
import { buildCanonicalPhrasingBank } from './intent-phrasing-bank.util.js';
import { CANONICAL_PHRASING_BANK } from './intent-phrasing.bank.js';
import { INTENT_ANCHOR_BOUNDARY_MARKER } from './intent-anchor.bank.boundary.js';
import {
  assertIntentAnchorBankGeneric,
  CORE_SEMANTIC_INTENT_ACTIONS,
  sortIntentAnchorsEnFirst,
} from './intent-anchor.bank.util.js';

/** pipe-1.4.1 — proves authors read INTENT_ANCHOR_BANK_BOUNDARY.md */
export const INTENT_ANCHOR_BANK_PIPE_MARKER = INTENT_ANCHOR_BOUNDARY_MARKER;

export { CORE_SEMANTIC_INTENT_ACTIONS };

let cachedIntentAnchorBank: IntentAnchor[] | null = null;
let cachedEvalCases: AiCommandEvalCase[] | null = null;

/**
 * Full anchor bank: canonical EN-first per intent + eval-harvested paraphrases (pipe-1.4.1).
 * Phrases are generic — no entity names; eval cases flagged `useSemanticIntentMatch` merge at runtime.
 */
export function getIntentAnchorBank(
  evalCases: AiCommandEvalCase[] = AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES,
): IntentAnchor[] {
  if (!cachedIntentAnchorBank || cachedEvalCases !== evalCases) {
    const merged = buildCanonicalPhrasingBank(evalCases);
    const sorted = sortIntentAnchorsEnFirst(merged);
    assertIntentAnchorBankGeneric(sorted);
    cachedIntentAnchorBank = sorted;
    cachedEvalCases = evalCases;
  }
  return cachedIntentAnchorBank;
}

/** Test helper — rebuild after bank or eval case changes. */
export function clearIntentAnchorBankCache(): void {
  cachedIntentAnchorBank = null;
  cachedEvalCases = null;
}

/** @alias clearIntentAnchorBankCache */
export function resetIntentAnchorBankCache(): void {
  clearIntentAnchorBankCache();
}

export function getCanonicalPhrasingBankVersion(): number {
  return CANONICAL_PHRASING_BANK.version;
}

/** @deprecated use CANONICAL_PHRASING_BANK entries via getIntentAnchorBank() */
export const MANUAL_INTENT_ANCHOR_BANK = sortIntentAnchorsEnFirst(
  buildCanonicalPhrasingBank([]),
);

/** @deprecated use getIntentAnchorBank() */
export const INTENT_ANCHOR_BANK = MANUAL_INTENT_ANCHOR_BANK;
