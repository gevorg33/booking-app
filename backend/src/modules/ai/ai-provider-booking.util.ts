import {
  extractSharedEntityParamsFromPrompt,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import { PROVIDER_LIST_MY_MULTI_SERVICE_GROUPS_PROMPT_SCENARIOS } from './ai-provider-list-my-multi-service-groups.fixtures.js';

export const PROVIDER_BOOKING_MUTATE_INTENTS = ['mark_paid'] as const;

export const PROVIDER_BOOKING_READ_INTENTS = [
  'list_package_appointments_today',
  'list_my_package_visits',
  'list_my_multi_service_groups',
] as const;

export const PROVIDER_BOOKING_INTENTS = [
  ...PROVIDER_BOOKING_MUTATE_INTENTS,
  ...PROVIDER_BOOKING_READ_INTENTS,
] as const;

export type ProviderBookingIntent = (typeof PROVIDER_BOOKING_INTENTS)[number];

export interface ProviderBookingCompoundStep {
  action: ProviderBookingIntent;
  params: Record<string, unknown>;
  segment: string;
}

const PROVIDER_BOOKING_VERB =
  /\b(list|show|mark|paid|package|multi|service|visit|appointments?|groups?|blocks?|today|my)\b/i;

const COMPOUND_NEXT =
  '(?:list|show|mark|paid|package|multi|service|visit|appointment|group|block|today|my|booking)';

const COMPOUND_SPLIT = new RegExp(
  `\\s*;\\s*|\\s+and\\s+(?=${COMPOUND_NEXT}\\b)|\\s+then\\s+(?=${COMPOUND_NEXT}\\b)`,
  'i',
);

export function isProviderBookingIntent(
  action: string,
): action is ProviderBookingIntent {
  return (PROVIDER_BOOKING_INTENTS as readonly string[]).includes(action);
}

export function extractBookingIdFromPrompt(prompt: string): string | undefined {
  const match =
    prompt.match(/\bbooking\s*#?\s*([a-z0-9-]{6,})\b/i) ??
    prompt.match(/\bappointment\s*#?\s*([a-z0-9-]{6,})\b/i);
  return match?.[1];
}

/** Dashboard / business-wide package or multi-service admin phrasing — not provider self-scope. */
export function isDashboardPackageMultiScopePrompt(prompt: string): boolean {
  if (/\bmy\b/i.test(prompt)) return false;
  return (
    /\bfor\s+(?:customer|client)\b/i.test(prompt) ||
    /\b(create|configure|update|deactivate|assign)\b/i.test(prompt) ||
    /\ball\s+(?:package|multi[\s-]?service)\b/i.test(prompt) ||
    /\bpackage\s+visits?\s+this\s+week\b/i.test(prompt)
  );
}

export function isProviderSelfScopePrompt(prompt: string): boolean {
  return (
    /\b(my|mine|i\s+have|on\s+my\s+(?:calendar|schedule|day))\b/i.test(
      prompt,
    ) ||
    /\btoday\b/i.test(prompt) ||
    !isDashboardPackageMultiScopePrompt(prompt)
  );
}

export function isListPackageAppointmentsTodayPrompt(prompt: string): boolean {
  return (
    isProviderSelfScopePrompt(prompt) &&
    /\b(list|show)\b/i.test(prompt) &&
    /\bpackage\b/i.test(prompt) &&
    /\b(appointments?|visits?)\b/i.test(prompt) &&
    /\b(today|this\s+morning)\b/i.test(prompt) &&
    !/\bmulti[\s-]?service\b/i.test(prompt) &&
    !isDashboardPackageMultiScopePrompt(prompt)
  );
}

export function isListMyPackageVisitsPrompt(prompt: string): boolean {
  return (
    isProviderSelfScopePrompt(prompt) &&
    /\b(list|show)\b/i.test(prompt) &&
    /\b(my\s+)?package\s+(visits?|appointments?|bookings?)\b/i.test(prompt) &&
    !/\b(today|this\s+morning)\b/i.test(prompt) &&
    !/\bmulti[\s-]?service\b/i.test(prompt) &&
    !isDashboardPackageMultiScopePrompt(prompt)
  );
}

export function isListMyMultiServiceGroupsPrompt(prompt: string): boolean {
  if (
    PROVIDER_LIST_MY_MULTI_SERVICE_GROUPS_PROMPT_SCENARIOS.some(
      (scenario) => scenario.prompt === prompt,
    )
  ) {
    return true;
  }
  return (
    isProviderSelfScopePrompt(prompt) &&
    /\b(list|show)\b/i.test(prompt) &&
    /\bmy\b/i.test(prompt) &&
    /\bmulti[\s-]?service\b/i.test(prompt) &&
    (/\b(groups?|blocks?|visits?|appointments?)\b/i.test(prompt) ||
      /\bon\s+my\s+(?:calendar|schedule)\b/i.test(prompt)) &&
    !isDashboardPackageMultiScopePrompt(prompt)
  );
}

export function isProviderMarkPaidPrompt(prompt: string): boolean {
  return (
    /\bmark\b/i.test(prompt) &&
    /\b(paid|payment\s+(?:as\s+)?(?:done|complete|received))\b/i.test(prompt) &&
    !/\b(sweep|all\s+unpaid|everyone|payment\s+sweep)\b/i.test(prompt) &&
    !isDashboardPackageMultiScopePrompt(prompt)
  );
}

export function isProviderBookingCompoundPrompt(prompt: string): boolean {
  return decomposeProviderBookingCompoundPrompt(prompt).length >= 2;
}

export function classifyProviderBookingSegment(
  segment: string,
): ProviderBookingCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const base: Record<string, unknown> =
    extractSharedEntityParamsFromPrompt(text);
  const bookingId = extractBookingIdFromPrompt(text);
  if (bookingId) base.bookingId = bookingId;

  if (isListPackageAppointmentsTodayPrompt(text)) {
    return {
      action: 'list_package_appointments_today',
      params: base,
      segment: text,
    };
  }
  if (isListMyPackageVisitsPrompt(text)) {
    return { action: 'list_my_package_visits', params: base, segment: text };
  }
  if (isListMyMultiServiceGroupsPrompt(text)) {
    return {
      action: 'list_my_multi_service_groups',
      params: base,
      segment: text,
    };
  }
  if (isProviderMarkPaidPrompt(text)) {
    return { action: 'mark_paid', params: base, segment: text };
  }
  return null;
}

/** Deterministic multi-command split for provider package/multi-service flows. */
export function decomposeProviderBookingCompoundPrompt(
  prompt: string,
): ProviderBookingCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !PROVIDER_BOOKING_VERB.test(trimmed)) return [];

  const segments = trimmed.split(COMPOUND_SPLIT).map((s) => s.trim());
  const nonEmpty = segments.filter(Boolean);

  if (nonEmpty.length <= 1) {
    const single = classifyProviderBookingSegment(trimmed);
    return single ? [single] : [];
  }

  const steps: ProviderBookingCompoundStep[] = [];
  for (const segment of segments) {
    const step = classifyProviderBookingSegment(segment);
    if (step) steps.push(step);
  }
  return steps.length >= 2
    ? propagateCompoundStepParamsAcrossSteps(steps)
    : steps;
}

/** NL rescue when classifier returns unknown or a nearby provider action. */
export function rescueProviderBookingIntent(
  prompt: string,
  action: string,
): { action: ProviderBookingIntent; rescueReason: string } | null {
  if (isProviderBookingIntent(action)) return null;
  if (isProviderBookingCompoundPrompt(prompt)) return null;

  if (isListPackageAppointmentsTodayPrompt(prompt)) {
    return {
      action: 'list_package_appointments_today',
      rescueReason: 'package_today',
    };
  }
  if (isListMyPackageVisitsPrompt(prompt)) {
    return {
      action: 'list_my_package_visits',
      rescueReason: 'my_package_visits',
    };
  }
  if (isListMyMultiServiceGroupsPrompt(prompt)) {
    return {
      action: 'list_my_multi_service_groups',
      rescueReason: 'my_multi_groups',
    };
  }
  if (
    isProviderMarkPaidPrompt(prompt) &&
    action !== 'payment_sweep' &&
    action !== 'collect_cash_confirm'
  ) {
    return { action: 'mark_paid', rescueReason: 'mark_paid' };
  }

  return null;
}
