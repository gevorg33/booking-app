import { isExplainBusinessHoursAndLocationPrompt } from './ai-explain-business-hours-and-location.util.js';
import { isGetDirectionsToSalonPrompt } from './ai-get-directions-to-salon.util.js';
import { isExplainProviderSpecialtyPrompt } from './ai-explain-provider-specialty.util.js';
import {
  EXPLAIN_SALON_PROFILE_MULTILINGUAL_SCENARIOS,
  type ExplainSalonProfileMultilingualScenario,
} from './ai-explain-salon-profile-multilingual.fixtures.js';
import {
  EXPLAIN_SALON_PROFILE_PROMPTS,
  type ExplainSalonProfilePromptFixture,
  type SalonProfileAspect,
} from './ai-explain-salon-profile.fixtures.js';

export const EXPLAIN_SALON_PROFILE_INTENTS = ['explain_salon_profile'] as const;

export type ExplainSalonProfileIntent =
  (typeof EXPLAIN_SALON_PROFILE_INTENTS)[number];

export { CUSTOMER_PUBLIC_EXPLAIN_SALON_PROFILE_CLASSIFIER_RULES } from './ai-explain-salon-profile.fixtures.js';

const SALON_PROFILE_CUE = new RegExp(
  String.raw`\b(?:salon\s+profile|about\s+(?:the\s+)?salon|about\s+(?:this\s+)?(?:salon|place|business)|tell\s+me\s+about\s+(?:this\s+)?(?:salon|place|business|your\s+business)|view\s+salon\s+details|what(?:'s| is)\s+(?:this\s+place|your\s+salon)\s+(?:like|about)|show\s+(?:me\s+)?(?:the\s+)?salon\s+profile|photos?\s+and\s+reviews?|social\s+media\s+links?)\b|(?:պատմիր|սրահ(?:ի|ում)?\s+էջ|մասին\s+սրահ)|(?:расскаж(?:и|ите)\s+об\s+(?:этом\s+)?салон|профил(?:ь|я)\s+салон)`,
  'iu',
);

const BOOKING_CUE =
  /\b(?:book|reserve|schedule|availability|who(?:'s| is)\s+free)\b/iu;

function matchSalonProfileFixture(
  prompt: string,
): ExplainSalonProfilePromptFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of EXPLAIN_SALON_PROFILE_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function matchSalonProfileMultilingualScenario(
  prompt: string,
): ExplainSalonProfileMultilingualScenario | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of EXPLAIN_SALON_PROFILE_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function inferSalonProfileAspect(prompt: string): SalonProfileAspect {
  if (
    /\b(?:show\s+(?:me\s+)?(?:the\s+)?salon\s+profile|profile\s+page|full\s+profile|everything)\b/i.test(
      prompt,
    ) ||
    /(?:ցույց\s+տուր.*(?:էջ|profile)|покажи\s+профил)/iu.test(prompt)
  ) {
    return 'all';
  }
  if (/\b(?:social\s+media|instagram|facebook|follow\s+us)\b/i.test(prompt)) {
    return 'social';
  }
  if (/\b(?:photos?|gallery|images?)\b/i.test(prompt)) {
    return 'photos';
  }
  if (/\b(?:reviews?|ratings?|testimonials?)\b/i.test(prompt)) {
    return 'reviews';
  }
  if (
    /\b(?:photos?\s+and\s+reviews?|reviews?\s+and\s+photos?)\b/i.test(prompt)
  ) {
    return 'photos';
  }
  return 'overview';
}

export function isExplainSalonProfilePrompt(prompt: string): boolean {
  if (matchSalonProfileFixture(prompt)) return true;
  if (matchSalonProfileMultilingualScenario(prompt)) return true;

  if (isExplainBusinessHoursAndLocationPrompt(prompt)) return false;
  if (isGetDirectionsToSalonPrompt(prompt)) return false;
  if (isExplainProviderSpecialtyPrompt(prompt)) return false;

  if (BOOKING_CUE.test(prompt)) return false;

  return SALON_PROFILE_CUE.test(prompt);
}

export function isExplainSalonProfileIntent(
  action: string,
): action is ExplainSalonProfileIntent {
  return (EXPLAIN_SALON_PROFILE_INTENTS as readonly string[]).includes(action);
}

export function enrichExplainSalonProfileParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const aspect =
    (params.aspect as SalonProfileAspect | undefined) ??
    inferSalonProfileAspect(prompt);
  return {
    ...params,
    aspect,
  };
}

export function parseExplainSalonProfileFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): Record<string, unknown> | null {
  if (!isExplainSalonProfilePrompt(prompt)) return null;
  return enrichExplainSalonProfileParamsFromPrompt(params, prompt);
}

export function rescueExplainSalonProfileIntent(
  prompt: string,
  action: string,
): { action: ExplainSalonProfileIntent; rescueReason: string } | null {
  if (isExplainSalonProfileIntent(action)) return null;
  if (!parseExplainSalonProfileFromPrompt(prompt)) return null;
  return {
    action: 'explain_salon_profile',
    rescueReason: 'salon_profile',
  };
}
