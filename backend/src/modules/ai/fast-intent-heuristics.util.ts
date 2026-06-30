/**
 * pipe-1.2.3 — routing + structural hints only; see docs/FAST_INTENT_HEURISTICS_BOUNDARY.md (acc-3.14).
 */
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  extractUpcomingAppointmentScope,
  isUpcomingAppointmentsPrompt,
} from './ai-dashboard-ops.util.js';
import { resolveAvailabilityIntentFromPrompt } from './ai-intent-disambiguation.util.js';
import {
  inferProductGuideIntentFromPrompt,
  isProductGuidePrompt,
  resolveProductGuidePromptMatch,
} from './ai-product-guide.util.js';
import type { ComplexityRoute } from './command-complexity-router.service.js';
import type { IntentCandidate } from './command-understanding.types.js';
import type { AssistantMode } from './ai-assistant-mode.util.js';

/** Minimum confidence for a fast_heuristic candidate to enter the re-rank pool (pipe-1.2.2). */
export const FAST_HEURISTIC_RERANK_MIN_CONFIDENCE = 0.9;

/** High-confidence compound routing hint (pipe-1.2.2 feeds re-rank; does not bypass classify). */
export const FAST_HEURISTIC_COMPOUND_CONFIDENCE = 0.92;

/** Structural read-only action match — routing + intent hint, not paraphrase meaning. */
export const FAST_HEURISTIC_READ_ONLY_ACTION_CONFIDENCE = 0.93;

/** Read-only tier with no structural action match. */
export const FAST_HEURISTIC_READ_ONLY_TIER_CONFIDENCE = 0.85;

export interface FastHeuristicsInput {
  prompt: string;
  surface?: CommandSurface;
  employees?: Array<{ id: string; name: string }>;
  assistantMode?: AssistantMode;
}

const SHOW_APPOINTMENTS_PATTERN =
  /\b(show|list|display|view).+(appointment|booking)/i;

function buildCompoundCandidate(route: ComplexityRoute): IntentCandidate {
  return {
    action: 'unknown',
    confidence: FAST_HEURISTIC_COMPOUND_CONFIDENCE,
    source: 'fast_heuristic',
    paramHints: {
      complexityTier: 'compound',
      useDecomposition: route.useDecomposition ?? true,
    },
    reasoning: route.reasoning ?? 'Compound command markers detected',
  };
}

function buildReadOnlyTierCandidate(route: ComplexityRoute): IntentCandidate {
  return {
    action: 'unknown',
    confidence: FAST_HEURISTIC_READ_ONLY_TIER_CONFIDENCE,
    source: 'fast_heuristic',
    paramHints: { complexityTier: 'read_only' },
    reasoning: route.reasoning ?? 'Read-only tier (no structural action match)',
  };
}

/** Product-guide routing hints (pipe-1.2 / ai-guide-1.0.2 — guide vs action, not domain paraphrase). */
export function inferProductGuideIntentCandidates(
  surface: CommandSurface,
  prompt: string,
  assistantMode?: AssistantMode,
): IntentCandidate[] {
  if (assistantMode === 'act') return [];

  if (assistantMode === 'guide') {
    const match = resolveProductGuidePromptMatch(prompt, { surface, assistantMode });
    const action = match.intent ?? inferProductGuideIntentFromPrompt(prompt);
    return [
      {
        action,
        confidence: FAST_HEURISTIC_READ_ONLY_ACTION_CONFIDENCE,
        source: 'fast_heuristic',
        paramHints: {
          complexityTier: 'read_only',
          productGuide: true,
          assistantMode: 'guide',
        },
        reasoning: 'Explicit assistantMode=guide (ai-guide-1.0.3)',
      },
    ];
  }

  if (!isProductGuidePrompt(prompt, { surface })) return [];

  const action = inferProductGuideIntentFromPrompt(prompt);
  return [
    {
      action,
      confidence: FAST_HEURISTIC_READ_ONLY_ACTION_CONFIDENCE,
      source: 'fast_heuristic',
      paramHints: {
        complexityTier: 'read_only',
        productGuide: true,
      },
      reasoning: 'Product guide prompt (pipe-1.2 / ai-guide-1.0.2)',
    },
  ];
}

/** Structural read-only intent hints for dashboard (acc-3.14 — no new paraphrase regex). */
export function inferReadOnlyIntentCandidates(
  surface: CommandSurface,
  prompt: string,
): IntentCandidate[] {
  if (surface !== 'dashboard') return [];

  const byAction = new Map<string, IntentCandidate>();

  const availability = resolveAvailabilityIntentFromPrompt('dashboard', prompt);
  if (availability) {
    byAction.set(availability.action, {
      action: availability.action,
      confidence: FAST_HEURISTIC_READ_ONLY_ACTION_CONFIDENCE,
      source: 'fast_heuristic',
      params: availability.params,
      paramHints: { complexityTier: 'read_only' },
      reasoning: `Read-only availability (${availability.rescueReason})`,
    });
  }

  if (SHOW_APPOINTMENTS_PATTERN.test(prompt)) {
    const existing = byAction.get('show_appointments');
    if (!existing) {
      byAction.set('show_appointments', {
        action: 'show_appointments',
        confidence: FAST_HEURISTIC_READ_ONLY_ACTION_CONFIDENCE - 0.01,
        source: 'fast_heuristic',
        paramHints: { complexityTier: 'read_only' },
        reasoning: 'Read-only list appointments pattern',
      });
    }
  } else if (isUpcomingAppointmentsPrompt(prompt)) {
    const scope = extractUpcomingAppointmentScope(prompt);
    byAction.set('show_appointments', {
      action: 'show_appointments',
      confidence: FAST_HEURISTIC_READ_ONLY_ACTION_CONFIDENCE,
      source: 'fast_heuristic',
      paramHints: {
        complexityTier: 'read_only',
        allProviders: scope.allProviders,
        employeeNames: scope.employeeNames,
      },
      reasoning: 'Read-only upcoming appointments pattern',
    });
  }

  return [...byAction.values()].sort((a, b) => b.confidence - a.confidence);
}

/**
 * Score fast routing heuristics — returns IntentCandidate[] (pipe-1.2.1).
 * Compound detection takes precedence; read-only tier emits structural action hints.
 */
export function scoreFastIntentHeuristics(
  input: FastHeuristicsInput,
  route: ComplexityRoute,
  isCompound: boolean,
): IntentCandidate[] {
  const trimmed = input.prompt.trim();
  if (!trimmed) return [];

  const surface = input.surface ?? 'dashboard';
  const compoundDetected = route.tier === 'compound' || isCompound;
  if (compoundDetected) {
    return [buildCompoundCandidate(route)];
  }

  if (route.tier !== 'read_only') return [];

  const productGuide = inferProductGuideIntentCandidates(
    surface,
    trimmed,
    input.assistantMode,
  );
  if (productGuide.length > 0) return productGuide;

  const readOnly = inferReadOnlyIntentCandidates(surface, trimmed);
  if (readOnly.length > 0) return readOnly;

  return [buildReadOnlyTierCandidate(route)];
}
