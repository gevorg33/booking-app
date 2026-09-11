/**
 * AI-ROADMAP Phase 3 — steal guard rule.
 *
 * The cases below are taken from real `ai_command_trace` rows, not invented.
 */
import {
  evaluateRescueActionChange,
  describeBlockedSteal,
  GRANDFATHERED_MUTATING_RESCUES,
} from './ai-rescue-steal-guard.js';

describe('evaluateRescueActionChange', () => {
  describe('blocks real production steals', () => {
    // Each row: [classified, rescued, occurrences in production]
    const STEALS: Array<[string, string, number]> = [
      ['bulk_create_catalog', 'create_service_category', 16], // e2e-bug.347
      ['update_bookings', 'mark_paid', 11],
      ['create_service', 'create_employee', 3],
      ['create_booking', 'create_employee', 2],
      ['adjust_gift_card_balance', 'validate_gift_card', 2],
      ['create_service_category', 'import_services_from_menu', 2],
    ];

    it.each(STEALS)(
      '%s → %s (%i traces) is blocked',
      (classifiedAction, rescuedAction) => {
        const decision = evaluateRescueActionChange({
          classifiedAction,
          rescuedAction,
          rescueReason: 'some_detector',
        });
        expect(decision).toEqual({
          blocked: true,
          reason: 'mutating_action_steal',
        });
      },
    );
  });

  it('leaves rescue free to resolve an unknown — that is its real job', () => {
    for (const classifiedAction of [
      'unknown',
      'clarify',
      '',
      null,
      undefined,
    ]) {
      expect(
        evaluateRescueActionChange({
          classifiedAction,
          rescuedAction: 'create_booking',
          rescueReason: 'create_booking_pattern',
        }),
      ).toEqual({ blocked: false, reason: 'classifier_had_no_decision' });
    }
  });

  it('does not fire when rescue agrees with the classifier', () => {
    expect(
      evaluateRescueActionChange({
        classifiedAction: 'mark_paid',
        rescuedAction: 'mark_paid',
      }),
    ).toEqual({ blocked: false, reason: 'no_action_change' });
  });

  it('ignores whitespace differences rather than treating them as a change', () => {
    expect(
      evaluateRescueActionChange({
        classifiedAction: ' mark_paid ',
        rescuedAction: 'mark_paid',
      }).blocked,
    ).toBe(false);
  });

  it('leaves read-only → read-only changes alone (wrong, but harmless)', () => {
    // 111 production traces look like this. They retire with their detectors
    // in Phase 8; blocking them now would break evals for no safety gain.
    expect(
      evaluateRescueActionChange({
        classifiedAction: 'list_upcoming_tour_departures',
        rescuedAction: 'list_tour_calendar_week',
        rescueReason: 'list_tour_calendar_week',
      }),
    ).toEqual({ blocked: false, reason: 'read_only_change' });
  });

  it('blocks in both directions — a write must not become a read either', () => {
    // The user asked to change money and got a lookup: still the wrong command.
    expect(
      evaluateRescueActionChange({
        classifiedAction: 'adjust_gift_card_balance',
        rescuedAction: 'summarize_bookings',
      }).blocked,
    ).toBe(true);
    expect(
      evaluateRescueActionChange({
        classifiedAction: 'summarize_bookings',
        rescuedAction: 'adjust_gift_card_balance',
      }).blocked,
    ).toBe(true);
  });

  it('honours the grandfather allowlist by exact reason', () => {
    const [grandfathered] = GRANDFATHERED_MUTATING_RESCUES;
    if (!grandfathered) {
      // Empty list is the goal state; nothing to assert beyond that.
      expect(GRANDFATHERED_MUTATING_RESCUES).toHaveLength(0);
      return;
    }
    expect(
      evaluateRescueActionChange({
        classifiedAction: 'summarize_bookings',
        rescuedAction: 'mark_paid',
        rescueReason: grandfathered,
      }),
    ).toEqual({ blocked: false, reason: 'grandfathered' });
  });

  it('does not grandfather an unnamed rescue', () => {
    expect(
      evaluateRescueActionChange({
        classifiedAction: 'summarize_bookings',
        rescuedAction: 'mark_paid',
      }).blocked,
    ).toBe(true);
  });

  it('is pure — repeated calls give the same answer', () => {
    const input = {
      classifiedAction: 'bulk_create_catalog',
      rescuedAction: 'create_service_category',
    };
    expect(evaluateRescueActionChange(input)).toEqual(
      evaluateRescueActionChange(input),
    );
  });
});

describe('describeBlockedSteal', () => {
  it('names both sides and the reason so a trace can be triaged', () => {
    const detail = describeBlockedSteal({
      classifiedAction: 'bulk_create_catalog',
      rescuedAction: 'create_service_category',
      rescueReason: 'service_category',
      decision: { blocked: true, reason: 'mutating_action_steal' },
    });
    expect(detail).toContain('bulk_create_catalog');
    expect(detail).toContain('create_service_category');
    expect(detail).toContain('service_category');
    expect(detail).toContain('params kept');
  });

  it('says so explicitly when the rescue has no name', () => {
    expect(
      describeBlockedSteal({
        classifiedAction: 'create_service',
        rescuedAction: 'create_employee',
        decision: { blocked: true, reason: 'mutating_action_steal' },
      }),
    ).toContain('reason=unnamed');
  });
});

/**
 * The ratchet. `GRANDFATHERED_MUTATING_RESCUES` is an escape hatch, and escape
 * hatches grow unless something stops them.
 *
 * It is empty today — verified by running the full unit and eval suites with
 * the guard active and diffing the failure lists against a stashed baseline:
 * byte-identical. Not one rescue in the corpus needs to steal a mutating
 * command. Anything added here is a regression in the roadmap's direction, so
 * this number may only go down.
 */
describe('grandfather allowlist ratchet', () => {
  const CEILING = 0;

  it(`has at most ${CEILING} entries`, () => {
    expect(GRANDFATHERED_MUTATING_RESCUES.length).toBeLessThanOrEqual(CEILING);
  });

  it('contains no duplicates', () => {
    expect(new Set(GRANDFATHERED_MUTATING_RESCUES).size).toBe(
      GRANDFATHERED_MUTATING_RESCUES.length,
    );
  });
});
