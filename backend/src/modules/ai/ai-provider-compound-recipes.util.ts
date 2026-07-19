/** ai-cmd-provider-5.14 — provider mobile compound "recipes": one natural-language message fans out into a fixed sequence of already-shipped atomic provider actions. */

export const PROVIDER_COMPOUND_RECIPE_INTENTS = [
  'chair_closeout',
  'running_late_notify',
  'gap_waitlist_fill',
  'cancel_and_recover',
  'pre_visit_brief',
  'end_of_day_close',
  'reschedule_and_notify',
  'clinic_draw_flow',
  'push_confirm_check_in',
  'pending_confirm_day',
  'check_in_start_complete',
  'retail_closeout',
  'gap_walk_in_book',
  'no_show_recover',
  'multi_service_brief',
  'clinic_draw_patient',
  'push_mark_paid_close',
  'manager_floor_sweep',
] as const;

export type ProviderCompoundRecipeIntent =
  (typeof PROVIDER_COMPOUND_RECIPE_INTENTS)[number];

export function isProviderCompoundRecipeIntent(
  action: string,
): action is ProviderCompoundRecipeIntent {
  return (PROVIDER_COMPOUND_RECIPE_INTENTS as readonly string[]).includes(
    action,
  );
}

export const PROVIDER_COMPOUND_RECIPE_CLASSIFIER_RULES = `- chair_closeout: MUTATE — provider mobile only: one message finishes a visit — marks the visit complete, marks it paid, and (if a product is named) adds it to the retail cart. Requires bookingId (session) and/or customerName; optional retail product name. Triggers: finish Jane and mark paid cash, wrap up this visit and mark paid, close out this booking mark paid add Olaplex. NOT mark_visit_complete alone (single step), NOT mark_paid alone.
- running_late_notify: MUTATE — provider mobile only: marks the provider running late and texts the next client in one step. Requires a lateness cue (minutes late) and/or explicit "text/notify" ask. Triggers: I'm 15 late text my next client, running behind — let my next client know, I'm running late message my next appointment. NOT mark_running_late alone, NOT send_client_message alone.
- gap_waitlist_fill: MUTATE — provider mobile only: one message runs the full gap-fill flow — suggest matching waitlist customers for an open gap, draft an offer message, and coordinate (send) the offer. Requires a gap reference (time or "this gap"). Triggers: fill my 3pm gap from waitlist, fill this gap with someone from the waitlist, offer my open slot to the waitlist. NOT suggest_waitlist_for_gap alone (read-only suggestion, no message sent).
- cancel_and_recover: MUTATE — provider mobile only: cancels a booking, then looks up rebooking candidates from the waitlist so the gap can be refilled. Requires identifying the booking to cancel (time and/or customerName). Triggers: cancel 2pm and message waitlist, cancel Jane's appointment and find someone to fill it, cancel this booking and check the waitlist. NOT cancel_bookings alone (no waitlist follow-up).
- pre_visit_brief: READ — provider mobile only: one message brings together a client snapshot, recent visit history, and pre-visit intake answers before a visit. Requires bookingId (session) and/or customerName. Triggers: brief me before Jane at 2, give me the full rundown on this client, catch me up before this appointment. NOT summarize_client alone (snapshot only, no history/intake).
- end_of_day_close: MUTATE — provider mobile only: one message wraps the day — end-of-day summary, then a payment sweep for unpaid completed visits, then marks past no-shows. Triggers: wrap today mark paid and no-shows, close out my day, end of day — sweep payments and no-shows. NOT end_of_day_summary alone (read-only recap), NOT payment_sweep alone.
- reschedule_and_notify: MUTATE — provider mobile only: reschedules a booking to a new time and texts the client about the change in one step. Requires identifying the booking (customerName and/or time) and a new date/time. Triggers: move Maria to 4pm and text her, reschedule Jane to tomorrow and let her know, push this to 5 and message the client. NOT reschedule_booking alone (no client notification).
- clinic_draw_flow: READ — provider mobile only: clinic vertical — one message opens the next collection-queue draw, opens that patient's chart, then marks the specimen collected. Triggers: next draw open chart and mark collected, pull the next collection and mark it done, start my next draw. NOT list_my_collection_queue alone (queue only, no chart/mark-collected follow-through).
- push_confirm_check_in: MUTATE — provider mobile only: confirms a booking that arrived via push notification, then checks the client in. Requires bookingId (inherit from lastPush). Triggers: confirm push booking and check in when she arrives, confirm this push notification and check her in, accept the push booking then check in.
- pending_confirm_day: MUTATE — provider mobile only: confirms all pending bookings, then summarizes today's schedule. Triggers: confirm all pending then summarize today, confirm my pending bookings and give me today's rundown. NOT confirm_pending_booking alone (no day summary), NOT summarize_day alone.
- check_in_start_complete: MUTATE — provider mobile only: one message runs a full visit lifecycle — check in the client, mark the visit in progress, then mark it complete. Requires bookingId (session) and/or customerName. Triggers: check in Jane start service and mark done, check her in start and complete the visit. NOT check_in_client alone (single step).
- retail_closeout: MUTATE — provider mobile only: suggests a retail upsell, adds the recommended product to the booking, then marks it paid. Requires bookingId (session) and/or customerName. Triggers: recommend a product and close with cash, suggest an upsell add it and mark paid. NOT suggest_retail_upsell alone (read-only suggestion), NOT chair_closeout (starts from mark_visit_complete, no upsell suggestion step).
- gap_walk_in_book: MUTATE — provider mobile only: books a walk-in into the next open gap, then checks the client in. Requires serviceName; optional customerName/time. Triggers: book walk-in in the 2pm gap and check in, quick book a walk-in and check them in now. NOT book_walk_in_gap alone (no check-in follow-through).
- no_show_recover: MUTATE — provider mobile only: marks a booking no-show, looks up rebooking candidates from the waitlist, then drafts an offer message for the freed slot. Requires identifying the no-show booking (time and/or customerName). Triggers: no-show at 2 who should I offer the slot to, mark this a no-show and find someone to fill it, mark no-show then draft a waitlist offer. NOT mark_no_shows alone (no rebooking follow-up), NOT cancel_and_recover (cancellation, not a no-show).
- multi_service_brief: READ — provider mobile only: one message briefs you on a multi-service/package client before their visit — their multi-service groups, the service order/timeline, and a client snapshot. Requires bookingId (session) and/or customerName. Triggers: brief me on the spa day client at 3, walk me through this package client's multi-service order. NOT pre_visit_brief (generic client snapshot + history + intake, no multi-service timeline).
- clinic_draw_patient: READ — provider mobile only: clinic vertical — finds a patient by name, opens their chart, then marks their specimen collected. Requires a patient name. Triggers: find Jane open her chart and mark the draw done, look up Maria open chart mark specimen collected. NOT clinic_draw_flow (starts from the collection queue, not a name search).
- push_mark_paid_close: MUTATE — provider mobile only: opens the booking from a push notification, marks it paid, then marks the visit complete. Requires bookingId (inherit from lastPush). Triggers: from the notification mark paid and complete, open the push booking mark it paid and done. NOT push_confirm_check_in (confirms + checks in, not paid/complete).
- manager_floor_sweep: MUTATE — provider mobile only: manager/owner view — team floor status, then today's team unpaid list, then a payment sweep. Triggers: floor status then sweep team unpaid, check the floor and sweep unpaid appointments. NOT payment_sweep alone (no floor/unpaid context first).`;

