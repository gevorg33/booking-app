import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { isFirstAvailableBookingPrompt } from './booking-first-available.semantic.util.js';
import { isBookNearestSlotPrompt } from './ai-payments.util.js';
import { isStaffBookLabCollectionPrompt } from './ai-clinic-lab-booking.util.js';
import { extractOrderIdFromPrompt } from './ai-clinic-test-result.util.js';
import { BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_SCENARIOS } from './ai-book-lab-collection-nearest-multilingual.fixtures.js';
import {
  BOOK_LAB_COLLECTION_NEAREST_PROMPTS,
  type BookLabCollectionNearestPromptFixture,
} from './ai-book-lab-collection-nearest.fixtures.js';
import type { CommandSurface } from './ai-command-registry.types.js';

export const BOOK_LAB_COLLECTION_NEAREST_RECIPE_ID =
  'book_lab_collection_nearest';

export const BOOK_LAB_COLLECTION_NEAREST_STEP_ACTIONS = [
  'list_my_lab_booking_requests',
  'book_lab_collection',
] as const;

export type BookLabCollectionNearestStepAction =
  (typeof BOOK_LAB_COLLECTION_NEAREST_STEP_ACTIONS)[number];

export type BookLabCollectionNearestCompoundStep = {
  action: BookLabCollectionNearestStepAction;
  params: Record<string, unknown>;
  segment: string;
};

const HY_RU_LAB_NEAREST_CUE =
  /(?:amragrel|amragrum|գրանցիր|зabron|бронир|запиши).{0,40}(?:լաբ|արյան|лаб|забор|кров).{0,40}(?:amenamot|amenarajin|slot|ближайш|раньше|скорее|asap)/iu;

const LAB_COLLECTION_TOPIC = new RegExp(
  String.raw`\b(?:lab\s+(?:collection|draw|visit|blood\s+draw)|blood\s+draw|lab\s+draw)\b|(?:լաբ(?:որատոր)?\s*հավաք|արյան\s*վերց|лабораторн[\p{L}\p{M}]*\s+забор|забор\s+крови)`,
  'iu',
);

const NEAREST_SLOT_CUE = new RegExp(
  String.raw`\b(?:earliest|soonest|nearest|first\s+available|asap|next\s+available)\b|(?:ամենամոտ|ամենաառաջին|скорее|ближайш|раньше|как\s+можно\s+скорее)`,
  'iu',
);

function matchBookLabCollectionNearestScenario(
  prompt: string,
): BookLabCollectionNearestPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of BOOK_LAB_COLLECTION_NEAREST_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function hasLabCollectionNearestSlotCue(prompt: string): boolean {
  if (isFirstAvailableBookingPrompt(prompt)) return true;
  if (HY_RU_LAB_NEAREST_CUE.test(prompt)) return true;
  return NEAREST_SLOT_CUE.test(prompt);
}

export function hasLabCollectionBookingTopic(prompt: string): boolean {
  return (
    LAB_COLLECTION_TOPIC.test(prompt) ||
    /\b(?:book|schedule|reserve)\b.*\b(?:my|the)\b.*\b(?:lab|blood)\b/i.test(
      prompt,
    )
  );
}

export function isBookLabCollectionNearestCompoundPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchBookLabCollectionNearestScenario(text)) return true;
  if (isStaffBookLabCollectionPrompt(text)) return false;
  if (!hasLabCollectionBookingTopic(text)) return false;
  if (!hasLabCollectionNearestSlotCue(text)) return false;
  if (isBookNearestSlotPrompt(text) && !LAB_COLLECTION_TOPIC.test(text)) {
    return false;
  }
  return true;
}

export function buildBookLabCollectionNearestCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const scenario = matchBookLabCollectionNearestScenario(prompt);
  const params: Record<string, unknown> = {
    ...buildSharedBookingContextFromPrompt(prompt),
    bookingFirstAvailable: true,
    timeSlot: null,
  };
  enrichBookingTimeHintsFromPrompt('book_lab_collection', params, prompt);

  const orderId = extractOrderIdFromPrompt(prompt);
  if (orderId) params.orderId = orderId;

  const testName =
    scenario?.testName ??
    (typeof params.testName === 'string' ? params.testName : undefined);
  if (testName) params.testName = testName;

  return params;
}

export function decomposeBookLabCollectionNearestCompoundPrompt(
  prompt: string,
  _surface: Extract<CommandSurface, 'public' | 'customer'> = 'customer',
): BookLabCollectionNearestCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isBookLabCollectionNearestCompoundPrompt(trimmed)) {
    return [];
  }

  const base = buildBookLabCollectionNearestCompoundParams(trimmed);
  const steps: BookLabCollectionNearestCompoundStep[] = [
    {
      action: 'list_my_lab_booking_requests',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'book_lab_collection',
      params: { ...base, bookingFirstAvailable: true, timeSlot: null },
      segment: trimmed,
    },
  ];

  return propagateSharedBookingContextAcrossSteps(steps);
}

export function decomposeCustomerBookLabCollectionNearestCompoundPrompt(
  prompt: string,
): BookLabCollectionNearestCompoundStep[] {
  return decomposeBookLabCollectionNearestCompoundPrompt(prompt, 'customer');
}

export function decomposePublicBookLabCollectionNearestCompoundPrompt(
  prompt: string,
): BookLabCollectionNearestCompoundStep[] {
  return decomposeBookLabCollectionNearestCompoundPrompt(prompt, 'public');
}

export function rescueBookLabCollectionNearestCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isBookLabCollectionNearestCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'book_lab_collection_nearest_compound',
  };
}
