import { isExplainAnyProviderOptionPrompt } from './ai-explain-any-provider-option.util.js';
import { isExplainProfessionalProfilePrompt } from './ai-explain-professional-profile.util.js';
import { isTeamFloorStatusPrompt } from './ai-provider-exp-2.util.js';
import { isExplainTenantAppInstallPrompt } from './ai-tenant-app-install.util.js';
import { isLookupServiceAssignmentPrompt } from './ai-intent-disambiguation.util.js';

export const CUSTOMER_PUBLIC_EXPLAIN_PROVIDER_SPECIALTY_CLASSIFIER_RULES = `- explain_provider_specialty: READ — explain a provider's role, specialty/bio copy from their profile, linked services, and ratings; or match specialists to a hair/skin/service topic (e.g. curly hair, balayage). Triggers: "Who is best for curly hair?", "Tell me about Anna", "Who specializes in color?", "What is Maria's specialty?". Set aspect to named_provider when a person is named (providerName) or specialty_match when asking who fits a topic (specialtyTopic). Navigate to the professionals profile when possible. NOT explain_professional_profile (open profile page / show services list), NOT explain_any_provider_option (Any stylist picker), NOT recommend_specialists (ranked availability/slots this week), NOT list_providers (roster only), NOT check_availability (slot search), NOT business_info / explain_salon_profile (salon or business overview — "Tell me about this salon", "Tell me about this business", "salon info", "business info").`;

export type ProviderSpecialtyAspect = 'named_provider' | 'specialty_match';

export type ExplainProviderSpecialtyPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_provider_specialty';
  aspect?: ProviderSpecialtyAspect;
  providerName?: string;
  specialtyTopic?: string;
  rescueReason: 'provider_specialty';
};

export const EXPLAIN_PROVIDER_SPECIALTY_PROMPTS: readonly ExplainProviderSpecialtyPromptFixture[] =
  [
    {
      id: 'best-for-curly-hair-customer',
      prompt: 'Who is best for curly hair?',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'curly hair',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'tell-me-about-anna-customer',
      prompt: 'Tell me about Anna',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Anna',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'specializes-balayage-customer',
      prompt: 'Who specializes in balayage?',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'balayage',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'maria-specialty-customer',
      prompt: "What is Maria's specialty?",
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Maria',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'alex-color-customer',
      prompt: 'Does Alex do color treatments?',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Alex',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'sensitive-skin-customer',
      prompt: 'Who is good with sensitive skin?',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'sensitive skin',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'learn-about-sophie-customer',
      prompt: 'Learn about Sophie',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Sophie',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'mens-fades-customer',
      prompt: "Who is the expert in men's fades?",
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: "men's fades",
      rescueReason: 'provider_specialty',
    },
    {
      id: 'stylist-curly-hair-customer',
      prompt: 'Which stylist knows curly hair?',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'curly hair',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'wedding-makeup-customer',
      prompt: 'Who should I see for wedding makeup?',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'wedding makeup',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'emma-keratin-customer',
      prompt: 'Does Emma do keratin treatments?',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Emma',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'who-is-james-customer',
      prompt: 'Who is James?',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'James',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'best-for-curly-hair-public',
      prompt: 'Who is best for curly hair?',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'curly hair',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'tell-me-about-anna-public',
      prompt: 'Tell me about Anna',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Anna',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'specializes-balayage-public',
      prompt: 'Who specializes in balayage?',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'balayage',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'maria-specialty-public',
      prompt: "What is Maria's specialty?",
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Maria',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'alex-color-public',
      prompt: 'Does Alex do color treatments?',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Alex',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'sensitive-skin-public',
      prompt: 'Who is good with sensitive skin?',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'sensitive skin',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'learn-about-sophie-public',
      prompt: 'Learn about Sophie',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Sophie',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'mens-fades-public',
      prompt: "Who is the expert in men's fades?",
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: "men's fades",
      rescueReason: 'provider_specialty',
    },
    {
      id: 'stylist-curly-hair-public',
      prompt: 'Which stylist knows curly hair?',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'curly hair',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'wedding-makeup-public',
      prompt: 'Who should I see for wedding makeup?',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'wedding makeup',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'emma-keratin-public',
      prompt: 'Does Emma do keratin treatments?',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Emma',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'who-is-james-public',
      prompt: 'Who is James?',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'James',
      rescueReason: 'provider_specialty',
    },
  ];

