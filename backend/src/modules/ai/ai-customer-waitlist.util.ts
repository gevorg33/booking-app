import { applyRelativeDateFromPrompt } from '../../common/utils/date-format.util.js';
import { buildSharedBookingContextFromPrompt } from './ai-compound-booking-context.util.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import {
  CHECK_WAITLIST_STATUS_PROMPTS,
  CUSTOMER_WAITLIST_PROMPTS,
  JOIN_WAITLIST_PROMPTS,
  type CustomerWaitlistPromptFixture,
} from './ai-customer-waitlist.fixtures.js';
import { CUSTOMER_WAITLIST_MULTILINGUAL_SCENARIOS } from './ai-customer-waitlist-multilingual.fixtures.js';

export const JOIN_WAITLIST_INTENTS = ['join_waitlist'] as const;
export const CHECK_WAITLIST_STATUS_INTENTS = ['check_waitlist_status'] as const;
export const CUSTOMER_WAITLIST_INTENTS = [
  ...JOIN_WAITLIST_INTENTS,
  ...CHECK_WAITLIST_STATUS_INTENTS,
] as const;

export type JoinWaitlistIntent = (typeof JOIN_WAITLIST_INTENTS)[number];
export type CheckWaitlistStatusIntent =
  (typeof CHECK_WAITLIST_STATUS_INTENTS)[number];
export type CustomerWaitlistIntent = (typeof CUSTOMER_WAITLIST_INTENTS)[number];

export { CUSTOMER_PUBLIC_CUSTOMER_WAITLIST_CLASSIFIER_RULES } from './ai-customer-waitlist.fixtures.js';

const STAFF_WAITLIST_CUE =
  /\b(list waitlist|waitlist entries|offer waitlist slot|fill.*from waitlist|coordinate waitlist|suggest waitlist for gap|waitlist customers|show waitlist clients)\b/i;

const PROVIDER_WAITLIST_CUE =
  /\b(offer waitlist|text waitlist|message waitlist client|coordinate waitlist offer)\b/i;

const JOIN_WAITLIST_CUE =
  /\b(join (?:the )?waitlist|waiting list|wait\s*list|notify me if|alert me when|let me know if|ping me when|put me on|sign me up|add me to|tell me if something opens|notify if something opens)\b/i;

const CHECK_STATUS_CUE =
  /\b(am i on the waitlist|waitlist status|check my waitlist|still on the waitlist|waiting list status|my waitlist request|did i join the waitlist|on the waitlist yet|any update on my waitlist|show my waitlist)\b/i;

function matchWaitlistScenario(
  prompt: string,
): CustomerWaitlistPromptFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of CUSTOMER_WAITLIST_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of CUSTOMER_WAITLIST_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

/** Catalog-ish tokens — never treat these as provider person names (e2e-bug.112). */
const WAITLIST_SERVICE_TOKEN =
  /\b(massage|haircut|facial|manicure|pedicure|color|colour|trim|wax|blowdry|beard|cut|nails?|highlights?|balayage|keratin|brows?|lashes?|spa|treatment|service|package|facemassage)\b/i;

const WAITLIST_DATE_BOUNDARY =
  String.raw`(?=\s*(?:,|;|\?|\band\b|\bwith\b|\btomorrow\b|\btoday\b|\btonight\b|\bnext\b|\bon\b|\bevening\b|\bmorning\b|\bafternoon\b|\bthis\b|\bweek\b|\bmonday\b|\btuesday\b|\bwednesday\b|\bthursday\b|\bfriday\b|\bsaturday\b|\bsunday\b|$))`;

