import type { CommandSurface } from './ai-command-registry.types.js';
import {
  buildSemanticMatchFromAnchor,
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
} from './ai-semantic-intent.util.js';
import { buildCanonicalPhrasingBank } from './intent-phrasing-bank.util.js';
import { RECOMMEND_SPECIALISTS_SEMANTIC_PIPE_MARKER } from './recommend-specialists.semantic.fixtures.js';
import { impliesTeamWideAvailabilityFromSemantic } from './team-wide-availability.semantic.util.js';
import { isExplainProviderSpecialtyPrompt } from './ai-explain-provider-specialty.util.js';

export { RECOMMEND_SPECIALISTS_SEMANTIC_PIPE_MARKER };

const DEFAULT_RECOMMEND_SPECIALISTS_SURFACES = [
  'dashboard',
  'customer',
  'public',
] as const satisfies readonly CommandSurface[];

const RANKING_LANGUAGE =
  /\b(best|top|highest|highly|rated|rating|reviewed|reviews?|recommend|suggest)\b/i;

const STAFF_METRIC_LANGUAGE =
  /\b(revenue|earnings|earned|income|sales)\b|\bby\s+revenue\b/i;

/** Plain availability / team-wide phrasing without ranking language. */
export function promptImpliesPlainAvailabilityNotRecommend(
  prompt: string,
): boolean {
  if (STAFF_METRIC_LANGUAGE.test(prompt)) return true;
  if (RANKING_LANGUAGE.test(prompt)) return false;
  if (impliesTeamWideAvailabilityFromSemantic(prompt)) return true;
  if (
    /\bfree\s+slots?\b/i.test(prompt) &&
    /\bfor\s+[A-Za-z]/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

function recommendSpecialistsAnchors(surface: CommandSurface) {
  return filterAnchorsForSurface(
    buildCanonicalPhrasingBank([]),
    surface,
    ['recommend_specialists'],
  ).filter((anchor) => anchor.paramHints?.recommendSpecialists === true);
}

export function resolveRecommendSpecialistsSemanticHints(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): { recommendSpecialists: true } | null {
  const trimmed = prompt.trim();
  if (!trimmed || isExplainProviderSpecialtyPrompt(trimmed)) {
    return null;
  }
  if (promptImpliesPlainAvailabilityNotRecommend(trimmed)) {
    return null;
  }

  const anchors = recommendSpecialistsAnchors(surface);
  if (!anchors.length) return null;

  const ranked = rankAnchorsDeterministic(trimmed, anchors);
  let match = resolveSemanticMatch(ranked, {
    threshold: SEMANTIC_CONCEPT_THRESHOLD,
  });
  if (
    !match &&
    ranked[0] &&
    ranked[0].score >= SEMANTIC_CONCEPT_THRESHOLD &&
    ranked[0].anchor.paramHints?.recommendSpecialists === true
  ) {
    match = buildSemanticMatchFromAnchor(ranked[0].anchor, ranked[0].score);
  }
  if (match?.paramHints?.recommendSpecialists !== true) return null;

  return { recommendSpecialists: true };
}

/** acc-3.14 — best/top/rated specialist recommendation phrasing. */
export function impliesRecommendSpecialistsFromSemantic(
  prompt: string,
  surfaces: readonly CommandSurface[] = DEFAULT_RECOMMEND_SPECIALISTS_SURFACES,
): boolean {
  return surfaces.some(
    (surface) => resolveRecommendSpecialistsSemanticHints(prompt, surface) != null,
  );
}

export function isRecommendSpecialistsPrompt(prompt: string): boolean {
  return impliesRecommendSpecialistsFromSemantic(prompt);
}
