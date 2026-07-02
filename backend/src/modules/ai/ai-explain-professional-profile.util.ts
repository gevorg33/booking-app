import { EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_SCENARIOS } from './ai-explain-professional-profile-multilingual.fixtures.js';
import { isExplainRecommendationSetupPrompt } from './ai-recommendation-product.util.js';
import {
  EXPLAIN_PROFESSIONAL_PROFILE_PROMPTS,
  type ExplainProfessionalProfilePromptFixture,
  type ProfessionalProfileAspect,
} from './ai-explain-professional-profile.fixtures.js';

export { EXPLAIN_PROFESSIONAL_PROFILE_CLASSIFIER_RULES } from './ai-explain-professional-profile.fixtures.js';
export { EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-professional-profile-multilingual.fixtures.js';

export const EXPLAIN_PROFESSIONAL_PROFILE_INTENTS = [
  'explain_professional_profile',
] as const;

export type ExplainProfessionalProfileIntent =
  (typeof EXPLAIN_PROFESSIONAL_PROFILE_INTENTS)[number];

export interface ParsedExplainProfessionalProfile {
  aspect: ProfessionalProfileAspect;
  providerName?: string;
}

const SPECIALTY_MATCH_BLOCK = new RegExp(
  String.raw`\b(?:who is best for|who specializes in|specialist in|expert in|good (?:with|for|at)|best for|who should i see for|which stylist knows|who(?:'s| is) the expert in)\b|(?:լավագույնը|մասնագիտանում)|(?:лучше всего|специализируется\s+на)`,
  'iu',
);

const TELL_ME_ABOUT_BLOCK = new RegExp(
  String.raw`\b(?:tell me about|learn(?: more)? about|who is\s+(?!best\b|good\b|the\s+best\b|the\s+expert\b))\b|պատմիր|(?:расскажи|расскажите)\s+(?:об|о)\b`,
  'iu',
);

const PICK_PROVIDER_BLOCK = new RegExp(
  String.raw`\b(?:book|schedule|reserve)\s+with\b|\b(?:pick|choose|select)\s+[A-Za-z].+?\s+for\b`,
  'iu',
);

const NAMED_PROFILE_PATTERNS: ReadonlyArray<RegExp> = [
  /\bshow\s+me\s+(.+?)(?:'s|’s)\s+(?:services|profile)\b/i,
  /\bopen\s+(.+?)(?:'s|’s)\s+profile\b/i,
  /\bview\s+(.+?)(?:'s|’s)\s+(?:profile|professional profile)\b/i,
  /\bwhat\s+services\s+does\s+(.+?)\s+offer\b/i,
  /\bsee\s+(.+?)(?:'s|’s)\s+services\b/i,
  /ցույց\s+տուր\s+(.+?)(?:-ի)?\s+ծառայություն/i,
  /բացիր\s+(.+?)(?:-ի)?\s+պրոֆիլ/i,
  /покажи\s+услуги\s+(.+?)(?:\?|$)/iu,
  /открой\s+профиль\s+(.+?)(?:\?|$)/iu,
];

const CURRENT_PROVIDER_PATTERNS: ReadonlyArray<RegExp> = [
  /\bwhat\s+does\s+this\s+(?:stylist|provider|specialist|therapist)\s+specialize\s+in\b/i,
  /\bshow\s+this\s+(?:stylist|provider|specialist)(?:'s|’s)?\s+services\b/i,
  /\bthis\s+(?:stylist|provider|specialist)(?:'s|’s)?\s+profile\b/i,
  /ինչ\s+է\s+մասնագիտանում\s+այս\s+ստայլիստ/i,
  /в\s+чем\s+специализация\s+этого\s+стилист/i,
];

const BROWSE_PROFESSIONALS_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(?:browse|view|show)\s+(?:all\s+)?(?:stylists|professionals|specialists|team profiles?)\b/i,
  /\b(?:browse|view)\s+the\s+team\b/i,
  /դիտել\s+մասնագետ/i,
  /посмотреть\s+специалист/i,
];

function cleanCapturedPhrase(value: string): string {
  return value
    .replace(/[?.!,]+$/g, '')
    .replace(/-ի$/u, '')
    .replace(/-ին$/u, '')
    .trim();
}

function matchExplainProfessionalProfileScenario(
  prompt: string,
): ExplainProfessionalProfilePromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_PROFESSIONAL_PROFILE_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractProviderNameForProfilePrompt(
  prompt: string,
): string | null {
  for (const pattern of NAMED_PROFILE_PATTERNS) {
    const match = prompt.match(pattern);
    const raw = match?.[1]?.trim();
    if (!raw) continue;
    const providerName = cleanCapturedPhrase(raw);
    if (!providerName || providerName.length < 2) continue;
    if (
      /\b(?:any|first|available|this|team|all)\b/i.test(providerName) ||
      /\b(?:stylist|provider|specialist|therapist)\b/i.test(providerName)
    ) {
      continue;
    }
    return providerName;
  }
  return null;
}

export function hasCurrentProviderProfileCue(prompt: string): boolean {
  return CURRENT_PROVIDER_PATTERNS.some((pattern) => pattern.test(prompt));
}

export function hasBrowseProfessionalsCue(prompt: string): boolean {
  return BROWSE_PROFESSIONALS_PATTERNS.some((pattern) => pattern.test(prompt));
}

export function inferProfessionalProfileAspect(
  prompt: string,
): ProfessionalProfileAspect {
  if (hasBrowseProfessionalsCue(prompt)) return 'browse_professionals';
  if (hasCurrentProviderProfileCue(prompt)) return 'current_provider_profile';
  if (extractProviderNameForProfilePrompt(prompt)) {
    return 'named_provider_profile';
  }
  return 'named_provider_profile';
}

export function isExplainProfessionalProfileIntent(
  action: string,
): action is ExplainProfessionalProfileIntent {
  return (EXPLAIN_PROFESSIONAL_PROFILE_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isExplainProfessionalProfilePrompt(prompt: string): boolean {
  if (isExplainRecommendationSetupPrompt(prompt)) return false;
  if (matchExplainProfessionalProfileScenario(prompt)) return true;
  if (SPECIALTY_MATCH_BLOCK.test(prompt)) return false;
  if (TELL_ME_ABOUT_BLOCK.test(prompt)) return false;
  if (PICK_PROVIDER_BLOCK.test(prompt)) return false;
  if (hasBrowseProfessionalsCue(prompt)) return true;
  if (hasCurrentProviderProfileCue(prompt)) return true;
  if (extractProviderNameForProfilePrompt(prompt)) return true;
  return false;
}

export function parseExplainProfessionalProfileFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainProfessionalProfile | null {
  if (!isExplainProfessionalProfilePrompt(prompt)) return null;

  const scenario = matchExplainProfessionalProfileScenario(prompt);
  const aspectFromParams =
    params.aspect === 'named_provider_profile' ||
    params.aspect === 'current_provider_profile' ||
    params.aspect === 'browse_professionals'
      ? params.aspect
      : undefined;
  const aspect =
    aspectFromParams ??
    scenario?.aspect ??
    inferProfessionalProfileAspect(prompt);

  if (aspect === 'browse_professionals') {
    return { aspect };
  }

  if (aspect === 'current_provider_profile') {
    return { aspect };
  }

  const providerName =
    (params.providerName as string | undefined) ??
    scenario?.providerName ??
    extractProviderNameForProfilePrompt(prompt) ??
    undefined;

  return {
    aspect: 'named_provider_profile',
    ...(providerName ? { providerName } : {}),
  };
}

export function rescueExplainProfessionalProfileIntent(
  prompt: string,
  action: string,
): { action: ExplainProfessionalProfileIntent; rescueReason: string } | null {
  if (isExplainProfessionalProfileIntent(action)) return null;
  if (!parseExplainProfessionalProfileFromPrompt(prompt)) return null;
  return {
    action: 'explain_professional_profile',
    rescueReason: 'professional_profile',
  };
}

export function detectExplainProfessionalProfileAction(
  prompt: string,
): ExplainProfessionalProfileIntent | null {
  return (
    rescueExplainProfessionalProfileIntent(prompt, 'unknown')?.action ?? null
  );
}

export function enrichExplainProfessionalProfileParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseExplainProfessionalProfileFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    aspect: parsed.aspect,
    ...(parsed.providerName ? { providerName: parsed.providerName } : {}),
  };
}
