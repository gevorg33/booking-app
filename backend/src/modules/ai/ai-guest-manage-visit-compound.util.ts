import {
  extractGuestContactFromPrompt,
  parseGetManageLinkFromPrompt,
} from './ai-get-manage-link.util.js';
import { enrichRescheduleMyBookingParamsFromPrompt } from './ai-reschedule-my-booking.util.js';

export const GUEST_MANAGE_VISIT_RECIPE_ID = 'guest_manage_visit';

export const GUEST_MANAGE_VISIT_STEP_ACTIONS = [
  'get_manage_link',
  'cancel_booking_with_token',
  'reschedule_booking_with_token',
] as const;

export type GuestManageVisitCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

const CANCEL_VERB = /\b(cancel|skip)\b/i;
const RESCHEDULE_VERB = /\b(reschedule|move|change|shift)\b/i;

function isPolicyOrExplainQuestion(prompt: string): boolean {
  return /\b(can\s+i|am\s+i|will\s+i|do\s+i|what\s+(?:are|is|happens)|explain|rules?|policy|terms?)\b/i.test(
    prompt,
  );
}

function detectManageVisitAction(
  prompt: string,
): 'cancel_booking_with_token' | 'reschedule_booking_with_token' | null {
  if (isPolicyOrExplainQuestion(prompt)) return null;
  if (CANCEL_VERB.test(prompt)) return 'cancel_booking_with_token';
  if (RESCHEDULE_VERB.test(prompt)) return 'reschedule_booking_with_token';
  return null;
}

/** No signed-in session — guest identifies via email/phone rather than bookingId/customerId. */
function isGuestContext(
  prompt: string,
  params: Record<string, unknown> = {},
): boolean {
  if (params.sessionCustomerId || params.customerId) return false;
  const contact = extractGuestContactFromPrompt(prompt);
  return Boolean(contact.email || contact.phone);
}

export function isGuestManageVisitCompoundPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): boolean {
  const text = prompt.trim();
  if (text.length < 12) return false;
  if (!isGuestContext(text, params)) return false;
  return detectManageVisitAction(text) !== null;
}

export function buildGuestManageVisitCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const contact = extractGuestContactFromPrompt(prompt);
  const params: Record<string, unknown> = { guestLookup: true };
  if (contact.email) params.email = contact.email;
  if (contact.phone) params.phone = contact.phone;

  const manageLink = parseGetManageLinkFromPrompt(prompt, params);
  if (manageLink?.delivery) params.delivery = manageLink.delivery;

  return params;
}

export function decomposeGuestManageVisitCompoundPrompt(
  prompt: string,
): GuestManageVisitCompoundStep[] {
  const action = detectManageVisitAction(prompt);
  if (!action || !isGuestManageVisitCompoundPrompt(prompt)) return [];

  const base = buildGuestManageVisitCompoundParams(prompt);
  const steps: GuestManageVisitCompoundStep[] = [
    {
      action: 'get_manage_link',
      params: { ...base, delivery: 'link_only' },
      segment: prompt,
    },
  ];

  if (action === 'reschedule_booking_with_token') {
    const enriched = enrichRescheduleMyBookingParamsFromPrompt(
      {},
      prompt,
      'UTC',
    );
    steps.push({
      action,
      params: { ...base, ...enriched },
      segment: prompt,
    });
  } else {
    steps.push({ action, params: base, segment: prompt });
  }

  return steps;
}

export function rescueGuestManageVisitCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isGuestManageVisitCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'guest_manage_visit_compound',
  };
}
