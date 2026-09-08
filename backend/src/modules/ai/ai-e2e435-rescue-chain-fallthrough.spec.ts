/**
 * e2e-bug.435 — a wrong-surface rescue must not end the chain.
 *
 * The pipeline is first-match-wins: each phase returns its first hit, and
 * `acceptRescueForSurface` then discards it if the action is illegal here. The
 * hazard the ticket names is that a discarded hit leaves the user with
 * **nothing**, even though a surface-appropriate rescue sat further down.
 *
 * One case is already handled — a wrong-surface *classified* hit falls through
 * to the unknown phase (e2e-bug.77) — but that behaviour lives in a bare `if`
 * with no test, so it would regress silently. These pin it.
 *
 * **They deliberately do not attempt the general fix.** Making all ~163 rescue
 * sites surface-aware is a large refactor, and pinning what exists is
 * proportionate.
 *
 * **Correction (e2e-bug.531, §251) — the "zero instances" claim below was
 * wrong, and the corpus was the wrong instrument for it.** This block used to
 * argue that the failure mode "does not currently occur", citing the 8,464-case
 * deterministic corpus. A real instance was then found by hand: on the provider
 * surface, `Ինչու չեմ կարող խմբագրել հաղորդագրության ձևանմուշները` matched
 * `explain_public_intake_form` (illegal there), was discarded by
 * `acceptRescueForSurface`, and the correct `explain_dashboard_only_action`
 * rescue — sitting *later in the same phase* — was never reached, so the
 * provider received no answer at all.
 *
 * Two things that argument got wrong. The corpus does not cover the provider
 * surface's Armenian handoff prompts, so "zero in the corpus" was never
 * evidence of zero. And the pipeline's fallthrough is **between phases**: a
 * wrong-surface hit inside the provider phase still returns from that phase, so
 * a later rescue in the *same* phase is shadowed regardless. The root cause was
 * fixed at the detector, but the shadowing shape remains real.
 */
import { runIntentRescuePipeline } from './ai-intent-rescue-pipeline.util.js';

const hit = (action: string) =>
  ({ action, params: {}, reasoning: '', rescued: true }) as any;

const host = (phases: {
  provider?: any;
  classified?: any;
  unknown?: any;
}) =>
  ({
    runRescueProviderPhase: () => phases.provider ?? null,
    runRescueClassifiedPhase: () => phases.classified ?? null,
    runRescueUnknownPhase: () => phases.unknown ?? null,
  }) as any;

const run = (h: any, action: string, surface: any) =>
  runIntentRescuePipeline(h, { prompt: 'p', action, params: {}, surface });

describe('e2e-bug.435 — the chain does not stop at a wrong-surface hit', () => {
  it('falls through to the unknown phase when a classified hit is wrong-surface', () => {
    // `my_gift_cards` is customer-only, so on dashboard it is discarded; the
    // unknown phase must still get its turn.
    const out = run(
      host({ classified: hit('my_gift_cards'), unknown: hit('list_bookings') }),
      'some_action',
      'dashboard',
    );
    expect(out?.action).toBe('list_bookings');
  });

  it('returns the classified hit when it IS legal here', () => {
    const out = run(
      host({ classified: hit('list_bookings'), unknown: hit('booking_help') }),
      'some_action',
      'dashboard',
    );
    expect(out?.action).toBe('list_bookings');
  });

  it('stops when the classified phase found nothing at all', () => {
    // Deliberate and different from the case above: a classified action that no
    // classified rescue claims should not be reinterpreted by unknown-phase
    // rescues, which exist for genuinely unknown actions.
    const out = run(
      host({ classified: null, unknown: hit('booking_help') }),
      'some_action',
      'dashboard',
    );
    expect(out).toBeNull();
  });

  it('still yields nothing when the unknown hit is also wrong-surface', () => {
    // The residual hazard, pinned as current behaviour rather than desired:
    // both candidates are illegal here, so the user gets nothing.
    const out = run(
      host({ classified: hit('my_gift_cards'), unknown: hit('my_subscriptions') }),
      'some_action',
      'dashboard',
    );
    expect(out).toBeNull();
  });
});
