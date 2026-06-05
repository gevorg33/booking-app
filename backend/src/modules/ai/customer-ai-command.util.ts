import type { CommandResult } from './command-completion.types.js';
import {
  CUSTOMER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import type { PublicAssistantResult } from '../public-booking/public-booking-assistant.service.js';

/** Anonymous public-booking assistant intents routed via PublicBookingAssistantService. */
export const PUBLIC_ONLY_ASSISTANT_ACTIONS = [
  'list_providers',
  'list_services',
  'check_availability',
  'recommend_specialists',
  'business_info',
  'book_appointment',
  'booking_help',
] as const;

export type PublicOnlyAssistantAction =
  (typeof PUBLIC_ONLY_ASSISTANT_ACTIONS)[number];

export const CUSTOMER_SURFACE_INTENT_UNION = [
  ...new Set([...CUSTOMER_INTENTS, ...PUBLIC_INTENTS]),
] as const;

export function isPublicOnlyAssistantAction(
  action: string,
): action is PublicOnlyAssistantAction {
  return (PUBLIC_ONLY_ASSISTANT_ACTIONS as readonly string[]).includes(action);
}

export function isCustomerSurfaceIntent(action: string): boolean {
  if (
    action === 'unknown' ||
    action === 'error' ||
    action === 'security_blocked'
  )
    return true;
  return CUSTOMER_SURFACE_INTENT_UNION.includes(action);
}

export function publicAssistantResultToCommandResult(
  result: PublicAssistantResult,
): CommandResult {
  return {
    success: result.success,
    action: result.action,
    summary: result.summary,
    details: {
      sessionContext: result.sessionContext,
      navigate: result.navigate,
      bookingId: result.bookingId,
    },
  };
}

export function commandResultToPublicAssistantResult(
  result: CommandResult,
): PublicAssistantResult {
  const details = (result.details ?? {}) as Record<string, unknown>;
  return {
    success: result.success,
    action: result.action ?? 'unknown',
    summary: result.summary,
    sessionContext:
      details.sessionContext as PublicAssistantResult['sessionContext'],
    navigate: details.navigate as PublicAssistantResult['navigate'],
    bookingId: details.bookingId as string | undefined,
  };
}

export function buildCustomerClassifierSchema(): string {
  const customerActions = CUSTOMER_INTENTS.filter(
    (id) => id !== 'unknown',
  ).join(' | ');
  const publicActions = PUBLIC_ONLY_ASSISTANT_ACTIONS.join(' | ');
  return `You are a customer-facing booking assistant (public web + consumer app).
Classify the user's message and extract parameters. Return JSON:

{
  "action": ${customerActions} | ${publicActions} | unknown,
  "params": {
    "employeeName": "string or null",
    "serviceName": "string or null",
    "serviceNames": ["string"] or null,
    "packageName": "string or null",
    "packageId": "string or null",
    "bookingId": "string or null",
    "promoCode": "string or null",
    "giftCardCode": "string or null",
    "date": "DD/MM/YYYY or null",
    "timeSlot": "HH:MM or null",
    "paymentMethod": "cash | online | gift_card | null",
    "customerName": "string or null",
    "customerEmail": "string or null",
    "customerPhone": "string or null"
  },
  "reasoning": "one short sentence"
}

Rules:
- Use public assistant actions (list_providers, check_availability, book_appointment, etc.) for anonymous discovery/booking on the public page.
- Use customer self-service actions (book_package, list_my_appointments, cancel_my_booking, promo_code_help, etc.) for logged-in account flows.
- Compound-style prompts should still pick the FIRST actionable intent; multi-step execution is handled separately.
- Never invent catalog names; use context when provided.
- Default to "unknown" when unclear.`;
}

export function mergeCustomerCompoundContext(
  context: Record<string, unknown>,
  result: CommandResult,
): Record<string, unknown> {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const next = { ...context };
  if (details.sessionContext && typeof details.sessionContext === 'object') {
    Object.assign(next, details.sessionContext);
  }
  for (const key of [
    'cartServiceIds',
    'bookingId',
    'packageId',
    'packageName',
    'manageUrl',
    'promoCode',
    'giftCardCode',
    'paymentMethod',
    'useSubscriptionId',
  ]) {
    if (details[key] !== undefined) next[key] = details[key];
  }
  return next;
}
