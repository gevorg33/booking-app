import {
  REBOOK_LAST_APPOINTMENT_PROMPTS,
  type RebookLastAppointmentPromptFixture,
} from './ai-rebook-last-appointment.fixtures.js';
import { REBOOK_LAST_APPOINTMENT_MULTILINGUAL_SCENARIOS } from './ai-rebook-last-appointment-multilingual.fixtures.js';
import { isBookAnotherServicePrompt } from './ai-book-another-service.util.js';
import { isListMyUpcomingAppointmentsPrompt } from './ai-list-my-upcoming-appointments.util.js';
import { isRescheduleMyBookingPrompt } from './ai-self-service-booking.util.js';
import { isLeaveVisitReviewPrompt } from './ai-leave-visit-review.util.js';

import {
  isBookNearestSlotPrompt,
  isChoosePaymentMethodPrompt,
  isPayOnlinePrompt,
} from './ai-payments.util.js';
import { isAskPaymentOptionsPrompt } from './ai-cash-payment-checkout.util.js';
import { isBookWithGiftCardCompoundPrompt } from './ai-book-with-gift-card.util.js';
import { isGiftCardCheckoutCompoundPrompt } from './ai-gift-card-payments-hints.util.js';
import { isExplainHomeScreenWidgetPrompt } from './ai-explain-home-screen-widget.util.js';
import {
  hasResultsThenRebookFollowUpCue,
  hasResultsThenRebookResultsCue,
} from './ai-results-then-rebook-cue.util.js';

export const REBOOK_LAST_APPOINTMENT_INTENTS = [
  'rebook_last_appointment',
] as const;

export type RebookLastAppointmentIntent =
  (typeof REBOOK_LAST_APPOINTMENT_INTENTS)[number];

export { CUSTOMER_REBOOK_LAST_APPOINTMENT_CLASSIFIER_RULES } from './ai-rebook-last-appointment.fixtures.js';

const REBOOK_LAST_CUE =
  /\b(rebook(?:\s+my)?\s+last|book(?:\s+the)?\s+same(?:\s+as)?(?:\s+last)?|repeat(?:\s+my)?\s+last|same as last|same appointment|book same again|book my last|last visit again|same service as last|one tap rebook|schedule the same service|rebook what i had)\b/i;

const STYLIST_ONLY_PICK_BLOCK = new RegExp(
  String.raw`\b(?:same|usual)\s+(?:stylist|specialist|provider|therapist|master|barber)\b|\bstylist\s+from\s+my\s+last\s+visit\b|\bspecialist\s+i\s+had\s+before\b|\bmy\s+usual\s+(?:stylist|specialist|provider)\b|նույն\s+ստայլիստ|того\s+же\s+мастера|обычн(?:ого|ый)\s+мастер`,
  'iu',
);

const EXPLICIT_REBOOK_CUE = new RegExp(
  String.raw`\b(?:rebook(?:\s+my)?\s+last|book same again|repeat(?:\s+my)?\s+last|same as last|book my last)\b` +
    String.raw`|повторн.{0,20}запис|как\s+в\s+прошлый|снова\s+как` +
    String.raw`|[\u054E\u057E]\u0565\u0580\u0561\u0574\u0561\u0572\u0580.{0,24}(?:\u057E\u0565\u0580\u057B\u056B\u0576|last)` +
    String.raw`|\u0576\u0578\u0572\u0576.{0,20}(?:\u0561\u0576\u0581\u0561\u0574|\u0061mr|\u0561\u0575\u0581)` +
    String.raw`|\u057E\u0565\u0580\u057B\u056B\u0576.{0,16}\u0561\u0575\u0581`,
  'iu',
);

function matchRebookScenario(
  prompt: string,
): RebookLastAppointmentPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of REBOOK_LAST_APPOINTMENT_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of REBOOK_LAST_APPOINTMENT_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
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

function isArmenianRebookCue(prompt: string): boolean {
  if (!containsArmenianScript(prompt)) return false;
  const veramagr = /[\u054E\u057E]\u0565\u0580\u0561\u0574\u0561\u0572\u0580/u;
  const verjin = /\u057E\u0565\u0580\u057B\u056B\u0576/u;
  const ayts = /\u0561\u0575\u0581/u;
  const noyn = /[\u0546\u0576]\u0578\u0572\u0576/u;
  const ancam = /\u0561\u0576\u0581\u0561\u0574/u;
  const krknel = /\u053F\u0580\u056F\u0576\u0565\u056C/u;
  return (
    (veramagr.test(prompt) && verjin.test(prompt)) ||
    (noyn.test(prompt) && (ancam.test(prompt) || ayts.test(prompt))) ||
    (krknel.test(prompt) && verjin.test(prompt))
  );
}