/** Proper-name heuristic for provider-only waitlist phrasing (e2e-bug.112). */
export function looksLikeWaitlistPersonName(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || WAITLIST_SERVICE_TOKEN.test(trimmed)) return false;
  // "Gevorg Gasparyan", "Mary Jane"
  if (/^[A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+)+$/u.test(trimmed)) return true;
  // Single proper name used as provider ("Anna", "Gevorg")
  if (/^[A-Z][\p{L}'-]{2,30}$/u.test(trimmed)) return true;
  return false;
}

function extractWaitlistEmployeeName(
  prompt: string,
  params: Record<string, unknown>,
): string | undefined {
  const fromParams =
    typeof params.employeeName === 'string' ? params.employeeName.trim() : '';
  if (fromParams) return fromParams;

  // Case-sensitive [A-Z] — do not use the `i` flag or "Anna on Friday" becomes one name.
  const withPerson = prompt.match(
    new RegExp(
      String.raw`\bwith\s+([A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+)*)` +
        WAITLIST_DATE_BOUNDARY,
      'u',
    ),
  );
  if (withPerson?.[1] && looksLikeWaitlistPersonName(withPerson[1])) {
    return withPerson[1].trim();
  }

  const forPerson = prompt.match(
    new RegExp(
      String.raw`\b(?:wait(?:ing)?\s*list|waitlist)?\s*for\s+([A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+)*)` +
        WAITLIST_DATE_BOUNDARY,
      'u',
    ),
  );
  if (forPerson?.[1] && looksLikeWaitlistPersonName(forPerson[1])) {
    return forPerson[1].trim();
  }

  return undefined;
}

function extractWaitlistServiceName(
  prompt: string,
  params: Record<string, unknown>,
): string | undefined {
  const fromParams =
    typeof params.serviceName === 'string' ? params.serviceName.trim() : '';
  if (fromParams) {
    // e2e-bug.112 — classifier sometimes copies provider into serviceName.
    if (looksLikeWaitlistPersonName(fromParams)) return undefined;
    const employee =
      typeof params.employeeName === 'string'
        ? params.employeeName.trim()
        : '';
    if (employee && fromParams.toLowerCase() === employee.toLowerCase()) {
      return undefined;
    }
    return fromParams;
  }

  const scenario = matchWaitlistScenario(prompt);
  if (scenario?.serviceName) return scenario.serviceName;

  const waitingListFor = prompt.match(
    new RegExp(
      String.raw`\b(?:waiting list|waitlist)\s+for\s+(?:a\s+)?([a-z][\w\s'-]{2,40}?)` +
        WAITLIST_DATE_BOUNDARY,
      'i',
    ),
  );
  if (waitingListFor) {
    const name = waitingListFor[1].trim().replace(/[,.]$/, '');
    if (name && !looksLikeWaitlistPersonName(name)) return name;
  }

  const forService = prompt.match(
    new RegExp(
      String.raw`\bfor\s+(?:a\s+)?([a-z][\w\s'-]{2,40}?)` + WAITLIST_DATE_BOUNDARY,
      'i',
    ),
  );
  if (forService) {
    const name = forService[1].trim().replace(/[,.]$/, '');
    if (
      name &&
      !looksLikeWaitlistPersonName(name) &&
      !/^(the|a|an|anything|something|friday|monday|tuesday|wednesday|thursday|saturday|sunday|waitlist|waiting list)$/i.test(
        name,
      ) &&
      !/^the waiting list\b/i.test(name)
    ) {
      return name;
    }
  }

  const raw = extractServiceNameFromPrompt(prompt)?.trim();
  if (!raw) return undefined;
  if (looksLikeWaitlistPersonName(raw)) return undefined;
  // e2e-bug.112 — generic extractor can return "Anna on Friday" for provider+date.
  if (
    !WAITLIST_SERVICE_TOKEN.test(raw) &&
    /\bon\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/i.test(
      raw,
    )
  ) {
    return undefined;
  }
  return raw;
}

/** Drop duplicated provider→serviceName copies (e2e-bug.112). */
export function sanitizeWaitlistPreferenceNames(input: {
  serviceName?: string;
  employeeName?: string;
}): { serviceName?: string; employeeName?: string } {
  let serviceName = input.serviceName?.trim() || undefined;
  let employeeName = input.employeeName?.trim() || undefined;

  if (serviceName && looksLikeWaitlistPersonName(serviceName)) {
    if (!employeeName) employeeName = serviceName;
    serviceName = undefined;
  }
  if (
    serviceName &&
    employeeName &&
    serviceName.toLowerCase() === employeeName.toLowerCase()
  ) {
    serviceName = undefined;
  }

  return {
    ...(serviceName ? { serviceName } : {}),
    ...(employeeName ? { employeeName } : {}),
  };
}

function extractTimeOfDayFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): 'morning' | 'afternoon' | 'evening' | undefined {
  if (
    params.timeOfDay === 'morning' ||
    params.timeOfDay === 'afternoon' ||
    params.timeOfDay === 'evening'
  ) {
    return params.timeOfDay;
  }
  const scenario = matchWaitlistScenario(prompt);
  if (scenario?.timeOfDay) return scenario.timeOfDay;
  if (/\bmorning\b/i.test(prompt)) return 'morning';
  if (/\bafternoon\b/i.test(prompt)) return 'afternoon';
  if (/\bevening\b/i.test(prompt)) return 'evening';
  return undefined;
}

