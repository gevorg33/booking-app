import type { CommandSurface } from './ai-command-registry.types.js';
import {
  buildSemanticMatchFromAnchor,
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
} from './ai-semantic-intent.util.js';
import { buildCanonicalPhrasingBank } from './intent-phrasing-bank.util.js';
import { BOOKING_FIRST_AVAILABLE_SEMANTIC_PIPE_MARKER } from './booking-first-available.semantic.fixtures.js';

export { BOOKING_FIRST_AVAILABLE_SEMANTIC_PIPE_MARKER };

const DEFAULT_BOOKING_FIRST_AVAILABLE_SURFACES = [
  'dashboard',
  'customer',
  'public',
] as const satisfies readonly CommandSurface[];

const SURFACE_BOOKING_FIRST_AVAILABLE_ACTIONS: Record<
  CommandSurface,
  readonly string[]
> = {
  dashboard: ['create_booking', 'book_nearest_slot'],
  customer: ['create_booking', 'book_nearest_slot'],
  public: ['create_booking'],
  provider: [],
};

const FIXED_BOOKING_TIME_IN_PROMPT =
  /(?:\bat\s+|\bв\s+)\d{1,2}:\d{2}\b|\b\d{1,2}:\d{2}\b/i;

function promptImpliesFixedBookingTime(prompt: string): boolean {
  return FIXED_BOOKING_TIME_IN_PROMPT.test(prompt);
}

export type BookingFirstAvailableSemanticHints = {
  bookingFirstAvailable: true;
  allProviders?: boolean;
};

function bookingFirstAvailableAnchors(surface: CommandSurface) {
  const allowedActions = [...SURFACE_BOOKING_FIRST_AVAILABLE_ACTIONS[surface]];
  return filterAnchorsForSurface(
    buildCanonicalPhrasingBank([]),
    surface,
    allowedActions,
  ).filter((anchor) => anchor.paramHints?.bookingFirstAvailable === true);
}

export function resolveBookingFirstAvailableSemanticHints(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): BookingFirstAvailableSemanticHints | null {
  const trimmed = prompt.trim();
  if (!trimmed || promptImpliesFixedBookingTime(trimmed)) return null;

  const anchors = bookingFirstAvailableAnchors(surface);
  if (!anchors.length) return null;

  const ranked = rankAnchorsDeterministic(trimmed, anchors);
  let match = resolveSemanticMatch(ranked, {
    threshold: SEMANTIC_CONCEPT_THRESHOLD,
  });
  if (
    !match &&
    ranked[0] &&
    ranked[0].score >= SEMANTIC_CONCEPT_THRESHOLD &&
    ranked[0].anchor.paramHints?.bookingFirstAvailable === true
  ) {
    match = buildSemanticMatchFromAnchor(ranked[0].anchor, ranked[0].score);
  }
  if (!match?.paramHints?.bookingFirstAvailable) return null;

  const hints: BookingFirstAvailableSemanticHints = {
    bookingFirstAvailable: true,
  };
  if (match.paramHints.allProviders === true) {
    hints.allProviders = true;
  }
  return hints;
}

/** acc-3.14 — first-available booking meaning via semantic anchors (not paraphrase regex). */
export function impliesBookingFirstAvailableFromSemantic(
  prompt: string,
  surfaces: readonly CommandSurface[] = DEFAULT_BOOKING_FIRST_AVAILABLE_SURFACES,
): boolean {
  return surfaces.some(
    (surface) =>
      resolveBookingFirstAvailableSemanticHints(prompt, surface) != null,
  );
}

/** Canonical detector — semantic anchors only (pipe-1.13.1 / acc-3.14). */
export function isFirstAvailableBookingPrompt(prompt: string): boolean {
  return impliesBookingFirstAvailableFromSemantic(prompt);
}