const NAMED_PROVIDER_PATTERNS: ReadonlyArray<RegExp> = [
  // e2e-bug.93 — "what does Karo specialize in?"
  /\bwhat\s+does\s+([A-Za-z][\w.'-]{1,40})\s+specialize\s+in\b/i,
  /\bwhat\s+is\s+([A-Za-z][\w.'-]{1,40})\s+speciali[sz]ed\s+in\b/i,
  /\btell me about\s+(.+?)(?:\?|$)/i,
  /\blearn(?: more)? about\s+(.+?)(?:\?|$)/i,
  /\bwho is\s+(?!best\b|good\b|the\s+best\b|the\s+expert\b)(.+?)(?:\?|$)/i,
  /\bwhat(?:'s| is)\s+(.+?)(?:'s)?\s+specialty\b/i,
  /\bdoes\s+([A-Za-z][\w'-]*)\s+do\b/i,
  /պատմիր\s+(.+?)\s+մասին/iu,
  /(?:расскажи|расскажите)\s+(?:об|о)\s+(.+?)(?:\?|$)/iu,
];

const SPECIALTY_TOPIC_PATTERNS: ReadonlyArray<RegExp> = [
  /\bwho is best for\s+(.+?)(?:\?|$)/i,
  /\bwho specializes in\s+(.+?)(?:\?|$)/i,
  /\bspecialist in\s+(.+?)(?:\?|$)/i,
  /\bexpert in\s+(.+?)(?:\?|$)/i,
  /\bgood (?:with|for|at)\s+(.+?)(?:\?|$)/i,
  /\bbest for\s+(.+?)(?:\?|$)/i,
  /\bwho should i see for\s+(.+?)(?:\?|$)/i,
  /\bwhich stylist knows\s+(.+?)(?:\?|$)/i,
  /\bwho(?:'s| is) the expert in\s+(.+?)(?:\?|$)/i,
  /\bexperienced (?:with|in)\s+(.+?)(?:\?|$)/i,
  /լավագույնը\s+(.+?)\s+համար/iu,
  /մասնագիտանում\s+(.+?)-ում/iu,
  /(?:лучше всего|лучше)\s+(?:подходит\s+)?(?:для\s+)?(.+?)(?:\?|$)/iu,
  /специализируется\s+на\s+(.+?)(?:\?|$)/iu,
];

function cleanCapturedPhrase(value: string): string {
  return value.replace(/[?.!,]+$/g, '').trim();
}

/**
 * e2e-bug.191 — salon/business overview cues must never become named-provider specialty.
 * Covers "this/the/your salon|business", "salon info", "business / salon info".
 */
export function isSalonOrBusinessAboutPrompt(prompt: string): boolean {
  const normalized = prompt.trim();
  if (!normalized) return false;
  if (
    /\b(?:tell\s+me\s+about|learn(?:\s+more)?\s+about)\s+(?:the|this|your)\s+(?:salon|business|studio|spa|place|company)\b/i.test(
      normalized,
    )
  ) {
    return true;
  }
  if (
    /\b(?:about)\s+(?:the|this|your)\s+(?:salon|business|studio|spa|place)\b/i.test(
      normalized,
    )
  ) {
    return true;
  }
  if (/\b(?:salon|business)\s+info(?:rmation)?\b/i.test(normalized)) {
    return true;
  }
  if (
    /\b(?:this|the|your)\s+(?:salon|business|studio|spa)\s+(?:info|profile|details|description)\b/i.test(
      normalized,
    )
  ) {
    return true;
  }
  if (
    /\bwhat(?:'s| is)\s+(?:this|your)\s+(?:salon|business|place)\b/i.test(
      normalized,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * e2e-bug.346 — "tell me about"/"learn about" followed by "this/the/your X"
 * is virtually never a person-name search (you'd say "tell me about Anna",
 * not "tell me about this Anna") — it's a reference to some other noun
 * (salon, booking, tour, ...). Generalizes e2e-bug.191's salon/business-only
 * exclusion so a new noun (e.g. "this booking", "the wine tour" — task #259)
 * doesn't need its own one-off allowlist entry every time one is reported.
 */
function isDeterminerAboutPrompt(prompt: string): boolean {
  return /\b(?:tell\s+me\s+about|learn(?:\s+more)?\s+about)\s+(?:this|the|your)\s+\S/i.test(
    prompt,
  );
}

function isNonPersonProviderCapture(cleaned: string): boolean {
  if (!cleaned) return true;
  // Any capture that names the venue (not a person) — including long slash forms
  // like "this business / salon info" (e2e-bug.191).
  if (/\b(?:salon|business|studio|spa|company|place)\b/i.test(cleaned)) {
    return true;
  }
  // e2e-bug.346 — a capture led by "this/the/your" is a noun reference, not a
  // person's name, regardless of which noun follows.
  if (/^(?:this|the|your)\b/i.test(cleaned)) {
    return true;
  }
  return false;
}

function hasNamedProviderCue(prompt: string): boolean {
  if (isSalonOrBusinessAboutPrompt(prompt)) return false;
  if (isDeterminerAboutPrompt(prompt)) return false;
  if (/\bwho\s+is\s+(?:free|available|open|working|busy|on\s+(?:duty|leave))\b/i.test(prompt)) {
    return false;
  }
  if (
    /\b(?:check|see|look\s+up|find\s+out)\b/i.test(prompt) &&
    /\bwho\b/i.test(prompt) &&
    /\b(?:free|available|open)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(?:tell me about|learn(?: more)? about|what(?:'s| is)\s+\w+(?:'s)?\s+specialty|does\s+\w+\s+do)\b/i.test(
      prompt,
    ) ||
    // e2e-bug.93 — "what does Karo specialize in?"
    /\bwhat\s+does\s+\w+\s+specialize\s+in\b/i.test(prompt) ||
    /\bwhat\s+is\s+\w+\s+speciali[sz]ed\s+in\b/i.test(prompt) ||
    /\bwho is\s+(?!best\b|good\b|the\s+best\b|the\s+expert\b|free\b|available\b|open\b|working\b|busy\b)/i.test(
      prompt,
    ) ||
    /պատմիր/iu.test(prompt) ||
    /(?:расскажи|расскажите)\s+(?:об|о)(?=\s)/iu.test(prompt)
  );
}

function hasSpecialtyMatchCue(prompt: string): boolean {
  return (
    /\b(?:who is best for|who specializes in|specialist in|expert in|good (?:with|for|at)|best for|who should i see for|which stylist knows|experienced (?:with|in)|who(?:'s| is) the expert in)\b/i.test(
      prompt,
    ) ||
    /(?:լավագույնը|մասնագիտանում|լավ է)/iu.test(prompt) ||
    /(?:кудряв|лучше всего|специализируется|к кому)/iu.test(prompt)
  );
}

function isRecommendSpecialistRankingPrompt(prompt: string): boolean {
  return (
    /\b(?:best|top)\s+(?:rated\s+)?(?:specialist|therapist|stylist|master|provider|cosmetologist)\b/i.test(
      prompt,
    ) ||
    /\bwho is the best\s+(?:specialist|therapist|stylist|master|provider)\b/i.test(
      prompt,
    ) ||
    /\b(?:recommend|suggest)\s+(?:the\s+)?(?:best|top)\b/i.test(prompt)
  );
}

function isRecommendAvailabilityPrompt(prompt: string): boolean {
  if (
    /\b(?:this week|next week|tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(
      prompt,
    ) &&
    /\b(?:best|top|rated|specialist|therapist|stylist)\b/i.test(prompt)
  ) {
    return true;
  }
  return (
    /\b(?:free|available|availability|earliest|soonest|open slots?)\b/i.test(
      prompt,
    ) && /\b(?:best|top|rated)\b/i.test(prompt)
  );
}

export function extractProviderNameFromPrompt(prompt: string): string | null {
  if (isSalonOrBusinessAboutPrompt(prompt)) return null;
  for (const pattern of NAMED_PROVIDER_PATTERNS) {
    const match = prompt.match(pattern);
    const captured = match?.[1]?.trim();
    if (!captured) continue;
    const cleaned = cleanCapturedPhrase(captured);
    if (isNonPersonProviderCapture(cleaned)) {
      continue;
    }
    return cleaned;
  }
  return null;
}

export function extractSpecialtyTopicFromPrompt(prompt: string): string | null {
  for (const pattern of SPECIALTY_TOPIC_PATTERNS) {
    const match = prompt.match(pattern);
    const captured = match?.[1]?.trim();
    if (!captured) continue;
    const cleaned = cleanCapturedPhrase(captured);
    if (cleaned) return cleaned;
  }
  return null;
}

export function inferProviderSpecialtyAspect(
  prompt: string,
): ProviderSpecialtyAspect {
  if (extractSpecialtyTopicFromPrompt(prompt)) return 'specialty_match';
  if (extractProviderNameFromPrompt(prompt)) return 'named_provider';
  return 'specialty_match';
}

export function isExplainProviderSpecialtyPrompt(prompt: string): boolean {
  if (isTeamFloorStatusPrompt(prompt)) return false;
  if (isLookupServiceAssignmentPrompt(prompt)) return false;
  if (isExplainTenantAppInstallPrompt(prompt)) return false;
  if (isExplainProfessionalProfilePrompt(prompt)) return false;
  if (isExplainAnyProviderOptionPrompt(prompt)) return false;
  if (isRecommendAvailabilityPrompt(prompt)) return false;
  if (isRecommendSpecialistRankingPrompt(prompt)) return false;
  if (
    /\b(?:check|see|look\s+up|find\s+out)\b/i.test(prompt) &&
    /\bwho\b/i.test(prompt) &&
    /\b(?:free|available|open)\b/i.test(prompt)
  ) {
    return false;
  }
  if (/\bwho\s+is\s+(?:free|available|open)\b/i.test(prompt)) return false;
  if (
    /\b(?:book|schedule|reserve)\b/i.test(prompt) &&
    /\b(?:appointment|slot|with)\b/i.test(prompt)
  ) {
    return false;
  }
  // e2e-bug.191 — "this/the/your salon|business", "salon info", slash forms.
  if (isSalonOrBusinessAboutPrompt(prompt)) return false;
  if (/\bwho works here\b/i.test(prompt)) return false;

  const named = hasNamedProviderCue(prompt);
  const specialty = hasSpecialtyMatchCue(prompt);
  return named || specialty;
}

export function enrichExplainProviderSpecialtyParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const aspect =
    (params.aspect as ProviderSpecialtyAspect | undefined) ??
    inferProviderSpecialtyAspect(prompt);
  const providerName =
    (params.providerName as string | undefined) ??
    extractProviderNameFromPrompt(prompt) ??
    undefined;
  const specialtyTopic =
    (params.specialtyTopic as string | undefined) ??
    extractSpecialtyTopicFromPrompt(prompt) ??
    undefined;
  return {
    ...params,
    aspect,
    ...(providerName ? { providerName } : {}),
    ...(specialtyTopic ? { specialtyTopic } : {}),
  };
}

export function rescueExplainProviderSpecialtyIntent(
  prompt: string,
  action: string,
): {
  action: 'explain_provider_specialty';
  rescueReason: string;
} | null {
  if (action === 'explain_provider_specialty') return null;
  if (!isExplainProviderSpecialtyPrompt(prompt)) return null;
  return {
    action: 'explain_provider_specialty',
    rescueReason: 'provider_specialty',
  };
}

export function detectExplainProviderSpecialtyAction(
  prompt: string,
): 'explain_provider_specialty' | null {
  return (
    rescueExplainProviderSpecialtyIntent(prompt, 'unknown')?.action ?? null
  );
}

export function readEmployeeProfileCopy(
  metadata: Record<string, unknown> | undefined,
): {
  role: string | null;
  specialty: string | null;
  bio: string | null;
} {
  const meta = metadata ?? {};
  const role =
    typeof meta.role === 'string'
      ? meta.role.trim()
      : typeof meta.title === 'string'
        ? meta.title.trim()
        : null;

  let specialty: string | null = null;
  if (typeof meta.specialty === 'string' && meta.specialty.trim()) {
    specialty = meta.specialty.trim();
  } else if (typeof meta.specialties === 'string' && meta.specialties.trim()) {
    specialty = meta.specialties.trim();
  } else if (Array.isArray(meta.skills)) {
    specialty = meta.skills
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .join(', ');
  } else if (typeof meta.skills === 'string' && meta.skills.trim()) {
    specialty = meta.skills.trim();
  }

  const bio =
    typeof meta.bio === 'string'
      ? meta.bio.trim()
      : typeof meta.about === 'string'
        ? meta.about.trim()
        : typeof meta.description === 'string'
          ? meta.description.trim()
          : null;

  return { role, specialty, bio };
}

export function resolveEmployeeByName<T extends { name: string }>(
  employees: readonly T[],
  providerName: string,
): T | undefined {
  const needle = providerName.trim().toLowerCase();
  if (!needle) return undefined;
  return (
    employees.find((entry) => entry.name.toLowerCase() === needle) ??
    employees.find((entry) => entry.name.toLowerCase().startsWith(needle)) ??
    employees.find((entry) =>
      needle
        .split(/\s+/)
        .every((part) => part && entry.name.toLowerCase().includes(part)),
    )
  );
}

export function scoreEmployeeForSpecialtyTopic(input: {
  employeeName: string;
  metadata?: Record<string, unknown>;
  serviceNames: readonly string[];
  topic: string;
}): number {
  const topicLower = input.topic.trim().toLowerCase();
  if (!topicLower) return 0;

  const profile = readEmployeeProfileCopy(input.metadata);
  const textFields = [
    profile.specialty,
    profile.bio,
    profile.role,
    input.employeeName,
    ...input.serviceNames,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let score = 0;
  if (textFields.includes(topicLower)) score += 100;

  for (const token of topicLower
    .split(/\s+/)
    .filter((part) => part.length > 2)) {
    if (textFields.includes(token)) score += 20;
  }

  for (const serviceName of input.serviceNames) {
    const lower = serviceName.toLowerCase();
    if (lower.includes(topicLower)) score += 30;
  }

  return score;
}

export function formatProviderRatingLabel(
  averageRating: number | null | undefined,
  reviewCount: number | null | undefined,
): string | null {
  if (averageRating == null) return null;
  const count = reviewCount ?? 0;
  return count > 0
    ? `${averageRating.toFixed(1)}★ (${count} review${count === 1 ? '' : 's'})`
    : `${averageRating.toFixed(1)}★`;
}
