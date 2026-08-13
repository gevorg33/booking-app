import {
  CUSTOMER_REBOOK_LAST_APPOINTMENT_CLASSIFIER_RULES,
  REBOOK_LAST_APPOINTMENT_PROMPTS,
  REBOOK_LAST_APPOINTMENT_RESCUE_SCENARIOS,
} from './ai-rebook-last-appointment.fixtures.js';
import { REBOOK_LAST_APPOINTMENT_MULTILINGUAL_SCENARIOS } from './ai-rebook-last-appointment-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_REBOOK_LAST_APPOINTMENT_CASES } from './eval/ai-command-eval.cases.js';
import {
  detectRebookLastAppointmentAction,
  hasRebookLastAppointmentCoreCue,
  isRebookLastAppointmentIntent,
  parseRebookLastAppointmentFromPrompt,
  rescueRebookLastAppointmentIntent,
} from './ai-rebook-last-appointment.util.js';

describe('ai-rebook-last-appointment.util (ai-cmd-customer-4.4.8)', () => {
  it('exports classifier rules', () => {
    expect(CUSTOMER_REBOOK_LAST_APPOINTMENT_CLASSIFIER_RULES).toContain(
      'rebook_last_appointment',
    );
  });

  it.each(
    REBOOK_LAST_APPOINTMENT_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues misclassified rebook prompt %s', (_id, row) => {
    expect(
      rescueRebookLastAppointmentIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe(row.expectedAction);
  });

  it('parses optional service name from fixture prompts', () => {
    const withService = REBOOK_LAST_APPOINTMENT_PROMPTS.find(
      (row) => row.serviceName,
    );
    expect(parseRebookLastAppointmentFromPrompt(withService!.prompt)).toEqual({
      serviceName: withService!.serviceName,
    });
    expect(
      parseRebookLastAppointmentFromPrompt('Book another service'),
    ).toBeNull();
  });

  it('maps fixtures to eval cases', () => {
    expect(AI_COMMAND_EVAL_REBOOK_LAST_APPOINTMENT_CASES.length).toBe(
      REBOOK_LAST_APPOINTMENT_PROMPTS.length +
        REBOOK_LAST_APPOINTMENT_MULTILINGUAL_SCENARIOS.length +
        REBOOK_LAST_APPOINTMENT_RESCUE_SCENARIOS.length,
    );
  });
});

/**
 * D1 / e2e-bug.358 — the `same phone` carve-out in `hasPriorVisitCue`.
 *
 * Two `explain_guest_checkout_fields` corpus cases were stolen by
 * `rebook_last_appointment`: the weak fallback fires on `book` + `same`, and a
 * guest-checkout question says "book as a guest with the **same phone**". The
 * detector for `explain_guest_checkout_fields` was innocent — it returns the
 * right action and aspect for all four of its failing prompts; the steal
 * happened upstream, so tightening that detector would have changed nothing.
 *
 * The two sibling cases that already passed did so only because they say
 * "booking" (a noun), which `\bbook\b` does not match. That is an accident of
 * wording, not a distinction the code was drawing — which is why the fix
 * belongs here rather than in either detector.
 */
describe('D1 — "same <contact field>" is not a prior-visit cue', () => {
  it.each([
    'What happens when I book as a guest with the same phone as my profile?',
    'If I book as a guest and later log in with the same phone, do bookings merge?',
    'Can I book with the same email as my account?',
    // Paraphrases. The first version of this fix blacklisted contact nouns and
    // repaired only the two corpus prompts — every line below was still stolen.
    // A blacklist chases an open-ended set; these pin the generalisation.
    'What happens when I book as a guest with the same cell as my profile?',
    'What happens when I book as a guest with the same telephone as my profile?',
    'Can I book with the same login as my account?',
    'Can I book with the same credentials as my account?',
    'If I book as a guest using the same account, do bookings merge?',
    'Will bookings merge if I book with the same WhatsApp as my profile?',
    'Do I book with the same identity I signed up with?',
    'If I book as a guest with the same name, does it link to my profile?',
  ])('does not claim guest-checkout question: %s', (prompt) => {
    expect(hasRebookLastAppointmentCoreCue(prompt)).toBe(false);
  });

  it.each([
    ['Book the same haircut as last time', 'last'],
    ['Book the same service again', 'again'],
    ['Rebook my last appointment', 'explicit rebook'],
    ['Book the same service', 'bare "same" still counts'],
    ['Book the same service again with the same phone', 'again outranks the carve-out'],
    ['Book the same appointment', 'appointment'],
    ['Book the same time slot', 'time'],
    ['Book me the same as before', '"same as" with no noun'],
    ['Book the same treatment', 'treatment'],
  ])('still claims genuine rebook (%s — %s)', (prompt) => {
    expect(hasRebookLastAppointmentCoreCue(prompt)).toBe(true);
  });

  it('leaves stylist-only picks to provider-pick, as STYLIST_ONLY_PICK_BLOCK intends', () => {
    // Not a regression from the whitelist: this returns false at the top of the
    // function, before any prior-visit reasoning. Pinned because "same stylist"
    // reads like a rebook cue and a future edit might well add it.
    expect(hasRebookLastAppointmentCoreCue('Book the same stylist')).toBe(false);
    // Pre-existing and NOT caused by the whitelist: "Rebook the same stylist as
    // last time" is also false, because `\bbook\b` does not match "Rebook" and
    // neither explicit cue covers this shape (they want `rebook…last` or the
    // literal "same as last"). Pinned as current behaviour, not as desired
    // behaviour — see e2e-bug.450.
    expect(
      hasRebookLastAppointmentCoreCue('Rebook the same stylist as last time'),
    ).toBe(false);
  });
});
