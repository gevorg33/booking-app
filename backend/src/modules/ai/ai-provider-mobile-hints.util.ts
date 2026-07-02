import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import {
  classifyPushNotificationsSegment,
  decomposePushNotificationsCompoundPrompt,
  parseProviderLastPushPayload,
  type PushNotificationsCompoundStep,
} from './ai-push-notifications.util.js';
import {
  classifyProviderBookingSegment,
  decomposeProviderBookingCompoundPrompt,
  isListMyMultiServiceGroupsPrompt,
  isListMyPackageVisitsPrompt,
  isListPackageAppointmentsTodayPrompt,
  isProviderMarkPaidPrompt,
  type ProviderBookingCompoundStep,
} from './ai-provider-booking.util.js';
import { enrichProviderExp2ActionParams } from './ai-provider-exp-2.util.js';

/** Push deep-link actions with NL parity (ai-cmd-h3.5). */
export const PROVIDER_PUSH_PARITY_ACTIONS = [
  'confirm_booking_from_push',
  'mark_paid',
  'suggest_reschedule_from_push',
] as const;

export type ProviderPushParityAction =
  (typeof PROVIDER_PUSH_PARITY_ACTIONS)[number];

export const PROVIDER_MOBILE_SCOPED_READ_ACTIONS = [
  'list_package_appointments_today',
  'list_my_package_visits',
  'list_my_multi_service_groups',
] as const;

const PROVIDER_MOBILE_SESSION_KEYS = [
  'bookingId',
  'customerName',
  'date',
  'timeSlot',
  'serviceName',
  'lastPush',
  'pushActionId',
  'lastAction',
] as const;

const MOBILE_COMPOUND_SPLIT =
  /\s*;\s*|\s+and\s+(?=(?:confirm|mark|reschedule|open|explain|offline|dismiss|list|show|new|retry)\b)/i;

export type ProviderMobileCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

export type ProviderPushDeepLinkActionId =
  | 'confirm'
  | 'mark_paid'
  | 'suggest_reschedule';

export function isProviderPushParityAction(
  action: string,
): action is ProviderPushParityAction {
  return (PROVIDER_PUSH_PARITY_ACTIONS as readonly string[]).includes(action);
}

export function hasProviderPushContext(
  prompt: string,
  session?: Record<string, unknown>,
): boolean {
  if (parseProviderLastPushPayload(session?.lastPush)) return true;
  return (
    /\b(from\s+(?:the\s+)?push|push\s+notification|notification|alert|new\s+booking\s+push)\b/i.test(
      prompt,
    ) || /\bthis\s+booking\b/i.test(prompt)
  );
}

export function isConfirmBookingFromPushPrompt(prompt: string): boolean {
  if (
    /\b(confirm|accept|approve)\s+(?:it|this)\b/i.test(prompt) ||
    /\bconfirm\s+this\s+booking\b/i.test(prompt)
  ) {
    return !/\b(cancel|reschedule|move|shift)\b/i.test(prompt);
  }
  return (
    /\b(confirm|accept|approve)\b/i.test(prompt) &&
    /\b(booking|appointment)\b/i.test(prompt) &&
    !/\b(cancel|reschedule|move|shift)\b/i.test(prompt) &&
    !/\b(all|every|sweep)\b/i.test(prompt)
  );
}