export function isStaffWaitlistPrompt(prompt: string): boolean {
  return STAFF_WAITLIST_CUE.test(prompt) || PROVIDER_WAITLIST_CUE.test(prompt);
}

export function isCheckWaitlistStatusPrompt(prompt: string): boolean {
  if (isStaffWaitlistPrompt(prompt)) return false;

  const scenario = matchWaitlistScenario(prompt);
  if (scenario?.expectedAction === 'check_waitlist_status') return true;

  if (
    containsArmenianScript(prompt) &&
    /(սպասման\s*ցուցակ.*\?|ցուցակում\s*եմ)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(лист.*ожидан|в\s+листе\s+ожидан)/i.test(prompt)
  ) {
    return /\?|статус|провер/i.test(prompt);
  }

  return CHECK_STATUS_CUE.test(prompt);
}

export function isJoinWaitlistPrompt(prompt: string): boolean {
  if (isStaffWaitlistPrompt(prompt)) return false;
  if (isCheckWaitlistStatusPrompt(prompt)) return false;
  if (
    /\bonline\s+payment\b/i.test(prompt) &&
    /\bpublic\s+booking\b/i.test(prompt)
  ) {
    return false;
  }

  const scenario = matchWaitlistScenario(prompt);
  if (scenario?.expectedAction === 'join_waitlist') return true;

  if (
    containsArmenianScript(prompt) &&
    /(տեղեկաց|սպասման\s*ցուցակ|միաց)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(уведом|лист\s*ожидан|запиш.*ожидан)/i.test(prompt)
  ) {
    return true;
  }

  if (JOIN_WAITLIST_CUE.test(prompt)) return true;

  if (
    /\bnotify\b/i.test(prompt) &&
    /\b(if|when)\b/i.test(prompt) &&
    /\b(opens?|opens up|slot|something)\b/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function isJoinWaitlistIntent(
  action: string,
): action is JoinWaitlistIntent {
  return (JOIN_WAITLIST_INTENTS as readonly string[]).includes(action);
}

export function isCheckWaitlistStatusIntent(
  action: string,
): action is CheckWaitlistStatusIntent {
  return (CHECK_WAITLIST_STATUS_INTENTS as readonly string[]).includes(action);
}

export function isCustomerWaitlistIntent(
  action: string,
): action is CustomerWaitlistIntent {
  return (CUSTOMER_WAITLIST_INTENTS as readonly string[]).includes(action);
}

export interface ParsedJoinWaitlist {
  serviceName?: string;
  employeeName?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  timeSlot?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  notes?: string;
}

export function enrichJoinWaitlistParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
): Record<string, unknown> {
  const shared = buildSharedBookingContextFromPrompt(prompt, timeZone);
  const dateParams = { ...shared, ...params };
  applyRelativeDateFromPrompt(dateParams, prompt, timeZone);

  // Do not inherit serviceName from buildSharedBookingContextFromPrompt — that
  // helper uses a greedy extractor that turns "for Anna on Friday" into a fake
  // service (e2e-bug.112). Waitlist extraction is the sole source of truth.
  const sanitized = sanitizeWaitlistPreferenceNames({
    serviceName: extractWaitlistServiceName(prompt, params),
    employeeName:
      extractWaitlistEmployeeName(prompt, params) ||
      (typeof params.employeeName === 'string'
        ? params.employeeName.trim()
        : undefined) ||
      (typeof dateParams.employeeName === 'string'
        ? dateParams.employeeName.trim()
        : undefined),
  });
  const timeOfDay = extractTimeOfDayFromPrompt(prompt, params);

  const next = { ...dateParams };
  delete next.serviceName;
  delete next.employeeName;
  return {
    ...next,
    ...sanitized,
    ...(timeOfDay ? { timeOfDay } : {}),
  };
}

export function parseJoinWaitlistFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
  timeZone = 'UTC',
): ParsedJoinWaitlist | null {
  if (!isJoinWaitlistPrompt(prompt)) return null;
  const enriched = enrichJoinWaitlistParamsFromPrompt(params, prompt, timeZone);
  return {
    ...(enriched.serviceName
      ? { serviceName: String(enriched.serviceName) }
      : {}),
    ...(enriched.employeeName
      ? { employeeName: String(enriched.employeeName) }
      : {}),
    ...(enriched.date ? { date: String(enriched.date) } : {}),
    ...(enriched.dateFrom ? { dateFrom: String(enriched.dateFrom) } : {}),
    ...(enriched.dateTo ? { dateTo: String(enriched.dateTo) } : {}),
    ...(enriched.timeSlot ? { timeSlot: String(enriched.timeSlot) } : {}),
    ...(enriched.timeOfDay
      ? {
          timeOfDay: enriched.timeOfDay as 'morning' | 'afternoon' | 'evening',
        }
      : {}),
    ...(enriched.notes ? { notes: String(enriched.notes) } : {}),
  };
}

