/** Dashboard waitlist panel intents (ai-cmd-ext-2.11–2.12). */

import { extractTimeSlotFromPrompt } from './ai-intent-heuristics.js';
import { extractEmployeeNameFromPrompt } from './ai-staff-operations.util.js';
import { WAITLIST_DASHBOARD_MULTILINGUAL_SCENARIOS } from './ai-waitlist-dashboard-multilingual.fixtures.js';

export const WAITLIST_DASHBOARD_READ_INTENTS = [
  'list_waitlist_entries',
] as const;

export const WAITLIST_DASHBOARD_MUTATE_INTENTS = [
  'offer_waitlist_slot',
] as const;

export const WAITLIST_DASHBOARD_INTENTS = [
  ...WAITLIST_DASHBOARD_READ_INTENTS,
  ...WAITLIST_DASHBOARD_MUTATE_INTENTS,
] as const;

export type WaitlistDashboardIntent =
  (typeof WAITLIST_DASHBOARD_INTENTS)[number];

export const WAITLIST_DASHBOARD_CLASSIFIER_RULES = `- list_waitlist_entries: READ — list CRM customers tagged "waitlist" with contact details. Use for "show waitlist entries", "who is on the waitlist", "list waitlist customers". More detailed than summarize_waitlist. NOT fill_slot_from_waitlist (books a specific slot).
- offer_waitlist_slot: MUTATE — propose a freed/cancelled slot to waitlisted customers. Requires employeeName, date, timeSlot; optional serviceName. Use for "offer Friday 2pm gap to waitlist", "notify waitlist about Maria's cancelled slot". NOT summarize_waitlist (read-only count).`;

