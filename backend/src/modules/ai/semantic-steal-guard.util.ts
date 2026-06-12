import type { CommandSurface } from './ai-command-registry.types.js';
import { getIntentAnchorBank } from './intent-anchor.bank.js';
import { CORE_SEMANTIC_INTENT_ACTIONS } from './intent-anchor.bank.util.js';
import { isSingleProviderRevenuePrompt } from './ai-dashboard-ops.util.js';
import {
  isTotalEarningsPrompt,
  isTopStaffRevenuePrompt,
} from './dashboard-revenue-analytics.util.js';
import {
  isConfigureRecommendationProductPrompt,
  isExplainRecommendationSetupPrompt,
  isLinkRecommendedProductsPrompt,
} from './ai-recommendation-product.util.js';
import { isExplainTourCalendarSpanPrompt } from './ai-tour-calendar-span.util.js';
import { isListTourCalendarWeekPrompt } from './ai-tour-calendar-week.util.js';
import {
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
  filterAnchorsForSurface,
} from './ai-semantic-intent.util.js';
import { resolveSemanticAllowedActions } from './semantic-allowed-actions.util.js';
import {
  SEMANTIC_STEAL_FORBIDDEN_ACTIONS,
  SEMANTIC_STEAL_GUARD_PIPE_MARKER,
} from './semantic-steal-guard.fixtures.js';

export { SEMANTIC_STEAL_GUARD_PIPE_MARKER, SEMANTIC_STEAL_FORBIDDEN_ACTIONS };

/** Domain prompts that must never escalate to core semantic booking/schedule intents. */
export function isSemanticStealProtectedPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (!trimmed) return false;

  return (
    isExplainTourCalendarSpanPrompt(trimmed) ||
    isListTourCalendarWeekPrompt(trimmed) ||
    isTotalEarningsPrompt(trimmed) ||
    isTopStaffRevenuePrompt(trimmed) ||
    isSingleProviderRevenuePrompt(trimmed) ||
    isConfigureRecommendationProductPrompt(trimmed) ||
    isLinkRecommendedProductsPrompt(trimmed) ||
    isExplainRecommendationSetupPrompt(trimmed)
  );
}

export type SemanticStealCheckResult = {
  stolen: boolean;
  protected: boolean;
  matchAction?: string;
  anchorId?: string;
};

/**
 * Returns whether semantic match would steal a domain prompt into a core
 * booking/schedule intent (pipe-1.5.3).
 */
export function checkSemanticStealGuard(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): SemanticStealCheckResult {
  if (isSemanticStealProtectedPrompt(prompt)) {
    return { stolen: false, protected: true };
  }

  const allowedActions = resolveSemanticAllowedActions(surface);
  if (allowedActions.length === 0) {
    return { stolen: false, protected: false };
  }

  const anchors = filterAnchorsForSurface(
    getIntentAnchorBank(),
    surface,
    allowedActions,
  );
  const ranked = rankAnchorsDeterministic(prompt, anchors);
  const match = resolveSemanticMatch(ranked, {
    threshold: SEMANTIC_CONCEPT_THRESHOLD,
  });

  if (!match) {
    return { stolen: false, protected: false };
  }

  const forbidden = new Set<string>([
    ...CORE_SEMANTIC_INTENT_ACTIONS,
    ...SEMANTIC_STEAL_FORBIDDEN_ACTIONS,
  ]);

  if (!forbidden.has(match.action)) {
    return {
      stolen: false,
      protected: false,
      matchAction: match.action,
      anchorId: match.anchorId,
    };
  }

  return {
    stolen: true,
    protected: false,
    matchAction: match.action,
    anchorId: match.anchorId,
  };
}

export function assertSemanticDoesNotSteal(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): void {
  const result = checkSemanticStealGuard(prompt, surface);
  if (result.stolen) {
    throw new Error(
      `semantic steal guard failed: "${prompt}" matched ${result.matchAction} (${result.anchorId})`,
    );
  }
}