const CHAIR_CLOSEOUT_CUE =
  /\b(finish|wrap\s+up|close\s+out|done\s+with)\b.{0,40}\b(mark(?:ed)?\s+paid|paid)\b|\bmark(?:ed)?\s+paid\b.{0,40}\b(finish|wrap\s+up|close\s+out)\b/i;

export function isChairCloseoutPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (!/\bpaid\b/i.test(lower)) return false;
  return (
    CHAIR_CLOSEOUT_CUE.test(prompt) ||
    (/\b(finish|wrap\s+up|close\s+out|done\s+with)\b/i.test(lower) &&
      /\bpaid\b/i.test(lower))
  );
}

export function isRunningLateNotifyPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const lateCue = /\b(running\s+)?late\b|\brunning\s+behind\b/i.test(lower);
  const notifyCue =
    /\b(text|message|notify|let\s+.{0,15}\s+know)\b/i.test(lower);
  return lateCue && notifyCue;
}

export function isGapWaitlistFillPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(fill|offer)\b/i.test(lower) &&
    /\bgap\b|\bopen\s+slot\b/i.test(lower) &&
    /\bwaitlist\b/i.test(lower)
  );
}

export function isCancelAndRecoverPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bcancel\b/i.test(lower) &&
    /\bwaitlist\b/i.test(lower) &&
    !/\bcancel\s+(?:my\s+)?time[\s-]?off\b/i.test(lower)
  );
}

