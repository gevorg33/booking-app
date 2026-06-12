import type { IntentAnchor, SemanticIntentLocale } from './ai-semantic-intent.types.js';
import { isGenericSemanticAnchorPrompt } from './intent-anchor.seed.util.js';

/** Core intents with canonical EN/HY/RU anchors (pipe-1.4.1). */
export const CORE_SEMANTIC_INTENT_ACTIONS = [
  'create_booking',
  'book_nearest_slot',
  'check_providers_for_service',
  'create_direct_schedule',
] as const;

export type CoreSemanticIntentAction =
  (typeof CORE_SEMANTIC_INTENT_ACTIONS)[number];

const LOCALE_SORT_ORDER: Record<SemanticIntentLocale, number> = {
  en: 0,
  translit: 1,
  hy: 2,
  ru: 3,
};

/** Sort anchors by action, then EN before HY/RU/translit (pipe-1.4.1). */
export function sortIntentAnchorsEnFirst(anchors: IntentAnchor[]): IntentAnchor[] {
  return [...anchors].sort((left, right) => {
    if (left.action !== right.action) {
      return left.action.localeCompare(right.action);
    }
    const localeDiff =
      LOCALE_SORT_ORDER[left.locale] - LOCALE_SORT_ORDER[right.locale];
    if (localeDiff !== 0) return localeDiff;
    const sourceDiff =
      (left.source === 'canonical' ? 0 : 1) -
      (right.source === 'canonical' ? 0 : 1);
    if (sourceDiff !== 0) return sourceDiff;
    return left.id.localeCompare(right.id);
  });
}

export function groupIntentAnchorsByAction(
  anchors: IntentAnchor[],
): Map<string, IntentAnchor[]> {
  const grouped = new Map<string, IntentAnchor[]>();
  for (const anchor of anchors) {
    const list = grouped.get(anchor.action) ?? [];
    list.push(anchor);
    grouped.set(anchor.action, list);
  }
  return grouped;
}

/** Returns anchors whose phrase fails generic prompt rules (entity names, codes, emails). */
export function findAnchorsWithNonGenericPhrases(
  anchors: IntentAnchor[],
): IntentAnchor[] {
  return anchors.filter(
    (anchor) => !isGenericSemanticAnchorPrompt(anchor.phrase),
  );
}

const ENTITY_TOKEN_PATTERN =
  /\b(anna|maria|james|gevorg|mary|karo|sophie|john|jane|lisa|david|sarah)\b/i;

/** Returns concept-group tokens that look like person names. */
export function findConceptGroupsWithEntityNames(
  anchors: IntentAnchor[],
): Array<{ anchorId: string; token: string }> {
  const violations: Array<{ anchorId: string; token: string }> = [];
  for (const anchor of anchors) {
    for (const group of anchor.conceptGroups ?? []) {
      for (const token of group) {
        if (ENTITY_TOKEN_PATTERN.test(token)) {
          violations.push({ anchorId: anchor.id, token });
        }
      }
    }
  }
  return violations;
}

export function assertIntentAnchorBankGeneric(anchors: IntentAnchor[]): void {
  const badPhrases = findAnchorsWithNonGenericPhrases(anchors);
  if (badPhrases.length > 0) {
    throw new Error(
      `intent anchor bank contains non-generic phrases: ${badPhrases
        .map((anchor) => anchor.id)
        .join(', ')}`,
    );
  }

  const badConcepts = findConceptGroupsWithEntityNames(anchors);
  if (badConcepts.length > 0) {
    throw new Error(
      `intent anchor bank concept groups contain entity names: ${badConcepts
        .map((entry) => `${entry.anchorId}:${entry.token}`)
        .join(', ')}`,
    );
  }
}