export const WAITLIST_DASHBOARD_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian dashboard waitlist (ai-cmd-ext-2.11–2.12):
  - list_waitlist_entries: hy «ցույց տուր waitlist entries», «ով է waitlist-ում»; ru «покажи waitlist entries», «кто в waitlist». More detailed than summarize_waitlist.
  - offer_waitlist_slot: MUTATE — hy «առաջարկիր Friday 2pm gap waitlist-ին», «տեղեկացրու waitlist Maria-ի cancelled slot-ի մասին»; ru «предложи Friday 2pm gap waitlist», «уведоми waitlist об отмене Maria». Requires employeeName, date, timeSlot. NOT fill_slot_from_waitlist.`;

export function isWaitlistDashboardIntent(
  action: string,
): action is WaitlistDashboardIntent {
  return (WAITLIST_DASHBOARD_INTENTS as readonly string[]).includes(action);
}

function matchLocale(prompt: string, pattern: RegExp): boolean {
  return pattern.test(prompt) || pattern.test(prompt.toLowerCase());
}

export function isListWaitlistEntriesPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (isOfferWaitlistSlotPrompt(prompt)) return false;

  if (
    matchLocale(lower, /(?:ցույց|ցուցադր|ցուցակ|ով\s+է|ով\s+են)/u) &&
    /waitlist/iu.test(prompt)
  ) {
    return true;
  }
  if (
    matchLocale(lower, /(?:покаж|список|отобраз|кто\s+в|кто\s+на)/u) &&
    /waitlist/iu.test(prompt)
  ) {
    return true;
  }

  return (
    /\bwaitlist\b/i.test(prompt) &&
    (/\b(?:list|show|display)\b/i.test(prompt) ||
      /\bwho\s+(?:is|are)\b/i.test(prompt) ||
      /\beveryone\s+on\b/i.test(prompt) ||
      /\b(?:entries|customers|clients|people)\b/i.test(prompt))
  );
}

export function isOfferWaitlistSlotPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    matchLocale(lower, /(?:առաջարկ|տեղեկացր|հաղորդ|կապ)/u) &&
    /waitlist/iu.test(prompt)
  ) {
    return true;
  }
  if (
    matchLocale(lower, /(?:предлож|уведом|сообщ|свяж)/u) &&
    /waitlist/iu.test(prompt)
  ) {
    return true;
  }

  return (
    /\b(?:offer|notify|message|contact|reach\s+out)\b/i.test(prompt) &&
    /\bwaitlist\b/i.test(prompt)
  );
}

const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export function extractWaitlistOfferDate(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  for (const day of WEEKDAYS) {
    if (new RegExp(`\\b${day}\\b`, 'i').test(lower)) return day;
  }
  if (/\btomorrow\b/i.test(lower) || /(?:վաղը|завтра)/iu.test(prompt)) {
    return 'tomorrow';
  }
  if (/\btoday\b/i.test(lower) || /(?:այսօր|сегодня)/iu.test(prompt)) {
    return 'today';
  }
  return null;
}

export function extractWaitlistOfferEmployeeName(
  prompt: string,
): string | null {
  const possessive = prompt.match(
    /\b([A-Z][a-z]+)'s\s+(?:cancelled|gap|slot|opening)/,
  );
  if (possessive?.[1]) return possessive[1];

  const hyPossessive = prompt.match(
    /\b([A-Z][a-z]+)-ի\s+(?:cancelled|gap|slot|2pm)/iu,
  );
  if (hyPossessive?.[1]) return hyPossessive[1];

  const ruCancel = prompt.match(/(?:об\s+)?отмен[еа]\s+([A-Z][a-z]+)\b/iu);
  if (ruCancel?.[1]) return ruCancel[1];

  const forEmployee = prompt.match(/\bfor\s+([A-Z][a-z]+)'s\b/);
  if (forEmployee?.[1]) return forEmployee[1];

  const withEmployee = prompt.match(/\bwith\s+([A-Z][a-z]+)\s+at\b/);
  if (withEmployee?.[1]) return withEmployee[1];

  const slotName = prompt.match(/\bslot\s+([A-Z][a-z]+)\s/i);
  if (slotName?.[1]) return slotName[1];

  const gapName = prompt.match(/\bgap\s+([A-Z][a-z]+)\b/i);
  if (gapName?.[1]) return gapName[1];

  const aboutEmployee = prompt.match(
    /\babout\s+([A-Z][a-z]+)'s\s+(?:cancelled|slot|gap)/i,
  );
  if (aboutEmployee?.[1]) return aboutEmployee[1];

  return extractEmployeeNameFromPrompt(prompt);
}

function matchWaitlistMultilingualScenario(prompt: string) {
  for (const scenario of WAITLIST_DASHBOARD_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt === prompt) return scenario;
  }
  return null;
}

export function rescueWaitlistDashboardIntent(
  prompt: string,
  action: string,
): { action: WaitlistDashboardIntent; rescueReason: string } | null {
  const multilingual = matchWaitlistMultilingualScenario(prompt);
  if (multilingual && action !== multilingual.expectedAction) {
    return {
      action: multilingual.expectedAction,
      rescueReason: multilingual.rescueReason,
    };
  }

  if (isOfferWaitlistSlotPrompt(prompt) && action !== 'offer_waitlist_slot') {
    return {
      action: 'offer_waitlist_slot',
      rescueReason: 'offer_waitlist_slot',
    };
  }
  if (
    isListWaitlistEntriesPrompt(prompt) &&
    action !== 'list_waitlist_entries'
  ) {
    return {
      action: 'list_waitlist_entries',
      rescueReason: 'list_waitlist_entries',
    };
  }
  return null;
}

export function enrichOfferWaitlistSlotParams(
  prompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...params };
  if (!next.employeeName) {
    const employeeName = extractWaitlistOfferEmployeeName(prompt);
    if (employeeName) next.employeeName = employeeName;
  }
  if (!next.date) {
    const date = extractWaitlistOfferDate(prompt);
    if (date) next.date = date;
  }
  if (!next.timeSlot) {
    const timeSlot = extractTimeSlotFromPrompt(prompt);
    if (timeSlot) next.timeSlot = timeSlot;
  }
  return next;
}

export function enrichWaitlistDashboardRescueParams(
  action: WaitlistDashboardIntent,
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  if (action === 'offer_waitlist_slot') {
    return enrichOfferWaitlistSlotParams(prompt, params);
  }
  return { ...params };
}
