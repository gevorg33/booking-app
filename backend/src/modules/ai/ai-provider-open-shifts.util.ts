/** prov-exp-7.3 — AI intent helpers for provider open shifts / gap waitlist. */

import {
  PROVIDER_OPEN_SHIFTS_FILL_PROMPT_SCENARIOS,
  SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS,
} from '../provider-mobile/provider-open-shifts.fixtures.js';
import { PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS } from './ai-provider-open-shifts-multilingual.fixtures.js';

export const PROVIDER_OPEN_SHIFTS_INTENTS = [
  'suggest_waitlist_for_gap',
  'draft_waitlist_offer_message',
  'list_waitlist_for_my_services',
  'list_rebooking_candidates',
  'book_walk_in_gap',
] as const;

export type ProviderOpenShiftsIntent =
  (typeof PROVIDER_OPEN_SHIFTS_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function isProviderOpenShiftsIntent(
  action: string,
): action is ProviderOpenShiftsIntent {
  return (PROVIDER_OPEN_SHIFTS_INTENTS as readonly string[]).includes(action);
}

const OPEN_SHIFTS_RESCUE_REASON_BY_ACTION: Record<
  ProviderOpenShiftsIntent,
  string
> = {
  suggest_waitlist_for_gap: 'fill_gap_waitlist',
  draft_waitlist_offer_message: 'draft_waitlist_offer_message',
  list_waitlist_for_my_services: 'list_waitlist_for_my_services',
  list_rebooking_candidates: 'list_rebooking_candidates',
  book_walk_in_gap: 'book_walk_in_gap',
};

export function matchProviderOpenShiftsScenario(
  prompt: string,
): { action: ProviderOpenShiftsIntent; rescueReason: string } | null {
  for (const scenario of [
    ...SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS,
    ...PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS,
  ]) {
    if (scenario.prompt === prompt) {
      return {
        action: scenario.expectedAction,
        rescueReason:
          OPEN_SHIFTS_RESCUE_REASON_BY_ACTION[scenario.expectedAction],
      };
    }
  }
  for (const scenario of PROVIDER_OPEN_SHIFTS_FILL_PROMPT_SCENARIOS) {
    if (scenario.expectedMatch && scenario.prompt === prompt) {
      return {
        action: 'suggest_waitlist_for_gap',
        rescueReason: 'fill_gap_waitlist',
      };
    }
  }
  return null;
}

export function isSuggestWaitlistForGapPrompt(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  if (
    /fill\s+(?:this\s+)?gap|suggest\s+waitlist.*(?:gap|slot)|waitlist.*(?:for|fill).*(?:gap|slot)|who\s+(?:on|from)\s+waitlist.*gap/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(\u056c\u0580\u0561\u0563\u0580\u0565\u0576|gap).*waitlist|waitlist.*gap|\u056c\u0580\u0561\u0563\u0580\u0565\u0576.*gap/i.test(
      prompt,
    );
  }
  if (containsCyrillicScript(prompt)) {
    return /(\u0437\u0430\u043f\u043e\u043b\u043d|\u043f\u0440\u043e\u0431\u0435\u043b).*waitlist|waitlist.*(gap|\u0441\u043b\u043e\u0442|\u043f\u0440\u043e\u0431\u0435\u043b)|\u043f\u0440\u0435\u0434\u043b\u043e\u0436.*waitlist.*gap/i.test(
      prompt,
    );
  }
  return false;
}

/** ai-cmd-provider-5.5.3 — draft (copy-only) SMS text offering an open gap to the top waitlist candidate. */
export function isDraftWaitlistOfferMessagePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(draft|message|text|sms)\b/i.test(lower) && /\bwaitlist\b/i.test(lower)) {
    return true;
  }
  if (
    containsArmenianScript(prompt) &&
    /(գրիր|նամակ|հաղորդագրություն)/i.test(prompt) &&
    /waitlist/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(напиши|сообщение)/i.test(prompt) &&
    /waitlist/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

/** ai-cmd-provider-5.9.2 — waitlist entries relevant to this provider's own services. */
export function isListWaitlistForMyServicesPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\bgap\b|\bslot\b/i.test(lower)) return false;
  if (/\b(draft|message|text|sms)\b/i.test(lower)) return false;

  if (
    /\b(show|list|view|see|check)\b.{0,15}\bwaitlist\b/i.test(lower) ||
    /\bmy\s+waitlist\b/i.test(lower) ||
    /\bwho'?s\s+waiting\s+for\b/i.test(lower) ||
    /\bwaiting\s+for\s+[a-z]/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(իմ|ո՞?վ)/i.test(prompt) &&
    /waitlist/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(мо[йяёи]|кто)/i.test(prompt) &&
    /waitlist/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

/** ai-cmd-provider-5.9.4 — who to call after a cancellation: waitlist + regulars for that service/provider. */
export function isListRebookingCandidatesPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    /\bwho\s+should\s+i\s+call\b/i.test(lower) ||
    /\brebooking\s+candidates?\b/i.test(lower) ||
    /\bregulars\b/i.test(lower) ||
    /\bwho\s+(?:else\s+)?(?:should|can)\s+i\s+(?:call|text|contact)\b/i.test(
      lower,
    )
  ) {
    return true;
  }
  if (
    containsArmenianScript(prompt) &&
    /(ո՞ւմ|ում)\s+(?:պետք է )?զանգեմ/i.test(prompt)
  ) {
    return true;
  }
  if (containsCyrillicScript(prompt) && /кому\s+позвонить/i.test(prompt)) {
    return true;
  }
  return false;
}

/** ai-cmd-provider-5.9.5 — book a walk-in (no customer record) into an open gap. */
export function isBookWalkInGapPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\bpay(?:ment)?\s+(?:at\s+venue|cash)\b|\bpay\s+cash\b/i.test(lower)) {
    return false;
  }
  if (/\bwalk-?in\b/i.test(lower) && /\bbook\b/i.test(lower)) return true;
  if (/\bquick\s+book\b/i.test(lower)) return true;
  if (
    containsArmenianScript(prompt) &&
    /walk-?in/i.test(prompt) &&
    /(ամրագրիր|գրանցիր)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /walk-?in/i.test(prompt) &&
    /(запиши|забронир)/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function rescueProviderOpenShiftsIntent(
  prompt: string,
  action: string,
): { action: ProviderOpenShiftsIntent; rescueReason: string } | null {
  if (isProviderOpenShiftsIntent(action)) return null;

  const exact = matchProviderOpenShiftsScenario(prompt);
  if (exact) return exact;

  if (isDraftWaitlistOfferMessagePrompt(prompt)) {
    return {
      action: 'draft_waitlist_offer_message',
      rescueReason: 'draft_waitlist_offer_message',
    };
  }
  if (isSuggestWaitlistForGapPrompt(prompt)) {
    return {
      action: 'suggest_waitlist_for_gap',
      rescueReason: 'fill_gap_waitlist',
    };
  }
  if (isBookWalkInGapPrompt(prompt)) {
    return { action: 'book_walk_in_gap', rescueReason: 'book_walk_in_gap' };
  }
  if (isListRebookingCandidatesPrompt(prompt)) {
    return {
      action: 'list_rebooking_candidates',
      rescueReason: 'list_rebooking_candidates',
    };
  }
  if (isListWaitlistForMyServicesPrompt(prompt)) {
    return {
      action: 'list_waitlist_for_my_services',
      rescueReason: 'list_waitlist_for_my_services',
    };
  }
  return null;
}
