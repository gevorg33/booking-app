import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { isBookNearestSlotPrompt } from './ai-payments.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { enrichCancelMyBookingParamsFromPrompt } from './ai-cancel-my-booking.util.js';
import {
  hasCancelMyBookingCoreCue,
  isCancelPackageVisitSelfPrompt,
  isExplainCancelPolicyPrompt,
  isRescheduleMyBookingPrompt,
} from './ai-self-service-booking.util.js';
import {
  CANCEL_AND_REBOOK_COMPOUND_PROMPTS,
  type CancelAndRebookCompoundFixture,
} from './ai-cancel-and-rebook-compound.fixtures.js';
import { CANCEL_AND_REBOOK_MULTILINGUAL_SCENARIOS } from './ai-cancel-and-rebook-compound-multilingual.fixtures.js';

export const CANCEL_AND_REBOOK_RECIPE_ID = 'cancel_and_rebook';

export const CANCEL_AND_REBOOK_STEP_ACTIONS = [
  'cancel_my_booking',
  'book_nearest_slot',
] as const;

export type CancelAndRebookCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function matchCancelAndRebookScenario(
  prompt: string,
): CancelAndRebookCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of CANCEL_AND_REBOOK_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of CANCEL_AND_REBOOK_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractCancelSegmentFromCompoundPrompt(prompt: string): string {
  const split = prompt.match(
    /^(.*?)(?:\s*[;]\s*|\s+\band\b\s+|\s+\bthen\b\s+|\s*[—–]\s*)(?=\b(?:book|schedule|reserve|get)\b)/i,
  );
  if (split?.[1]?.trim()) {
    return split[1].trim();
  }
  return prompt;
}

export function hasCancelAndRebookBookCue(prompt: string): boolean {
  if (isBookNearestSlotPrompt(prompt)) return true;
  return (
    /\b(?:book|schedule|reserve|get)\b/i.test(prompt) &&
    /\b(?:nearest|soonest|next|earliest|first\s+available|asap|available\s+slot|opening)\b/i.test(
      prompt,
    )
  );
}

export function hasCancelAndRebookCancelCue(prompt: string): boolean {
  if (isExplainCancelPolicyPrompt(prompt)) return false;
  if (isCancelPackageVisitSelfPrompt(prompt)) return false;
  if (/\bcancel\s+bookings\b/i.test(prompt)) return false;
  if (isRescheduleMyBookingPrompt(prompt) && !/\bcancel\b/i.test(prompt)) {
    return false;
  }
  return hasCancelMyBookingCoreCue(prompt);
}

export function isCancelAndRebookCompoundPrompt(prompt: string): boolean {
  if (matchCancelAndRebookScenario(prompt)) return true;
  const text = prompt.trim();
  if (text.length < 20) return false;
  if (!hasCancelAndRebookCancelCue(text)) return false;
  if (!hasCancelAndRebookBookCue(text)) return false;
  return true;
}

export function buildCancelAndRebookCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const cancelSegment = extractCancelSegmentFromCompoundPrompt(prompt);
  const params = {
    ...buildSharedBookingContextFromPrompt(prompt),
    ...enrichCancelMyBookingParamsFromPrompt({}, cancelSegment),
    bookingFirstAvailable: true,
  };
  enrichBookingTimeHintsFromPrompt('book_nearest_slot', params, prompt);
  return params;
}

export function decomposeCancelAndRebookCompoundPrompt(
  prompt: string,
): CancelAndRebookCompoundStep[] {
  if (!isCancelAndRebookCompoundPrompt(prompt)) return [];

  const base = buildCancelAndRebookCompoundParams(prompt);

  return propagateSharedBookingContextAcrossSteps([
    {
      action: 'cancel_my_booking',
      params: { ...base },
      segment: prompt,
    },
    {
      action: 'book_nearest_slot',
      params: { ...base, bookingFirstAvailable: true },
      segment: prompt,
    },
  ]);
}

export function rescueCancelAndRebookCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isCancelAndRebookCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'cancel_and_rebook_compound',
  };
}
