import type { ClassificationSurface } from './ai-classification-engine.types.js';
import {
  HONEST_FAILURE_CONFIDENCE_THRESHOLD,
  HONEST_FAILURE_SUGGESTIONS,
  type HonestFailureSuggestion,
} from './ai-honest-failure-clarify.fixtures.js';
import {
  isStillUncertainAfterClarify,
  readClarifyRound,
  resolveHonestFailureSurface,
  type HonestFailureClarifyInput,
} from './ai-honest-failure-clarify.util.js';
import { ESCALATION_HANDOFF_CLARIFY_ROUNDS } from './ai-escalation-handoff.fixtures.js';
import { SMART_CLARIFY_MAX_ROUNDS } from './ai-smart-clarify.fixtures.js';
import {
  SUGGESTED_ACTION_FALLBACK_SCENARIOS,
} from './ai-suggested-action-fallback.fixtures.js';
import type { CommandResult } from './command-completion.types.js';

export { SUGGESTED_ACTION_FALLBACK_SCENARIOS } from './ai-suggested-action-fallback.fixtures.js';

export const SUGGESTED_ACTION_FALLBACK_SUMMARY =
  "I didn't fully understand — pick the closest command or rephrase:";

const MAX_SUGGESTIONS = 3;

const ACTION_LABELS: Record<string, string> = {
  list_bookings: "Show today's appointments",
  show_appointments: "Show today's appointments",
  create_booking: 'Book an appointment',
  check_availability: 'Check provider availability',
  check_providers_for_service: 'Check provider availability',
  list_my_appointments: 'My upcoming appointments',
  book_appointment: 'Book appointment',
  list_my_bookings: 'My schedule today',
  mark_paid: 'Mark booking paid',
  business_info: 'Business hours',
  booking_help: 'How booking works',
};

const ACTION_PROMPTS: Record<string, string> = {
  list_bookings: 'Show all appointments today',
  show_appointments: 'Show all appointments today',
  create_booking: 'Book an appointment tomorrow at 10:00',
  check_availability: 'Who is free tomorrow for massage',
  check_providers_for_service: 'Who is free tomorrow for massage',
  list_my_appointments: 'Show my upcoming appointments',
  book_appointment: 'Book the nearest slot for massage tomorrow evening',
  list_my_bookings: 'Show my appointments today',
  mark_paid: 'Mark my last appointment as paid',
  business_info: 'What are your opening hours',
  booking_help: 'How do I book an appointment',
};

const PROMPT_KEYWORDS: Record<string, string[]> = {
  list_bookings: ['show', 'list', 'today', 'appointments', 'schedule'],
  show_appointments: ['show', 'list', 'today', 'appointments'],
  create_booking: ['book', 'appointment', 'schedule', 'reserve', 'slot'],
  check_availability: ['free', 'available', 'availability', 'who', 'open'],
  check_providers_for_service: ['free', 'available', 'provider', 'who'],
  list_my_appointments: ['my', 'upcoming', 'appointments', 'bookings'],
  book_appointment: ['book', 'nearest', 'slot', 'appointment'],
  list_my_bookings: ['my', 'today', 'schedule', 'appointments'],
  mark_paid: ['paid', 'payment', 'mark'],
  business_info: ['hours', 'open', 'location', 'address', 'when'],
  booking_help: ['how', 'help', 'book'],
};

function humanizeAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

function defaultPromptForAction(action: string): string {
  return ACTION_PROMPTS[action] ?? humanizeAction(action);
}

export function buildSuggestionFromAction(action: string): HonestFailureSuggestion {
  return {
    id: action,
    label: humanizeAction(action),
    prompt: defaultPromptForAction(action),
  };
}

export function scoreSuggestionForPrompt(
  prompt: string,
  suggestion: HonestFailureSuggestion,
): number {
  const lower = prompt.toLowerCase();
  let score = 0;
  const actionKey = suggestion.id.replace(/-/g, '_');
  for (const keyword of PROMPT_KEYWORDS[actionKey] ?? []) {
    if (lower.includes(keyword)) score += 2;
  }
  for (const token of suggestion.label.toLowerCase().split(/\s+/)) {
    if (token.length > 3 && lower.includes(token)) score += 1;
  }
  for (const token of suggestion.prompt.toLowerCase().split(/\s+/)) {
    if (token.length > 4 && lower.includes(token)) score += 0.5;
  }
  return score;
}

