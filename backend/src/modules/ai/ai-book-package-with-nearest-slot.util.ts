import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { isFirstAvailableBookingPrompt } from './booking-first-available.semantic.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  BOOK_PACKAGE_WITH_NEAREST_SLOT_PROMPTS,
  type BookPackageWithNearestSlotPromptFixture,
} from './ai-book-package-with-nearest-slot.fixtures.js';
import { BOOK_PACKAGE_WITH_NEAREST_SLOT_MULTILINGUAL_SCENARIOS } from './ai-book-package-with-nearest-slot-multilingual.fixtures.js';
import {
  extractPackageNameFromPrompt,
  isBookPackagePrompt,
  isBookWithCashPrompt,
  isCheckPackageAvailabilityPrompt,
  isSelfServiceCustomerPrompt,
} from './ai-self-service-booking.util.js';
import { isBookNearestSlotPrompt } from './ai-payments.util.js';

export const BOOK_PACKAGE_WITH_NEAREST_SLOT_RECIPE_ID =
  'book_package_with_nearest_slot';

export const BOOK_PACKAGE_WITH_NEAREST_SLOT_STEP_ACTIONS = [
  'discover_packages',
  'book_package',
] as const;

export type BookPackageWithNearestSlotStepAction =
  (typeof BOOK_PACKAGE_WITH_NEAREST_SLOT_STEP_ACTIONS)[number];

export type BookPackageWithNearestSlotCompoundStep = {
  action: BookPackageWithNearestSlotStepAction;
  params: Record<string, unknown>;
  segment: string;
};

const HY_RU_NEAREST_PACKAGE_CUE =
  /(?:amragrel|amragrum|գնել|зabron|бронир|купить).{0,40}(?:spa day|փաթեթ|пакет).{0,40}(?:amenamot|amenarajin|slot|ближайш|раньше|скорее)/iu;

function matchBookPackageWithNearestSlotScenario(
  prompt: string,
): BookPackageWithNearestSlotPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of BOOK_PACKAGE_WITH_NEAREST_SLOT_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of BOOK_PACKAGE_WITH_NEAREST_SLOT_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function extractNearestSlotPackageName(prompt: string): string | undefined {
  const scenario = matchBookPackageWithNearestSlotScenario(prompt);
  if (scenario?.packageName) return scenario.packageName;
  if (/\bspa\s+day\b/i.test(prompt) || /\bspa\s+package\b/i.test(prompt)) {
    return 'Spa Day';
  }
  const quoted = prompt.match(/["']([^"']+?)["']\s+package/i)?.[1];
  if (quoted) return quoted.trim();
  const packageNamed = prompt.match(
    /\b(?:book|buy|purchase|reserve|schedule|get)\s+(?:the\s+|a\s+|my\s+)?([a-z][\w\s-]{2,30}?)\s+package\b/i,
  );
  if (packageNamed?.[1]) {
    const raw = packageNamed[1].trim();
    if (/^spa$/i.test(raw)) return 'Spa Day';
    return `${raw} package`;
  }
  const bundleNamed = prompt.match(
    /\b(?:book|buy|purchase|reserve|schedule|get)\s+(?:the\s+|a\s+)?([a-z][\w\s-]{2,30}?)\s+bundle\b/i,
  );
  if (bundleNamed?.[1]) {
    const raw = bundleNamed[1].trim();
    return /\bbundle\b/i.test(raw) ? raw : `${raw} bundle`;
  }
  const dealNamed = prompt.match(
    /\b(?:book|buy|purchase|reserve|schedule|get)\s+(?:the\s+|a\s+)?([a-z][\w\s-]{2,30}?)\s+deal\b/i,
  );
  if (dealNamed?.[1]) return dealNamed[1].trim();
  return extractPackageNameFromPrompt(prompt);
}

export function hasPackageNearestSlotCue(prompt: string): boolean {
  if (isBookNearestSlotPrompt(prompt)) return true;
  if (isFirstAvailableBookingPrompt(prompt)) return true;
  if (HY_RU_NEAREST_PACKAGE_CUE.test(prompt)) return true;
  return (
    /\b(earliest|soonest|nearest|first\s+available|asap|next\s+available)\b/i.test(
      prompt,
    ) && /\b(available|slot|opening|time|appointment|visit)?\b/i.test(prompt)
  );
}

export function wantsPackageBookingPrompt(prompt: string): boolean {
  if (isBookPackagePrompt(prompt)) return true;
  const wantsPackage =
    /\b(package|bundle|spa\s+day|deal)\b/i.test(prompt) ||
    /փաթեթ/i.test(prompt) ||
    /пакет/i.test(prompt);
  const wantsBook =
    /\b(book|buy|purchase|order|get|reserve|schedule)\b/i.test(prompt) ||
    /ամրագրել/i.test(prompt) ||
    /(?:^|\s)(купить|купи|заброн|бронир|запис)(?:\s|$|[.,!?])/i.test(prompt);
  return (
    isSelfServiceCustomerPrompt(prompt) &&
    wantsBook &&
    wantsPackage &&
    !/\b(create|configure|update|deactivate)\b/i.test(prompt)
  );
}

export function isBookPackageWithNearestSlotCompoundPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (text.length < 12) return false;
  if (matchBookPackageWithNearestSlotScenario(text)) return true;
  if (/\b(apply|use)\b/i.test(text) && /\bpromo\b/i.test(text)) return false;
  if (
    isCheckPackageAvailabilityPrompt(text) &&
    (isBookWithCashPrompt(text) || /\bcash\s+at\s+visit\b/i.test(text))
  ) {
    return false;
  }
  if (
    isCheckPackageAvailabilityPrompt(text) &&
    !hasPackageNearestSlotCue(text)
  ) {
    return false;
  }
  if (!wantsPackageBookingPrompt(text)) return false;
  return hasPackageNearestSlotCue(text);
}

export function buildBookPackageWithNearestSlotCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params: Record<string, unknown> = {
    ...buildSharedBookingContextFromPrompt(prompt),
    bookingFirstAvailable: true,
  };
  enrichBookingTimeHintsFromPrompt('book_package', params, prompt);
  const packageName = extractNearestSlotPackageName(prompt);
  if (packageName) params.packageName = packageName;
  return params;
}

export function decomposeBookPackageWithNearestSlotCompoundPrompt(
  prompt: string,
  _surface: Extract<CommandSurface, 'public' | 'customer'> = 'customer',
): BookPackageWithNearestSlotCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isBookPackageWithNearestSlotCompoundPrompt(trimmed)) {
    return [];
  }

  const base = buildBookPackageWithNearestSlotCompoundParams(trimmed);
  const steps: BookPackageWithNearestSlotCompoundStep[] = [
    {
      action: 'discover_packages',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'book_package',
      params: { ...base, bookingFirstAvailable: true },
      segment: trimmed,
    },
  ];

  return propagateSharedBookingContextAcrossSteps(steps);
}

export function decomposeCustomerBookPackageWithNearestSlotCompoundPrompt(
  prompt: string,
): BookPackageWithNearestSlotCompoundStep[] {
  return decomposeBookPackageWithNearestSlotCompoundPrompt(prompt, 'customer');
}

export function decomposePublicBookPackageWithNearestSlotCompoundPrompt(
  prompt: string,
): BookPackageWithNearestSlotCompoundStep[] {
  return decomposeBookPackageWithNearestSlotCompoundPrompt(prompt, 'public');
}

export function rescueBookPackageWithNearestSlotCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isBookPackageWithNearestSlotCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'book_package_with_nearest_slot_compound',
  };
}