export function isPreVisitBriefPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bbrief\s+me\b/i.test(lower) ||
    (/\b(full\s+rundown|catch\s+me\s+up)\b/i.test(lower) &&
      /\b(client|before|visit|appointment)\b/i.test(lower))
  );
}

export function isEndOfDayClosePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const wrapCue = /\b(wrap|close\s+out)\b.{0,20}\b(today|day|out)\b|\bend\s+of\s+day\b/i.test(
    lower,
  );
  const sweepCue = /\bpaid\b/i.test(lower) && /\bno[\s-]?shows?\b/i.test(lower);
  return wrapCue && sweepCue;
}

export function isRescheduleAndNotifyPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const moveCue =
    /\b(move|reschedule|push\s+(?:this|it|her|him|them)\s+(?:appointment|booking|visit)?)\b/i.test(
      lower,
    );
  const notifyCue =
    /\b(text|message|notify|let\s+.{0,15}\s+know)\b/i.test(lower);
  return moveCue && notifyCue;
}

export function isClinicDrawFlowPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(next\s+draw|start\s+my\s+next\s+draw|pull\s+the\s+next\s+collection)\b/i.test(
      lower,
    ) ||
    (/\bdraw\b/i.test(lower) &&
      /\bchart\b/i.test(lower) &&
      /\b(collect|collected)\b/i.test(lower))
  );
}

export function isPushConfirmCheckInPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(confirm)\b/i.test(lower) &&
    /\bpush\b/i.test(lower) &&
    /\bcheck(?:ed)?\s*(?:her|him|them)?\s*in\b/i.test(lower)
  );
}

export function isPendingConfirmDayPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bconfirm\b.{0,20}\bpending\b/i.test(lower) &&
    /\bsummar(?:y|ize)\b.{0,20}\b(today|day)\b|\btoday'?s?\s+rundown\b/i.test(
      lower,
    )
  );
}

export function isCheckInStartCompletePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const checkInCue = /\bcheck(?:ed)?\s*(?:her|him|them)?\s*in\b/i.test(lower);
  const startCue = /\bstart(?:ed)?\s+(?:the\s+)?(?:service|visit)?\b|\bin\s+progress\b/i.test(
    lower,
  );
  const completeCue = /\b(mark(?:ed)?\s+)?(done|complete(?:d)?)\b/i.test(lower);
  return checkInCue && startCue && completeCue;
}

export function isRetailCloseoutPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const upsellCue = /\b(recommend|suggest)\b.{0,20}\b(product|upsell)\b/i.test(
    lower,
  );
  const closeCue = /\bclose\b.{0,20}\b(cash|paid|payment)\b|\bmark\s+paid\b/i.test(
    lower,
  );
  return upsellCue && closeCue;
}

export function isGapWalkInBookPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bwalk[\s-]?in\b/i.test(lower) &&
    /\bbook\b/i.test(lower) &&
    /\bcheck(?:ed)?\s*(?:her|him|them)?\s*in\b|\bcheck\s+in\s+now\b/i.test(
      lower,
    )
  );
}

export function isNoShowRecoverPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bno[\s-]?shows?\b/i.test(lower) &&
    /\b(offer|waitlist|rebook|fill\s+it)\b/i.test(lower)
  );
}