export function isSuggestRescheduleFromPushPrompt(prompt: string): boolean {
  const hasRescheduleVerb = /\b(reschedule|move|shift)\b/i.test(prompt);
  const hasBookingNoun = /\b(booking|appointment)\b/i.test(prompt);
  const hasConcreteTime =
    /\bto\s+(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(
      prompt,
    );
  if (!hasRescheduleVerb || !hasBookingNoun || hasConcreteTime) return false;
  return (
    /\b(from\s+(?:the\s+)?push|push\s+button|notification|help\s+me)\b/i.test(
      prompt,
    ) || /\bthis\b/i.test(prompt)
  );
}

export function isSuggestRescheduleFromPushPromptLoose(
  prompt: string,
): boolean {
  return (
    /\b(reschedule|help\s+me\s+reschedule)\b/i.test(prompt) &&
    /\b(from\s+(?:the\s+)?push|push\s+notification|notification|alert)\b/i.test(
      prompt,
    ) &&
    !/\bto\s+\d{1,2}(:\d{2})?\b/i.test(prompt)
  );
}

export function resolveProviderPushActionIdFromPrompt(
  prompt: string,
): ProviderPushDeepLinkActionId | null {
  if (isConfirmBookingFromPushPrompt(prompt)) return 'confirm';
  if (
    isProviderMarkPaidPrompt(prompt) &&
    !/\b(sweep|all\s+unpaid|everyone)\b/i.test(prompt)
  ) {
    return 'mark_paid';
  }
  if (
    isSuggestRescheduleFromPushPromptLoose(prompt) ||
    (isSuggestRescheduleFromPushPrompt(prompt) &&
      hasProviderPushContext(prompt))
  ) {
    return 'suggest_reschedule';
  }
  return null;
}

export function disambiguateProviderMobileAction(
  prompt: string,
  action: string,
  session?: Record<string, unknown>,
): { action: string; rescueReason: string } | null {
  const pushContext = hasProviderPushContext(prompt, session);

  if (
    action === 'update_bookings' &&
    isConfirmBookingFromPushPrompt(prompt) &&
    (pushContext || !!session?.bookingId)
  ) {
    return {
      action: 'confirm_booking_from_push',
      rescueReason: 'push_confirm_parity',
    };
  }

  if (
    action === 'reschedule_booking' &&
    (isSuggestRescheduleFromPushPromptLoose(prompt) ||
      (isSuggestRescheduleFromPushPrompt(prompt) && pushContext))
  ) {
    return {
      action: 'suggest_reschedule_from_push',
      rescueReason: 'push_reschedule_parity',
    };
  }

  if (
    (action === 'payment_sweep' || action === 'update_bookings') &&
    isProviderMarkPaidPrompt(prompt) &&
    (pushContext || !!session?.bookingId)
  ) {
    return { action: 'mark_paid', rescueReason: 'push_mark_paid_parity' };
  }

  if (
    action === 'list_package_bookings' &&
    isListPackageAppointmentsTodayPrompt(prompt)
  ) {
    return {
      action: 'list_package_appointments_today',
      rescueReason: 'scoped_package_today',
    };
  }

  if (action === 'list_bookings' && isListMyPackageVisitsPrompt(prompt)) {
    return {
      action: 'list_my_package_visits',
      rescueReason: 'scoped_package_visits',
    };
  }

  if (
    (action === 'list_bookings' || action === 'show_appointments') &&
    isListMyMultiServiceGroupsPrompt(prompt)
  ) {
    return {
      action: 'list_my_multi_service_groups',
      rescueReason: 'scoped_multi_groups',
    };
  }

  if (isProviderPushParityAction(action)) return null;

  const pushAction = resolveProviderPushActionIdFromPrompt(prompt);
  if (pushAction === 'confirm' && pushContext) {
    return {
      action: 'confirm_booking_from_push',
      rescueReason: 'nl_confirm_push_parity',
    };
  }
  if (pushAction === 'mark_paid' && pushContext) {
    return { action: 'mark_paid', rescueReason: 'nl_mark_paid_push_parity' };
  }
  if (pushAction === 'suggest_reschedule' && pushContext) {
    return {
      action: 'suggest_reschedule_from_push',
      rescueReason: 'nl_reschedule_push_parity',
    };
  }

  return null;
}

export function inheritProviderPushFollowUpContext(
  params: Record<string, any>,
  session?: Record<string, any>,
  action?: string,
  prompt = '',
): void {
  if (!session) return;

  const pushFollowUp =
    isProviderPushParityAction(action ?? '') ||
    /\b(confirm|mark\s+paid|reschedule|open|it|this)\b/i.test(prompt);

  const lastPush = parseProviderLastPushPayload(session.lastPush);

  for (const key of PROVIDER_MOBILE_SESSION_KEYS) {
    if (key === 'lastAction' || key === 'lastPush') continue;
    const value = params[key];
    if (
      (value == null || value === '') &&
      session[key] != null &&
      session[key] !== ''
    ) {
      params[key] = session[key];
    }
  }

  if (pushFollowUp && !params.bookingId && lastPush?.bookingId) {
    params.bookingId = lastPush.bookingId;
  }
  if (pushFollowUp && !params.lastPush && session.lastPush) {
    params.lastPush = session.lastPush;
  }
}

export function pickProviderMobileSessionSlice(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const slice: Record<string, unknown> = {};
  for (const key of PROVIDER_MOBILE_SESSION_KEYS) {
    const value = params[key];
    if (value != null && value !== '') slice[key] = value;
  }
  return slice;
}

export function mergeProviderMobileHintsIntoSessionContext(
  sessionContext: Record<string, any>,
  params: Record<string, unknown>,
  action: string,
): Record<string, any> {
  const fromSession: Record<string, unknown> = {};
  for (const key of PROVIDER_MOBILE_SESSION_KEYS) {
    const value = sessionContext[key];
    if (value != null && value !== '') fromSession[key] = value;
  }
  return {
    ...params,
    ...fromSession,
    ...pickProviderMobileSessionSlice(params),
    lastAction: action,
  };
}

export function applyProviderMobilePromptHints(
  action: string,
  params: Record<string, any>,
  prompt: string,
  context?: { session?: Record<string, any> },
): void {
  inheritProviderPushFollowUpContext(params, context?.session, action, prompt);

  const pushActionId = resolveProviderPushActionIdFromPrompt(prompt);
  if (pushActionId && !params.pushActionId) {
    params.pushActionId = pushActionId;
  }

  if (isConfirmBookingFromPushPrompt(prompt) && !params.status) {
    params.status = 'confirmed';
  }

  enrichProviderExp2ActionParams(action, params, prompt);
}

function classifyProviderMobileSegment(
  segment: string,
  shared: Record<string, unknown> = {},
): ProviderMobileCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const base = {
    ...shared,
    ...enrichParamsWithSharedEntities({}, text),
  };

  if (isConfirmBookingFromPushPrompt(text)) {
    return {
      action: 'confirm_booking_from_push',
      params: { ...base, status: 'confirmed' },
      segment: text,
    };
  }
  if (isProviderMarkPaidPrompt(text)) {
    return { action: 'mark_paid', params: base, segment: text };
  }
  if (
    isSuggestRescheduleFromPushPromptLoose(text) ||
    isSuggestRescheduleFromPushPrompt(text)
  ) {
    return {
      action: 'suggest_reschedule_from_push',
      params: base,
      segment: text,
    };
  }

  const pushStep = classifyPushNotificationsSegment(text);
  if (pushStep) {
    return pushStep;
  }

  const bookingStep = classifyProviderBookingSegment(text);
  if (bookingStep) {
    return bookingStep;
  }

  return null;
}

