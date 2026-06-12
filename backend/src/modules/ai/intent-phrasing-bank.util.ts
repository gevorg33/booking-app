import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import type { IntentAnchor } from './ai-semantic-intent.types.js';
import type {
  CanonicalPhrasingBankDocument,
  CanonicalPhrasingBankStats,
  CanonicalPhrasingEntry,
} from './intent-phrasing-bank.types.js';
import { CANONICAL_PHRASING_BANK } from './intent-phrasing.bank.js';
import {
  dedupeIntentAnchors,
  evalCaseToIntentAnchor,
  mergeIntentAnchorBanks,
} from './intent-anchor.seed.util.js';

function resolveConceptGroupsForAnchor(
  anchor: Pick<IntentAnchor, 'action' | 'locale' | 'conceptGroups'>,
  bank: CanonicalPhrasingBankDocument = CANONICAL_PHRASING_BANK,
): string[][] | undefined {
  if (anchor.conceptGroups?.length) return anchor.conceptGroups;
  return bank.entries.find(
    (entry) =>
      entry.action === anchor.action &&
      entry.locale === anchor.locale &&
      entry.conceptGroups?.length,
  )?.conceptGroups;
}

/** Eval paraphrases inherit concept groups from canonical same action+locale (acc-3.12). */
export function enrichAnchorConceptGroups(
  anchor: IntentAnchor,
  bank: CanonicalPhrasingBankDocument = CANONICAL_PHRASING_BANK,
): IntentAnchor {
  const conceptGroups = resolveConceptGroupsForAnchor(anchor, bank);
  if (!conceptGroups || anchor.conceptGroups?.length) return anchor;
  return { ...anchor, conceptGroups };
}

export function phrasingEntryToIntentAnchor(
  entry: CanonicalPhrasingEntry,
): IntentAnchor {
  return {
    id: entry.id,
    action: entry.action,
    phrase: entry.phrase,
    locale: entry.locale,
    surfaces: entry.surfaces,
    paramHints: entry.paramHints,
    conceptGroups: entry.conceptGroups,
    source: 'canonical',
  };
}

export function canonicalBankToAnchors(
  bank: CanonicalPhrasingBankDocument = CANONICAL_PHRASING_BANK,
): IntentAnchor[] {
  return bank.entries.map((entry) => phrasingEntryToIntentAnchor(entry));
}

/** Harvest eval cases flagged with useSemanticIntentMatch — no code changes needed (acc-3.12). */
export function harvestEvalPhrasingAnchors(
  evalCases: AiCommandEvalCase[],
): IntentAnchor[] {
  const anchors: IntentAnchor[] = [];
  for (const evalCase of evalCases) {
    if (evalCase.expect.useSemanticIntentMatch !== true) continue;
    const anchor = evalCaseToIntentAnchor(evalCase);
    if (anchor) anchors.push(enrichAnchorConceptGroups(anchor));
  }
  return dedupeIntentAnchors(anchors);
}

export function buildCanonicalPhrasingBank(
  evalCases: AiCommandEvalCase[] = [],
  bank: CanonicalPhrasingBankDocument = CANONICAL_PHRASING_BANK,
): IntentAnchor[] {
  return mergeIntentAnchorBanks(
    canonicalBankToAnchors(bank),
    harvestEvalPhrasingAnchors(evalCases),
  );
}

export function getCanonicalPhrasingBankStats(
  bank: CanonicalPhrasingBankDocument = CANONICAL_PHRASING_BANK,
): CanonicalPhrasingBankStats {
  const byAction: Record<string, number> = {};
  const byLocale: CanonicalPhrasingBankStats['byLocale'] = {
    en: 0,
    hy: 0,
    ru: 0,
    translit: 0,
  };
  const localesByAction = new Map<string, Set<string>>();

  for (const entry of bank.entries) {
    byAction[entry.action] = (byAction[entry.action] ?? 0) + 1;
    byLocale[entry.locale] += 1;
    const set = localesByAction.get(entry.action) ?? new Set<string>();
    set.add(entry.locale);
    localesByAction.set(entry.action, set);
  }

  const intentsWithEnHyRu = [...localesByAction.entries()]
    .filter(([, locales]) =>
      ['en', 'hy', 'ru'].every((locale) => locales.has(locale)),
    )
    .map(([action]) => action)
    .sort();

  return {
    version: bank.version,
    totalEntries: bank.entries.length,
    byAction,
    byLocale,
    intentsWithEnHyRu,
  };
}