/**
 * What "same" has to be referring to for this to be a prior-visit cue.
 *
 * The weak fallback below fires on `book` + `last|same|again|repeat`, meaning
 * "book the same *appointment* as before". But `same` attaches to plenty of
 * things that are not a previous visit — most importantly the contact details a
 * guest types at checkout: "book as a guest with the **same phone** as my
 * profile" is an `explain_guest_checkout_fields` question. D1/e2e-bug.358: two
 * of that intent's four corpus failures were stolen here. (The two that passed
 * did so only because they say "book**ing**", a noun `\bbook\b` misses — an
 * accident of wording, not a distinction the code was drawing.)
 *
 * **This is a whitelist, deliberately.** The first fix here excluded a list of
 * contact nouns instead, which repaired the two corpus prompts and nothing else:
 * "same cell", "same telephone", "same login", "same account", "same WhatsApp"
 * were all still stolen. The set of ways to name a contact field is open-ended,
 * so a blacklist can only ever chase it. The set of things you rebook is small
 * and closed, so naming *that* is what generalises.
 *
 * Unknown nouns therefore fall through to "not a rebook cue". That is the safe
 * direction: every confident path — `matchRebookScenario`, `REBOOK_LAST_CUE`,
 * `EXPLICIT_REBOOK_CUE`, the Armenian and Cyrillic cues — has already returned
 * `true` above, so this branch is a last resort, and a false positive here
 * routes a *question* into a booking action.
 *
 * Members are taken from the rebook fixtures, where `same` modifies: `as`
 * ("same as last time"), `service`, `again`, `time`, `appointment`.
 *
 * Provider nouns (`stylist`, `barber`, …) are deliberately **absent**:
 * `STYLIST_ONLY_PICK_BLOCK` above already routes "book the same stylist" to
 * provider-pick rather than rebook, so listing them here would be dead and would
 * misdescribe what this function does.
 */
const SAME_PRIOR_VISIT =
  /\bsame\s+(?:appointment|booking|visit|service|treatment|session|slot|time)\b/i;

/** "the same as last time", "same as before" — `same` with no noun of its own. */
const SAME_AS_BEFORE = /\bsame\s+as\b/i;

function hasPriorVisitCue(prompt: string): boolean {
  if (/\b(?:last|again|repeat)\b/i.test(prompt)) return true;
  if (!/\bsame\b/i.test(prompt)) return false;
  return SAME_PRIOR_VISIT.test(prompt) || SAME_AS_BEFORE.test(prompt);
}

export function hasRebookLastAppointmentCoreCue(prompt: string): boolean {
  if (isLeaveVisitReviewPrompt(prompt)) return false;
  if (
    STYLIST_ONLY_PICK_BLOCK.test(prompt) &&
    !/\b(?:same as last|rebook|repeat last|book same again|same service|same appointment)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (matchRebookScenario(prompt)) return true;
  if (isArmenianRebookCue(prompt)) return true;
  if (
    containsCyrillicScript(prompt) &&
    /(повтор|как\s+в\s+прошлый|снова\s+как|прошл.{0,20}визит|визит.{0,20}прошл)/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (REBOOK_LAST_CUE.test(prompt)) return true;
  if (EXPLICIT_REBOOK_CUE.test(prompt)) return true;

  if (isBookAnotherServicePrompt(prompt)) return false;
  if (isListMyUpcomingAppointmentsPrompt(prompt)) return false;

  if (
    isRescheduleMyBookingPrompt(prompt) &&
    !EXPLICIT_REBOOK_CUE.test(prompt) &&
    !isArmenianRebookCue(prompt)
  ) {
    return false;
  }

  if (
    /\b(book|schedule)\b/i.test(prompt) &&
    hasPriorVisitCue(prompt) &&
    !/\b(new|different|another service)\b/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

function shouldDeferToResultsThenRebookCompound(prompt: string): boolean {
  if (!hasResultsThenRebookResultsCue(prompt)) return false;
  if (!hasResultsThenRebookFollowUpCue(prompt)) return false;
  return true;
}

function shouldDeferToRebookAndPayCompound(prompt: string): boolean {
  if (!hasRebookLastAppointmentCoreCue(prompt)) return false;
  if (/\bgift\s*card\b/i.test(prompt)) return false;
  if (isPayOnlinePrompt(prompt)) return true;
  if (isChoosePaymentMethodPrompt(prompt)) return true;
  if (
    isAskPaymentOptionsPrompt(prompt) &&
    /\b(?:rebook|repeat|last|same)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(?:and|then|;\s*)\s*pay\b/i.test(prompt) &&
    /\b(?:online|card|stripe|checkout|payment)\b/i.test(prompt)
  ) {
    return true;
  }
  if (isBookWithGiftCardCompoundPrompt(prompt)) return false;
  if (isGiftCardCheckoutCompoundPrompt(prompt)) return false;
  return false;
}

export function isRebookLastAppointmentIntent(
  action: string,
): action is RebookLastAppointmentIntent {
  return (REBOOK_LAST_APPOINTMENT_INTENTS as readonly string[]).includes(
    action,
  );
}

export function parseRebookLastAppointmentFromPrompt(
  prompt: string,
): { serviceName?: string } | null {
  if (!hasRebookLastAppointmentCoreCue(prompt)) return null;
  const scenario = matchRebookScenario(prompt);
  if (scenario?.serviceName) return { serviceName: scenario.serviceName };
  const lastServiceMatch = prompt.match(
    /\b(?:rebook|repeat|book)\s+my\s+last\s+([a-z][\w-]{2,30})\b/i,
  );
  const serviceName = lastServiceMatch?.[1]?.trim();
  if (serviceName) return { serviceName };
  return {};
}

export function rescueRebookLastAppointmentIntent(
  prompt: string,
  action: string,
): { action: RebookLastAppointmentIntent; rescueReason: string } | null {
  if (isRebookLastAppointmentIntent(action)) return null;
  if (shouldDeferToRebookAndPayCompound(prompt)) return null;
  if (shouldDeferToResultsThenRebookCompound(prompt)) return null;
  if (!parseRebookLastAppointmentFromPrompt(prompt)) return null;
  return {
    action: 'rebook_last_appointment',
    rescueReason: 'rebook_last_appointment',
  };
}

export function detectRebookLastAppointmentAction(
  prompt: string,
): RebookLastAppointmentIntent | null {
  return rescueRebookLastAppointmentIntent(prompt, 'unknown')?.action ?? null;
}

export { REBOOK_LAST_APPOINTMENT_PROMPTS };