/** acc-6.6 — closest valid commands as one-tap chips when classification fails. */
export function pickSuggestedActionFallback(input: {
  surface: ClassificationSurface;
  prompt?: string;
  shortlist?: string[];
  semanticCandidates?: Array<{ action: string; label?: string; prompt?: string }>;
}): HonestFailureSuggestion[] {
  const fromSemantic =
    input.semanticCandidates
      ?.filter((candidate) => candidate.action && candidate.action !== 'unknown')
      .map((candidate) => ({
        id: candidate.action,
        label: candidate.label ?? humanizeAction(candidate.action),
        prompt: candidate.prompt ?? defaultPromptForAction(candidate.action),
      })) ?? [];

  if (fromSemantic.length >= 2) {
    const ranked = [...fromSemantic];
    if (input.prompt?.trim()) {
      ranked.sort(
        (a, b) =>
          scoreSuggestionForPrompt(input.prompt!, b) -
          scoreSuggestionForPrompt(input.prompt!, a),
      );
    }
    return ranked.slice(0, MAX_SUGGESTIONS);
  }

  const fromShortlist =
    input.shortlist
      ?.filter((action) => action && action !== 'unknown')
      .map((action) => buildSuggestionFromAction(action)) ?? [];

  if (fromShortlist.length > 0) {
    const ranked = [...fromShortlist];
    if (input.prompt?.trim()) {
      ranked.sort(
        (a, b) =>
          scoreSuggestionForPrompt(input.prompt!, b) -
          scoreSuggestionForPrompt(input.prompt!, a),
      );
    }
    return ranked.slice(0, MAX_SUGGESTIONS);
  }

  const resolvedSurface = resolveHonestFailureSurface(input.surface);
  return HONEST_FAILURE_SUGGESTIONS[resolvedSurface].slice(0, MAX_SUGGESTIONS);
}

/** acc-6.6 — classification truly failed (unknown or still uncertain after clarify). */
export function isClassificationTrulyFailed(
  input: HonestFailureClarifyInput,
): boolean {
  if (input.action === 'unknown') return true;
  return isStillUncertainAfterClarify(input);
}

/** acc-6.6 — offer closest-command chips instead of dead-ending. */
export function shouldOfferSuggestedActionFallback(
  input: HonestFailureClarifyInput,
  phase: 'early' | 'late' = 'late',
): boolean {
  const round = readClarifyRound(input.sessionContext);
  if (round >= ESCALATION_HANDOFF_CLARIFY_ROUNDS) return false;
  if (!isClassificationTrulyFailed(input)) return false;

  if (phase === 'early') {
    if (round > 0) return false;
    if (input.action !== 'unknown') return false;
    if (
      Array.isArray(input.params._semanticClarifyCandidates) &&
      (input.params._semanticClarifyCandidates as unknown[]).length > 0
    ) {
      return false;
    }
    const confidence =
      input.confidence ??
      (input.params._fieldConfidence as { action?: number } | undefined)?.action ??
      0;
    return confidence < HONEST_FAILURE_CONFIDENCE_THRESHOLD;
  }

  const maxRounds = input.maxClarifyRounds ?? SMART_CLARIFY_MAX_ROUNDS;
  return round >= maxRounds;
}

export function buildSuggestedActionFallbackClarifyResult(
  input: HonestFailureClarifyInput,
  phase: 'early' | 'late' = 'late',
): CommandResult | null {
  if (!shouldOfferSuggestedActionFallback(input, phase)) return null;

  const suggestions = pickSuggestedActionFallback({
    surface: input.surface,
    prompt: input.prompt,
    shortlist: input.shortlist,
    semanticCandidates: input.params._semanticCandidates as
      | Array<{ action: string; label?: string; prompt?: string }>
      | undefined,
  });

  if (suggestions.length === 0) return null;

  const clarifyKind =
    phase === 'early' ? 'suggested_action_fallback' : 'honest_failure';

  return {
    success: false,
    action: 'clarify',
    summary: SUGGESTED_ACTION_FALLBACK_SUMMARY,
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: 'suggested_action_fallback',
      clarifyKind,
      suggestedCommands: suggestions,
      pipelineStage: 'clarify',
      reasoning: input.reasoning,
      suggestedActionFallback: {
        phase,
        clarifyRound: readClarifyRound(input.sessionContext),
        suggestionCount: suggestions.length,
      },
    },
  };
}