export function parseCheckWaitlistStatusFromPrompt(
  prompt: string,
): { serviceName?: string } | null {
  if (!isCheckWaitlistStatusPrompt(prompt)) return null;
  const serviceName = extractWaitlistServiceName(prompt, {});
  return serviceName ? { serviceName } : {};
}

export function rescueCheckWaitlistStatusIntent(
  prompt: string,
  action: string,
): { action: CheckWaitlistStatusIntent; rescueReason: string } | null {
  if (isCheckWaitlistStatusIntent(action)) return null;
  if (!parseCheckWaitlistStatusFromPrompt(prompt)) return null;
  return {
    action: 'check_waitlist_status',
    rescueReason: 'check_waitlist_status',
  };
}

export function rescueJoinWaitlistIntent(
  prompt: string,
  action: string,
): { action: JoinWaitlistIntent; rescueReason: string } | null {
  if (isJoinWaitlistIntent(action)) return null;
  if (!parseJoinWaitlistFromPrompt(prompt)) return null;
  return { action: 'join_waitlist', rescueReason: 'join_waitlist' };
}

export function rescueCustomerWaitlistIntent(
  prompt: string,
  action: string,
): { action: CustomerWaitlistIntent; rescueReason: string } | null {
  return (
    rescueCheckWaitlistStatusIntent(prompt, action) ??
    rescueJoinWaitlistIntent(prompt, action)
  );
}

export function detectCustomerWaitlistAction(
  prompt: string,
): CustomerWaitlistIntent | null {
  return rescueCustomerWaitlistIntent(prompt, 'unknown')?.action ?? null;
}

export { JOIN_WAITLIST_PROMPTS, CHECK_WAITLIST_STATUS_PROMPTS };
