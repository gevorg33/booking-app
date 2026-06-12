import type { CommandSurface } from './ai-command-registry.types.js';
import {
  buildSemanticMatchFromAnchor,
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
} from './ai-semantic-intent.util.js';
import { buildCanonicalPhrasingBank } from './intent-phrasing-bank.util.js';
import { TEAM_WIDE_AVAILABILITY_SEMANTIC_PIPE_MARKER } from './team-wide-availability.semantic.fixtures.js';

export { TEAM_WIDE_AVAILABILITY_SEMANTIC_PIPE_MARKER };

const DEFAULT_TEAM_WIDE_AVAILABILITY_SURFACES = [
  'dashboard',
  'customer',
  'public',
] as const satisfies readonly CommandSurface[];

const SURFACE_TEAM_WIDE_AVAILABILITY_ACTIONS: Record<
  CommandSurface,
  readonly string[]
> = {
  dashboard: ['check_providers_for_service'],
  customer: ['check_providers_for_service'],
  public: ['check_providers_for_service'],
  provider: [],
};

const NAMED_PROVIDER_AVAILABILITY_IN_PROMPT =
  /\b(?:is|are)\s+[A-Za-z][\w\s.'-]{1,40}\s+(?:available|free|open)\b/i;

/** Structural guard — named specialist availability is not team-wide (acc-3.14). */
export function promptImpliesNamedProviderAvailability(prompt: string): boolean {
  if (NAMED_PROVIDER_AVAILABILITY_IN_PROMPT.test(prompt)) {
    return true;
  }
  if (
    /\bcheck\s+availability\s+for\s+[A-Za-z]/i.test(prompt) ||
    /\bavailability\s+for\s+[A-Za-z][\w\s.'-]{1,40}\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\bbook\b/i.test(prompt) &&
    /\bwith\s+(?!any\b|whichever\b|whoever\b|whatever\b)[A-Za-z]/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(?:available|free|open)\s+(?:at|on)\b/i.test(prompt) &&
    /\b(?:slots?|schedule)\s+(?:for|does)\s+[A-Za-z]/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\bfree\s+slots?\s+on\b/i.test(prompt) &&
    /\bfor\s+[A-Za-z][\w\s.'-]{1,40}\s+for\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

export type TeamWideAvailabilitySemanticHints = {
  allProviders: true;
};

function teamWideAvailabilityAnchors(surface: CommandSurface) {
  const allowedActions = [...SURFACE_TEAM_WIDE_AVAILABILITY_ACTIONS[surface]];
  return filterAnchorsForSurface(
    buildCanonicalPhrasingBank([]),
    surface,
    allowedActions,
  ).filter((anchor) => anchor.paramHints?.allProviders === true);
}

export function resolveTeamWideAvailabilitySemanticHints(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): TeamWideAvailabilitySemanticHints | null {
  const trimmed = prompt.trim();
  if (!trimmed || promptImpliesNamedProviderAvailability(trimmed)) {
    return null;
  }

  const anchors = teamWideAvailabilityAnchors(surface);
  if (!anchors.length) return null;

  const ranked = rankAnchorsDeterministic(trimmed, anchors);
  let match = resolveSemanticMatch(ranked, {
    threshold: SEMANTIC_CONCEPT_THRESHOLD,
  });
  if (
    !match &&
    ranked[0] &&
    ranked[0].score >= SEMANTIC_CONCEPT_THRESHOLD &&
    ranked[0].anchor.paramHints?.allProviders === true
  ) {
    match = buildSemanticMatchFromAnchor(ranked[0].anchor, ranked[0].score);
  }
  if (match?.paramHints?.allProviders !== true) return null;

  return { allProviders: true };
}

/** acc-3.14 — team-wide availability meaning via semantic anchors (not paraphrase regex). */
export function impliesTeamWideAvailabilityFromSemantic(
  prompt: string,
  surfaces: readonly CommandSurface[] = DEFAULT_TEAM_WIDE_AVAILABILITY_SURFACES,
): boolean {
  return surfaces.some(
    (surface) => resolveTeamWideAvailabilitySemanticHints(prompt, surface) != null,
  );
}

/** Canonical detector — semantic anchors only (pipe-1.13.2 / acc-3.14). */
export function isTeamWideProviderAvailabilityQuery(prompt: string): boolean {
  return impliesTeamWideAvailabilityFromSemantic(prompt);
}
