import { isCustomerBookingContextPrompt } from './ai-dashboard-ops.util.js';
import { buildSharedBookingContextFromPrompt } from './ai-compound-booking-context.util.js';
import { isFindSoonestAppointmentPrompt } from './ai-find-soonest-appointment.util.js';
import { EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_SCENARIOS } from './ai-explain-provider-availability-multilingual.fixtures.js';
import {
  EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS,
  type ExplainProviderAvailabilityPromptFixture,
  type ProviderAvailabilityAspect,
} from './ai-explain-provider-availability.fixtures.js';

export { EXPLAIN_PROVIDER_AVAILABILITY_CLASSIFIER_RULES } from './ai-explain-provider-availability.fixtures.js';
export { EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-provider-availability-multilingual.fixtures.js';

export const EXPLAIN_PROVIDER_AVAILABILITY_INTENTS = [
  'explain_provider_availability',
] as const;

export type ExplainProviderAvailabilityIntent =
  (typeof EXPLAIN_PROVIDER_AVAILABILITY_INTENTS)[number];

const BOOK_VERB = /\b(book|schedule|reserve|grab)\b/i;

const SOONEST_BLOCK =
  /\b(soonest|earliest|nearest|first\s+available|asap|as\s+soon\s+as\s+possible)\b/i;

const RANK_BLOCK =
  /\b(?:best|top\s+rated|highest\s+rated|recommend)\s+(?:stylist|specialist|provider|therapist)\b|\bwho\s+is\s+the\s+best\b/i;

const DAY_CUE = new RegExp(
  String.raw`\b(?:tomorrow|tonight|today|this\s+week|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?|\d{4}-\d{2}-\d{2}|\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]\d{2,4})?)\b`,
  'iu',
);

/** Verbs/filler that must never be captured as a specialist name. */
const PROVIDER_NAME_BLOCKLIST = new Set([
  'check',
  'see',
  'show',
  'find',
  'look',
  'get',
  'open',
  'free',
  'any',
  'the',
  'our',
  'your',
  'their',
  'available',
  'availability',
  // e2e-bug.334 — indefinite pronouns are never a real provider name
  // ("is anyone free…" must not be looked up as employee "anyone").
  'anyone',
  'anybody',
  'someone',
  'somebody',
  'everyone',
  'everybody',
]);

/** First + optional last name — e2e-bug.93 full-name roster asks. */
const PROVIDER_NAME_CAPTURE = String.raw`([A-Za-z][\w.'-]{1,40}(?:\s+[A-Za-z][\w.'-]{1,40})?)`;

const NAMED_SCHEDULE_PATTERNS: ReadonlyArray<RegExp> = [
  // e2e-bug.93 — "When is Mariam available this week?" / "When is Jujo Karapetyan available?"
  new RegExp(
    String.raw`\bwhen\s+(?:is|are)\s+${PROVIDER_NAME_CAPTURE}\s+(?:available|free)\b`,
    'i',
  ),
  // e2e-bug.93 — "Is Karo Mazmanyan free tomorrow…" / "Is Mariam Ohanyan available…"
  new RegExp(
    String.raw`\b(?:is|are)\s+${PROVIDER_NAME_CAPTURE}\s+(?:available|free)\b`,
    'i',
  ),
  // Possessive only — not bare "check availability" (e2e-bug.92).
  new RegExp(
    String.raw`\b${PROVIDER_NAME_CAPTURE}(?:'s|’s)\s+availability\b`,
    'i',
  ),
  // "… with Gevorg tomorrow" / "availability for Swedish with Gevorg"
  /\bwith\s+([A-Z][A-Za-z.'-]{1,40}(?:\s+[A-Z][A-Za-z.'-]{1,40})?)\b/,
  new RegExp(
    String.raw`\b(?:is|are)\s+${PROVIDER_NAME_CAPTURE}\s+(?:working|in|on\s+duty|scheduled)\b`,
    'i',
  ),
  new RegExp(
    String.raw`\b(?:does|do)\s+${PROVIDER_NAME_CAPTURE}\s+work\b`,
    'i',
  ),
  /(?:արդյո՞ք|արդյոք)\s+([A-Za-z][\w.'-]{1,30})-?ն?\s+աշխատում/i,
  /([A-Za-z][\w.'-]{1,30})-?ն?\s+աշխատու՞մ/i,
  /работает\s+ли\s+([A-Za-z][\w.'-]{1,30})/iu,
];

const TEAM_OPENINGS_PATTERNS: ReadonlyArray<RegExp> = [
  /\bwho\s+has\s+openings?\b/i,
  /\b(?:who|which)\s+(?:stylist|specialist|provider|therapist|staff|master)s?\s+(?:has|have|is|are)\s+(?:openings?|available|working|free)\b/i,
  /\bwho\s+is\s+working\b/i,
  /\bwhich\s+providers?\s+have\s+openings?\b/i,
  /ով\s+ունի\s+ազատ/i,
  /у\s+кого\s+есть\s+окн/i,
  /кто\s+работает/i,
];

const PICK_PROVIDER_BLOCK = new RegExp(
  String.raw`\b(?:book|schedule|reserve)\s+with\s+.+?\s+for\b|\b(?:pick|choose|select)\s+[A-Za-z].+?\s+for\b|\b(?:same|usual)\s+(?:stylist|specialist|provider)\b`,
  'iu',
);

const SPECIALTY_READ_BLOCK = new RegExp(
  String.raw`\b(?:tell\s+me\s+about|who\s+specializes?|specialty)\b`,
  'iu',
);

const PLAIN_AVAILABILITY_BLOCK = new RegExp(
  String.raw`\b(?:free\s+slots?|check\s+availability|availability\s+for)\b`,
  'iu',
);

function cleanCapturedPhrase(value: string): string {
  return value
    .replace(/[?.!,]+$/g, '')
    .replace(/-ն$/u, '')
    .replace(/-ի$/u, '')
    .trim();
}

function matchExplainProviderAvailabilityScenario(
  prompt: string,
): ExplainProviderAvailabilityPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

/**
 * Does this capture look like a person's name? — e2e-bug.433.
 *
 * `PROVIDER_NAME_BLOCKLIST` is an exact-match set of single words, so anything
 * the patterns captured that was longer than one word, or was an acronym, was
 * accepted as a provider. Measured against the eval corpus, this detector was
 * the single largest source of remaining failures — **17 steals**, on the
 * strength of "names" like:
 *
 *     "dates displayed"   ← How are dates displayed in the dashboard?
 *     "amounts shown"     ← Why are amounts shown in dram?
 *     "VAT included"      ← Is VAT included in the amount we collected?
 *     "GST"               ← Why did Stripe charge $113 with GST and PST lines?
 *     "titled"            ← Show what Spa Day package is titled in Armenian
 *     "the expert"        ← Who is the expert in men's fades?
 *
 * `isExplainProviderAvailabilityPrompt` returns true as soon as a name is
 * extracted, so a false name bypasses every guard beneath it — including the
 * specialty, ranking and soonest-slot blocks written to keep this detector in
 * its lane.
 *
 * Three rules, in order of how much they carry:
 *
 * 1. **no blocklisted token anywhere**, not just as the whole capture — "the
 *    expert" contains "the";
 * 2. **at most three tokens** — people's names are short, explanations are not;
 * 3. **one token must read as a proper noun**: initial capital, not ALL-CAPS.
 *    That admits "Maria" and "Anna Smith" and rejects "GST" and "VAT included".
 *
 * Rule 3 has an exception for a prompt typed entirely in lower case, where
 * capitalisation carries no signal at all — "when is maria free?" is a real
 * thing to type. There a single token is allowed through, which is as much as
 * can be inferred without a catalogue to check against.
 */
function looksLikeProviderName(capture: string, prompt: string): boolean {
  const tokens = capture.split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens.length > 3) return false;
  if (tokens.some((t) => PROVIDER_NAME_BLOCKLIST.has(t.toLowerCase()))) {
    return false;
  }
  // Initial capital, and not a run of capitals (an acronym, not a name).
  const properNoun = /^[\p{Lu}][^\s\p{Lu}]*$/u;
  if (tokens.some((t) => properNoun.test(t))) return true;
  const promptIsAllLowerCase = prompt === prompt.toLowerCase();
  return promptIsAllLowerCase && tokens.length === 1;
}

export function extractProviderNameForAvailabilityPrompt(
  prompt: string,
): string | null {
  for (const pattern of NAMED_SCHEDULE_PATTERNS) {
    const match = prompt.match(pattern);
    const captured = match?.[1]?.trim();
    if (!captured) continue;
    const cleaned = cleanCapturedPhrase(captured);
    if (cleaned.length < 2) continue;
    if (PROVIDER_NAME_BLOCKLIST.has(cleaned.toLowerCase())) continue;
    // e2e-bug.433 — and it has to look like a name.
    if (!looksLikeProviderName(cleaned, prompt)) continue;
    return cleaned;
  }
  return null;
}

export function inferProviderAvailabilityAspect(
  prompt: string,
): ProviderAvailabilityAspect {
  if (TEAM_OPENINGS_PATTERNS.some((pattern) => pattern.test(prompt))) {
    return 'team_openings';
  }
  if (extractProviderNameForAvailabilityPrompt(prompt)) {
    return 'named_schedule';
  }
  return 'team_openings';
}

export function hasProviderAvailabilityDayCue(prompt: string): boolean {
  return DAY_CUE.test(prompt);
}

export function isExplainProviderAvailabilityIntent(
  action: string,
): action is ExplainProviderAvailabilityIntent {
  return (EXPLAIN_PROVIDER_AVAILABILITY_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isExplainProviderAvailabilityPrompt(prompt: string): boolean {
  if (matchExplainProviderAvailabilityScenario(prompt)) return true;
  if (BOOK_VERB.test(prompt)) return false;
  if (isFindSoonestAppointmentPrompt(prompt)) return false;
  if (SOONEST_BLOCK.test(prompt)) return false;
  if (PICK_PROVIDER_BLOCK.test(prompt)) return false;
  if (RANK_BLOCK.test(prompt)) return false;
  if (SPECIALTY_READ_BLOCK.test(prompt)) return false;

  // e2e-bug.334 — must respect PROVIDER_NAME_BLOCKLIST (raw pattern.test()
  // ignored it, so "is anyone free…" matched syntactically even though the
  // captured "anyone" was never a real provider name).
  const namedSchedule =
    extractProviderNameForAvailabilityPrompt(prompt) !== null;
  const teamOpenings = TEAM_OPENINGS_PATTERNS.some((pattern) =>
    pattern.test(prompt),
  );

  // e2e-bug.194 — "Explain Gevorg availability for Swedish massage next Tuesday"
  // contains plain "availability for" but is clearly a named-schedule ask.
  if (PLAIN_AVAILABILITY_BLOCK.test(prompt) && !namedSchedule) return false;

  if (!namedSchedule && !teamOpenings) return false;
  // e2e-bug.93 — named "When is Jujo available?" keeps the specialist even
  // without a day cue (clarify day with name, don't drop to service ask).
  if (
    !hasProviderAvailabilityDayCue(prompt) &&
    !teamOpenings &&
    !namedSchedule
  ) {
    return false;
  }

  if (
    namedSchedule &&
    /\b(?:tell\s+me\s+about|specialty|specializes?)\b/i.test(prompt)
  ) {
    return false;
  }

  return true;
}

export function parseExplainProviderAvailabilityFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): {
  aspect: ProviderAvailabilityAspect;
  employeeName?: string;
} | null {
  if (!isExplainProviderAvailabilityPrompt(prompt)) return null;

  const scenario = matchExplainProviderAvailabilityScenario(prompt);
  const aspectFromParams =
    params.aspect === 'named_schedule' || params.aspect === 'team_openings'
      ? params.aspect
      : undefined;
  const aspect =
    aspectFromParams ??
    scenario?.aspect ??
    inferProviderAvailabilityAspect(prompt);

  if (aspect === 'team_openings') {
    return { aspect };
  }

  const employeeName =
    (params.employeeName as string | undefined) ??
    scenario?.employeeName ??
    extractProviderNameForAvailabilityPrompt(prompt);

  return {
    aspect,
    ...(employeeName ? { employeeName } : {}),
  };
}

export function enrichExplainProviderAvailabilityParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
): Record<string, unknown> {
  const parsed = parseExplainProviderAvailabilityFromPrompt(prompt, params);
  const shared = buildSharedBookingContextFromPrompt(prompt, timeZone);

  if (!parsed) {
    // e2e-bug.93 — check_availability kept by e2e-bug.190 still needs the name.
    const employeeName =
      (typeof params.employeeName === 'string' && params.employeeName.trim()
        ? params.employeeName.trim()
        : null) ?? extractProviderNameForAvailabilityPrompt(prompt);
    if (!employeeName) return { ...params, ...shared };
    const next: Record<string, unknown> = {
      ...params,
      ...shared,
      employeeName,
      allProviders: false,
    };
    // Named availability asks must not keep a bogus leading-clause serviceName.
    if (
      typeof next.serviceName === 'string' &&
      /\b(?:is|are|when|available|free)\b/i.test(next.serviceName)
    ) {
      delete next.serviceName;
    }
    return next;
  }

  if (parsed.aspect === 'team_openings') {
    return {
      ...params,
      ...shared,
      aspect: parsed.aspect,
      allProviders: true,
      employeeName: null,
    };
  }

  const next: Record<string, unknown> = {
    ...params,
    ...shared,
    aspect: parsed.aspect,
    allProviders: false,
    ...(parsed.employeeName ? { employeeName: parsed.employeeName } : {}),
  };
  if (
    typeof next.serviceName === 'string' &&
    /\b(?:is|are|when|available|free)\b/i.test(next.serviceName)
  ) {
    delete next.serviceName;
  }
  return next;
}

export function rescueExplainProviderAvailabilityIntent(
  prompt: string,
  action: string,
): { action: ExplainProviderAvailabilityIntent; rescueReason: string } | null {
  if (isExplainProviderAvailabilityIntent(action)) return null;
  // e2e-bug.190 — keep classified check_availability for open-times / service-slot browse.
  // e2e-bug.93 — employeeName still enriches via
  // enrichExplainProviderAvailabilityParamsFromPrompt even when we stay here.
  if (
    action === 'check_availability' &&
    (/\bcheck\s+availability\b/i.test(prompt) ||
      /\btimes?\s+(?:are\s+)?available\b/i.test(prompt) ||
      /\bavailable\s+(?:times?|slots?)\b/i.test(prompt) ||
      /\bavailable\s+for\s+[\s\S]{0,48}\b(?:massage|haircut|facial|swedish|color|lash|manicure|service)\b/i.test(
        prompt,
      ))
  ) {
    return null;
  }
  // e2e-bug.358 — not when the prompt is asking who a customer is.
  //
  // "Summarize customer Maria Lopez who has a booking with Gevorg today at
  // 10:00" names a provider and a time, which is all this rescue needs, so it
  // claimed prompts whose subject is the customer. `lookup_customer` failed all
  // six of its eval cases; two of them to this.
  //
  // The exclusion lives here rather than at the call sites because there are
  // five of them, and guarding one leaves the other four. Guarding the *branch*
  // was tried first and fixed only the two cases reachable from that chain.
  //
  // `isCustomerBookingContextPrompt` requires a customer-profile verb
  // (summarize / profile / tell me about / look up / who is) together with
  // booking phrasing, so a plain availability question is unaffected.
  if (isCustomerBookingContextPrompt(prompt)) return null;
  if (!parseExplainProviderAvailabilityFromPrompt(prompt)) return null;
  return {
    action: 'explain_provider_availability',
    rescueReason: 'explain_provider_availability',
  };
}

export function detectExplainProviderAvailabilityAction(
  prompt: string,
): ExplainProviderAvailabilityIntent | null {
  return (
    rescueExplainProviderAvailabilityIntent(prompt, 'unknown')?.action ?? null
  );
}
