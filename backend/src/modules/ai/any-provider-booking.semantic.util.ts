import type { CommandSurface } from './ai-command-registry.types.js';
import {
  buildSemanticMatchFromAnchor,
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
} from './ai-semantic-intent.util.js';
import { buildCanonicalPhrasingBank } from './intent-phrasing-bank.util.js';
import { ANY_PROVIDER_BOOKING_SEMANTIC_PIPE_MARKER } from './any-provider-booking.semantic.fixtures.js';
import { promptImpliesNamedProviderAvailability } from './team-wide-availability.semantic.util.js';

export { ANY_PROVIDER_BOOKING_SEMANTIC_PIPE_MARKER };

const DEFAULT_ANY_PROVIDER_BOOKING_SURFACES = [
  'dashboard',
  'customer',
  'public',
] as const satisfies readonly CommandSurface[];

const SURFACE_ANY_PROVIDER_BOOKING_ACTIONS: Record<
  CommandSurface,
  readonly string[]
> = {
  dashboard: ['create_booking', 'book_nearest_slot'],
  customer: ['create_booking', 'book_nearest_slot'],
  public: ['create_booking'],
  provider: [],
};

export type AnyProviderBookingSemanticHints = {
  allProviders: true;
};

function anyProviderBookingAnchors(surface: CommandSurface) {
  const allowedActions = [...SURFACE_ANY_PROVIDER_BOOKING_ACTIONS[surface]];
  return filterAnchorsForSurface(
    buildCanonicalPhrasingBank([]),
    surface,
    allowedActions,
  ).filter((anchor) => anchor.paramHints?.anyProviderBooking === true);
}

export function resolveAnyProviderBookingSemanticHints(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): AnyProviderBookingSemanticHints | null {
  const trimmed = prompt.trim();
  if (!trimmed || promptImpliesNamedProviderAvailability(trimmed)) {
    return null;
  }

  const anchors = anyProviderBookingAnchors(surface);
  if (!anchors.length) return null;

  const ranked = rankAnchorsDeterministic(trimmed, anchors);
  let match = resolveSemanticMatch(ranked, {
    threshold: SEMANTIC_CONCEPT_THRESHOLD,
  });
  if (
    !match &&
    ranked[0] &&
    ranked[0].score >= SEMANTIC_CONCEPT_THRESHOLD &&
    ranked[0].anchor.paramHints?.anyProviderBooking === true
  ) {
    match = buildSemanticMatchFromAnchor(ranked[0].anchor, ranked[0].score);
  }
  if (match?.paramHints?.anyProviderBooking !== true) return null;

  return { allProviders: true };
}

/** acc-3.14 — explicit any/whichever/whoever provider booking scope. */
export function impliesAnyProviderBookingFromSemantic(
  prompt: string,
  surfaces: readonly CommandSurface[] = DEFAULT_ANY_PROVIDER_BOOKING_SURFACES,
): boolean {
  return surfaces.some(
    (surface) =>
      resolveAnyProviderBookingSemanticHints(prompt, surface) != null,
  );
}

export function isAnyProviderBookingPrompt(prompt: string): boolean {
  return impliesAnyProviderBookingFromSemantic(prompt);
}