/** Provider push parity + scoped handler compounds (ai-cmd-h3.5). */
export function decomposeProviderMobileCompoundPrompt(
  prompt: string,
): ProviderMobileCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const pushOnly = decomposePushNotificationsCompoundPrompt(trimmed);
  if (pushOnly.length >= 2) {
    return pushOnly;
  }

  const bookingOnly = decomposeProviderBookingCompoundPrompt(trimmed);
  if (bookingOnly.length >= 2) {
    return bookingOnly;
  }

  const segments = trimmed.split(MOBILE_COMPOUND_SPLIT).map((s) => s.trim());
  const nonEmpty = segments.filter(Boolean);
  if (nonEmpty.length <= 1) {
    const single = classifyProviderMobileSegment(trimmed);
    return single ? [single] : [];
  }

  const shared: Record<string, unknown> = {};
  const steps: ProviderMobileCompoundStep[] = [];
  for (const segment of nonEmpty) {
    const step = classifyProviderMobileSegment(segment, shared);
    if (!step) continue;
    steps.push(step);
    for (const [key, value] of Object.entries(step.params)) {
      if (value != null && value !== '') shared[key] = value;
    }
  }

  if (steps.length < 2) return steps;
  return propagateCompoundStepParamsAcrossSteps(steps);
}

export function isProviderMobileCompoundPrompt(prompt: string): boolean {
  return decomposeProviderMobileCompoundPrompt(prompt).length >= 2;
}
