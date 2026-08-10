/**
 * AI-ROADMAP Phase 8 — the per-domain rescue lock, and the measurement behind it.
 *
 * Phase 8's exit is "rescue cannot alter `action`", unqualified. The guard as
 * shipped in §22 only blocks changes that touch a *mutating* command. Measuring
 * `ai_command_trace` against the now-complete spec registry (696/696, §66) says
 * what that leaves through:
 *
 * | action changes | count |
 * |---|---|
 * | total | 307 |
 * | touching a mutation (already blocked) | 75 |
 * | **read → read (currently allowed)** | **105** |
 * | starting from a non-decision (correctly allowed) | 53 |
 * | involving a pipeline pseudo-action outside the registry | 74 |
 *
 * The 105 are real steals — `list_services` → `explain_clinic_services` happens
 * 20 times, `list_upcoming_tour_departures` → `list_tour_calendar_week` 34.
 * Both change what the user is shown.
 */
import {
  evaluateRescueActionChange,
  GRANDFATHERED_MUTATING_RESCUES,
  RESCUE_ACTION_LOCKED_DOMAINS,
} from './ai-rescue-steal-guard.js';
import { RETIRED_DETECTOR_DOMAINS } from './ai-planner-route.util.js';

describe('RESCUE_ACTION_LOCKED_DOMAINS', () => {
  it('contains exactly the domains the planner has taken over', () => {
    // Was `toEqual([])` until 2026-08-08, on the stated grounds that "the
    // planner is still shadow-only, so rescue compensates for classifier
    // mistakes as well as causing them". §90 gave the planner an execution path
    // and §92 measured it recovering 33 of the 34 rescue-dependent tour/guide
    // traces, so that premise no longer holds for these two.
    //
    // Pinned as an exact list rather than a length: a domain arriving here
    // without its own §92-style measurement is the failure this ratchet exists
    // to catch, and `toContain` would wave it through.
    expect([...RESCUE_ACTION_LOCKED_DOMAINS].sort()).toEqual(['guide', 'tour']);
  });

  it('locks exactly the domains the planner is allowed to route', () => {
    // The two lists are one decision. A locked domain the planner cannot route
    // loses its traffic; a routed domain that is not locked leaves rescue free
    // to overrule the planner, which is the slice not actually being retired.
    expect([...RESCUE_ACTION_LOCKED_DOMAINS].sort()).toEqual(
      [...RETIRED_DETECTOR_DOMAINS].sort(),
    );
  });

  it('is the ratchet that reaches the Phase 8 exit', () => {
    // Exit condition: every domain locked AND no grandfathered mutating rescue.
    // Asserting both here keeps the two halves visible in one place.
    // Half of the exit is already met and has been since §67: nothing is
    // grandfathered. The other half is this list growing to cover every domain,
    // one measured slice at a time — 2 of 16 as of §93.
    expect(RESCUE_ACTION_LOCKED_DOMAINS.length).toBeGreaterThan(0);
    expect(GRANDFATHERED_MUTATING_RESCUES).toEqual([]);
  });
});

describe('a locked domain forbids any action change', () => {
  const lockedInput = {
    classifiedAction: 'list_services',
    rescuedAction: 'explain_clinic_services',
    domain: 'catalog',
  };

  it('blocks a read→read change when the domain IS locked', () => {
    // The 20-occurrence `list_services` → `explain_clinic_services` steal.
    const decision = evaluateRescueActionChange({
      ...lockedInput,
      lockedDomains: ['catalog'],
    });
    expect(decision.blocked).toBe(true);
    expect(decision.reason).toBe('domain_locked');
  });

  it('allows that same change while the domain is unlocked', () => {
    // `catalog` is not locked yet, so this is still today's behaviour for the
    // 14 domains that have not been through a §92-style measurement.
    const decision = evaluateRescueActionChange(lockedInput);
    expect(decision.blocked).toBe(false);
    expect(decision.reason).toBe('read_only_change');
  });

  it('locks only the named domain, not every domain', () => {
    const other = evaluateRescueActionChange({
      classifiedAction: 'list_bookings',
      rescuedAction: 'summarize_bookings',
      domain: 'operations',
      lockedDomains: ['catalog'],
    });
    expect(other.blocked).toBe(false);
  });

  it('still blocks a mutating steal regardless of the lock list', () => {
    // The stronger rule does not depend on the new one.
    const decision = evaluateRescueActionChange({
      classifiedAction: 'update_bookings',
      rescuedAction: 'mark_paid',
    });
    expect(decision.blocked).toBe(true);
    expect(decision.reason).toBe('mutating_action_steal');
  });

  it('leaves a caller that cannot determine the domain on old behaviour', () => {
    // An absent domain must not accidentally lock everything.
    const decision = evaluateRescueActionChange({
      classifiedAction: 'list_services',
      rescuedAction: 'explain_clinic_services',
    });
    expect(decision.blocked).toBe(false);
  });

  it('never blocks when the classifier had no decision', () => {
    // 53 of the 307 changes start from `unknown`. Nothing was stolen.
    expect(
      evaluateRescueActionChange({
        classifiedAction: 'unknown',
        rescuedAction: 'list_products',
        domain: 'catalog',
      }).blocked,
    ).toBe(false);
  });

  it('never blocks a no-op', () => {
    expect(
      evaluateRescueActionChange({
        classifiedAction: 'list_services',
        rescuedAction: 'list_services',
        domain: 'catalog',
      }).reason,
    ).toBe('no_action_change');
  });
});
