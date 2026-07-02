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

function extractWaitlistServiceName(
  prompt: string,
  params: Record<string, unknown>,
): string | undefined {
  const fromParams =
    typeof params.serviceName === 'string' ? params.serviceName.trim() : '';
  if (fromParams) return fromParams;

  const scenario = matchWaitlistScenario(prompt);
  if (scenario?.serviceName) return scenario.serviceName;

  const waitingListFor = prompt.match(
    /\b(?:waiting list|waitlist)\s+for\s+(?:a\s+)?([a-z][\w\s'-]{2,40}?)(?=\s*(?:,|;|\?|\btomorrow\b|\bthis\b|\bweek\b|\bevening\b|\bmorning\b|\bafternoon\b|$))/i,
  );
  if (waitingListFor) {
    return waitingListFor[1].trim().replace(/[,.]$/, '');
  }

  const forService = prompt.match(
    /\bfor\s+(?:a\s+)?([a-z][\w\s'-]{2,40}?)(?=\s*(?:,|;|\?|\band\b|\btomorrow\b|\btonight\b|\bevening\b|\bmorning\b|\bafternoon\b|\bthis\b|\bweek\b|$))/i,
  );
  if (forService) {
    const name = forService[1].trim().replace(/[,.]$/, '');
    if (
      name &&
      !/^(the|a|an|anything|something|friday|monday|tuesday|wednesday|thursday|saturday|sunday|waitlist|waiting list)$/i.test(
        name,
      ) &&
      !/^the waiting list\b/i.test(name)
    ) {
      return name;
    }
  }

  const raw = extractServiceNameFromPrompt(prompt)?.trim();
  return raw || undefined;
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

  const serviceName =
    extractWaitlistServiceName(prompt, params) ||
    (typeof dateParams.serviceName === 'string'
      ? dateParams.serviceName.trim()
      : undefined);
  const timeOfDay = extractTimeOfDayFromPrompt(prompt, params);

  return {
    ...dateParams,
    ...(serviceName ? { serviceName } : {}),
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