export function isMultiServiceBriefPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(brief\s+me|walk\s+me\s+through)\b/i.test(lower) &&
    /\b(multi[\s-]?service|spa\s+day|package)\b/i.test(lower)
  );
}

export function isClinicDrawPatientPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (isClinicDrawFlowPrompt(prompt)) return false;
  return (
    /\b(find|look\s+up)\s+[A-Z]/i.test(prompt) &&
    /\bchart\b/i.test(lower) &&
    /\b(draw|specimen|collect(?:ed)?)\b/i.test(lower)
  );
}

export function isPushMarkPaidClosePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(notification|push)\b/i.test(lower) &&
    /\bpaid\b/i.test(lower) &&
    /\b(complete|done|closed?)\b/i.test(lower)
  );
}

export function isManagerFloorSweepPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bfloor\b/i.test(lower) &&
    /\bsweep\b/i.test(lower) &&
    /\bunpaid\b/i.test(lower)
  );
}

export function rescueProviderCompoundRecipeIntent(
  prompt: string,
  action: string,
): { action: ProviderCompoundRecipeIntent; rescueReason: string } | null {
  if (isProviderCompoundRecipeIntent(action)) return null;

  if (isPushConfirmCheckInPrompt(prompt)) {
    return { action: 'push_confirm_check_in', rescueReason: 'push_confirm_check_in' };
  }
  if (isCancelAndRecoverPrompt(prompt)) {
    return { action: 'cancel_and_recover', rescueReason: 'cancel_and_recover' };
  }
  if (isClinicDrawFlowPrompt(prompt)) {
    return { action: 'clinic_draw_flow', rescueReason: 'clinic_draw_flow' };
  }
  if (isClinicDrawPatientPrompt(prompt)) {
    return {
      action: 'clinic_draw_patient',
      rescueReason: 'clinic_draw_patient',
    };
  }
  if (isPushMarkPaidClosePrompt(prompt)) {
    return {
      action: 'push_mark_paid_close',
      rescueReason: 'push_mark_paid_close',
    };
  }
  if (isManagerFloorSweepPrompt(prompt)) {
    return {
      action: 'manager_floor_sweep',
      rescueReason: 'manager_floor_sweep',
    };
  }
  if (isPendingConfirmDayPrompt(prompt)) {
    return {
      action: 'pending_confirm_day',
      rescueReason: 'pending_confirm_day',
    };
  }
  if (isCheckInStartCompletePrompt(prompt)) {
    return {
      action: 'check_in_start_complete',
      rescueReason: 'check_in_start_complete',
    };
  }
  if (isRetailCloseoutPrompt(prompt)) {
    return { action: 'retail_closeout', rescueReason: 'retail_closeout' };
  }
  if (isGapWalkInBookPrompt(prompt)) {
    return { action: 'gap_walk_in_book', rescueReason: 'gap_walk_in_book' };
  }
  if (isNoShowRecoverPrompt(prompt)) {
    return { action: 'no_show_recover', rescueReason: 'no_show_recover' };
  }
  if (isEndOfDayClosePrompt(prompt)) {
    return { action: 'end_of_day_close', rescueReason: 'end_of_day_close' };
  }
  if (isGapWaitlistFillPrompt(prompt)) {
    return { action: 'gap_waitlist_fill', rescueReason: 'gap_waitlist_fill' };
  }
  if (isRescheduleAndNotifyPrompt(prompt)) {
    return {
      action: 'reschedule_and_notify',
      rescueReason: 'reschedule_and_notify',
    };
  }
  if (isRunningLateNotifyPrompt(prompt)) {
    return {
      action: 'running_late_notify',
      rescueReason: 'running_late_notify',
    };
  }
  if (isChairCloseoutPrompt(prompt)) {
    return { action: 'chair_closeout', rescueReason: 'chair_closeout' };
  }
  if (isMultiServiceBriefPrompt(prompt)) {
    return {
      action: 'multi_service_brief',
      rescueReason: 'multi_service_brief',
    };
  }
  if (isPreVisitBriefPrompt(prompt)) {
    return { action: 'pre_visit_brief', rescueReason: 'pre_visit_brief' };
  }

  return null;
}
