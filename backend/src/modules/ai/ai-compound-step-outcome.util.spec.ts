/**
 * AI-ROADMAP Phase 1 — per-step compound outcome attribution.
 *
 * The point of these rows is to split the 61.8% `compound_intent` failure rate
 * into causes that need different fixes. So the tests are written against the
 * shapes that rate is actually made of: a late step failing after earlier ones
 * wrote, a mid-compound clarify, and a sub-intent the decomposer named but
 * never planned.
 */
import {
  buildCompoundStepOutcomes,
  COMPOUND_STEP_DETAIL_KEY,
  extractCompoundStepRows,
  hasSilentlyDroppedStep,
  type BuildCompoundStepOutcomesInput,
} from './ai-compound-step-outcome.util.js';

function input(
  overrides: Partial<BuildCompoundStepOutcomesInput> = {},
): BuildCompoundStepOutcomesInput {
  return {
    actions: ['reschedule_booking', 'cancel_bookings'],
    planStepIdsByIndex: [['s1'], ['s2']],
    timeline: [
      { stepId: 's1', status: 'completed' },
      { stepId: 's2', status: 'completed' },
    ],
    succeeded: true,
    ...overrides,
  };
}

describe('buildCompoundStepOutcomes', () => {
  it('records one row per sub-intent, in decomposition order', () => {
    const rows = buildCompoundStepOutcomes(input());
    expect(rows.map((r) => [r.stepIndex, r.action, r.outcome])).toEqual([
      [0, 'reschedule_booking', 'executed'],
      [1, 'cancel_bookings', 'executed'],
    ]);
  });

  it('names the step that failed, not the compound', () => {
    // The whole reason this exists: "compound_intent failed" was the only fact
    // available for 380 calls.
    const rows = buildCompoundStepOutcomes(
      input({
        timeline: [
          { stepId: 's1', status: 'completed' },
          { stepId: 's2', status: 'failed', error: 'No slot available' },
        ],
        succeeded: false,
      }),
    );
    expect(rows[0].outcome).toBe('executed');
    expect(rows[1]).toMatchObject({
      action: 'cancel_bookings',
      outcome: 'failed',
      error: 'No slot available',
    });
  });

  it('attributes by plan step id, not by action name', () => {
    // "cancel Mary's and cancel John's" — two sub-intents, same action. Matching
    // on the action would blame the wrong one, or both.
    const rows = buildCompoundStepOutcomes({
      actions: ['cancel_bookings', 'cancel_bookings'],
      planStepIdsByIndex: [['s1'], ['s2']],
      timeline: [
        { stepId: 's1', status: 'completed' },
        { stepId: 's2', status: 'failed', error: 'Booking not found' },
      ],
      succeeded: false,
    });
    expect(rows.map((r) => r.outcome)).toEqual(['executed', 'failed']);
  });

  it('fails a sub-intent when any of its several steps failed', () => {
    const rows = buildCompoundStepOutcomes({
      actions: ['bulk_create_catalog'],
      planStepIdsByIndex: [['s1', 's2', 's3']],
      timeline: [
        { stepId: 's1', status: 'completed' },
        { stepId: 's2', status: 'failed', error: 'Duplicate service name' },
        { stepId: 's3', status: 'completed' },
      ],
      succeeded: false,
    });
    expect(rows[0]).toMatchObject({
      outcome: 'failed',
      error: 'Duplicate service name',
    });
  });

  describe('a mid-compound clarify', () => {
    const clarified = input({
      actions: ['reschedule_booking', 'create_booking', 'mark_paid'],
      planStepIdsByIndex: [['s1'], [], []],
      timeline: [{ stepId: 's1', status: 'completed' }],
      clarifiedAtIndex: 1,
      succeeded: false,
    });

    it('marks the asking step clarified and the rest skipped', () => {
      const rows = buildCompoundStepOutcomes(clarified);
      expect(rows.map((r) => r.outcome)).toEqual([
        'executed',
        'clarified',
        'skipped',
      ]);
    });

    it('does not count a single clarify as three failures', () => {
      const rows = buildCompoundStepOutcomes(clarified);
      expect(rows.filter((r) => r.outcome === 'failed')).toEqual([]);
    });
  });

  describe('a sub-intent that was never planned', () => {
    const dropped = input({
      actions: ['create_service_category', 'create_service'],
      planStepIdsByIndex: [['s1'], []],
      timeline: [{ stepId: 's1', status: 'completed' }],
      succeeded: true,
    });

    it('is recorded as not_planned rather than silently omitted', () => {
      // e2e-bug.347's shape: "create a category with these services" creates the
      // category and drops the services, while reporting success.
      const rows = buildCompoundStepOutcomes(dropped);
      expect(rows[1]).toMatchObject({
        action: 'create_service',
        outcome: 'not_planned',
        planStepIds: [],
      });
    });

    it('is distinguishable from a failure, because the fix is different', () => {
      const rows = buildCompoundStepOutcomes(dropped);
      expect(rows.map((r) => r.outcome)).not.toContain('failed');
    });
  });

  describe('when execution reported no step detail', () => {
    it('does not claim success for steps it cannot see', () => {
      const rows = buildCompoundStepOutcomes(
        input({ timeline: undefined, succeeded: false }),
      );
      expect(rows.map((r) => r.outcome)).toEqual(['failed', 'failed']);
    });

    it('trusts an overall success when there is nothing finer to go on', () => {
      const rows = buildCompoundStepOutcomes(
        input({ timeline: undefined, succeeded: true }),
      );
      expect(rows.map((r) => r.outcome)).toEqual(['executed', 'executed']);
    });
  });

  it('treats rejected and error statuses as failures too', () => {
    const rows = buildCompoundStepOutcomes(
      input({
        timeline: [
          { stepId: 's1', status: 'rejected', error: 'Policy violation' },
          { stepId: 's2', status: 'error', error: 'Timeout' },
        ],
        succeeded: false,
      }),
    );
    expect(rows.map((r) => r.outcome)).toEqual(['failed', 'failed']);
  });

  it('returns nothing for a compound with no sub-intents', () => {
    expect(
      buildCompoundStepOutcomes({
        actions: [],
        planStepIdsByIndex: [],
        succeeded: false,
      }),
    ).toEqual([]);
  });
});

describe('directOutcomes — the direct-dispatch path (e2e-bug.412)', () => {
  it('believes the caller over any inference', () => {
    // The customer compound loop calls each handler itself and holds every
    // CommandResult, so there is nothing to infer from and nothing to guess.
    const rows = buildCompoundStepOutcomes({
      actions: ['check_providers_for_service', 'book_nearest_slot'],
      planStepIdsByIndex: [],
      directOutcomes: ['executed', 'failed'],
      succeeded: false,
    });
    expect(rows.map((r) => r.outcome)).toEqual(['executed', 'failed']);
  });

  it('does not report a direct-dispatch step as never planned', () => {
    // The bug this guards. Empty `planStepIdsByIndex` means `not_planned` —
    // "the decomposer named it but no plan was built" — which is structurally
    // true for a path with no planner and semantically false. Left alone it
    // would fill `ai_command_compound_silent_drop` with compounds that dropped
    // nothing at all.
    const withDirect = buildCompoundStepOutcomes({
      actions: ['list_services', 'book_nearest_slot'],
      planStepIdsByIndex: [],
      directOutcomes: ['executed', 'executed'],
      succeeded: true,
    });
    expect(withDirect.every((r) => r.outcome !== 'not_planned')).toBe(true);

    const withoutDirect = buildCompoundStepOutcomes({
      actions: ['list_services', 'book_nearest_slot'],
      planStepIdsByIndex: [],
      succeeded: true,
    });
    expect(withoutDirect.every((r) => r.outcome === 'not_planned')).toBe(true);
  });

  it('records a question as clarified, not failed', () => {
    const rows = buildCompoundStepOutcomes({
      actions: ['book_nearest_slot', 'pay_online'],
      planStepIdsByIndex: [],
      directOutcomes: ['clarified', 'skipped'],
      succeeded: false,
    });
    expect(rows.map((r) => r.outcome)).toEqual(['clarified', 'skipped']);
  });

  it('does not slide later outcomes onto earlier steps when one is bad', () => {
    // The reason this is mapped rather than filtered. Filtering a bad first
    // entry would move step 2's real outcome onto step 1 — silently attributing
    // a failure to the wrong sub-intent, which is the one thing this table
    // exists to get right.
    const rows = extractCompoundStepRows({
      success: false,
      details: {
        _compoundSteps: {
          actions: ['list_services', 'book_nearest_slot'],
          planStepIdsByIndex: [],
          directOutcomes: [null, 'failed'],
        },
      },
    });
    expect(rows[0].action).toBe('list_services');
    expect(rows[0].outcome).toBe('not_planned');
    expect(rows[1].action).toBe('book_nearest_slot');
    expect(rows[1].outcome).toBe('failed');
  });

  it('drops malformed outcomes rather than writing rubbish rows', () => {
    // `details` is a loosely-typed bag a dozen handlers write into; every other
    // field here is re-validated for the same reason.
    const rows = extractCompoundStepRows({
      success: false,
      details: {
        _compoundSteps: {
          actions: ['a', 'b'],
          planStepIdsByIndex: [],
          directOutcomes: ['executed', 'not_a_real_outcome'],
        },
      },
    });
    expect(rows[0].outcome).toBe('executed');
    // Falls back to inference for the entry it could not trust.
    expect(rows[1].outcome).toBe('not_planned');
  });
});

describe('hasSilentlyDroppedStep', () => {
  it('flags a success that quietly skipped a sub-intent', () => {
    const rows = buildCompoundStepOutcomes(
      input({ planStepIdsByIndex: [['s1'], []], succeeded: true }),
    );
    expect(hasSilentlyDroppedStep(rows, true)).toBe(true);
  });

  it('does not flag a failure that reported itself honestly', () => {
    const rows = buildCompoundStepOutcomes(
      input({ planStepIdsByIndex: [['s1'], []], succeeded: false }),
    );
    expect(hasSilentlyDroppedStep(rows, false)).toBe(false);
  });

  it('does not flag a clean compound', () => {
    expect(
      hasSilentlyDroppedStep(buildCompoundStepOutcomes(input()), true),
    ).toBe(false);
  });
});

describe('extractCompoundStepRows', () => {
  const result = (details: Record<string, unknown>, success = true) => ({
    success,
    details,
  });

  it('reads attribution and timeline off a finished result', () => {
    const rows = extractCompoundStepRows(
      result(
        {
          [COMPOUND_STEP_DETAIL_KEY]: {
            actions: ['reschedule_booking', 'mark_paid'],
            planStepIdsByIndex: [['s1'], ['s2']],
          },
          executionTimeline: [
            { stepId: 's1', status: 'completed' },
            { stepId: 's2', status: 'failed', error: 'Card declined' },
          ],
        },
        false,
      ),
    );
    expect(rows.map((r) => [r.action, r.outcome])).toEqual([
      ['reschedule_booking', 'executed'],
      ['mark_paid', 'failed'],
    ]);
    expect(rows[1].error).toBe('Card declined');
  });

  it('returns nothing for a non-compound result', () => {
    expect(extractCompoundStepRows(result({ taskId: 't1' }))).toEqual([]);
    expect(extractCompoundStepRows({ success: true })).toEqual([]);
  });

  it('returns nothing rather than malformed rows when attribution is junk', () => {
    // `details` is a loosely-typed bag a dozen handlers write into. A bad entry
    // must produce no telemetry, not a row full of undefined.
    for (const bad of [
      null,
      'nope',
      42,
      {},
      { actions: 'reschedule' },
      { actions: [] },
    ]) {
      expect(
        extractCompoundStepRows(result({ [COMPOUND_STEP_DETAIL_KEY]: bad })),
      ).toEqual([]);
    }
  });

  it('ignores timeline entries that are not shaped like step results', () => {
    const rows = extractCompoundStepRows(
      result({
        [COMPOUND_STEP_DETAIL_KEY]: {
          actions: ['create_booking'],
          planStepIdsByIndex: [['s1']],
        },
        executionTimeline: [null, { stepId: 5 }, { status: 'failed' }],
      }),
    );
    // No usable entry for s1 → falls back to the compound's own verdict.
    expect(rows).toEqual([
      {
        stepIndex: 0,
        action: 'create_booking',
        outcome: 'executed',
        planStepIds: ['s1'],
        error: null,
      },
    ]);
  });

  it('carries a mid-compound clarify through from the details bag', () => {
    const rows = extractCompoundStepRows(
      result(
        {
          [COMPOUND_STEP_DETAIL_KEY]: {
            actions: ['reschedule_booking', 'create_booking'],
            planStepIdsByIndex: [['s1'], []],
            clarifiedAtIndex: 1,
          },
          executionTimeline: [{ stepId: 's1', status: 'completed' }],
        },
        false,
      ),
    );
    expect(rows.map((r) => r.outcome)).toEqual(['executed', 'clarified']);
  });

  it('is keyed under an underscore key so it never reaches the client', () => {
    expect(COMPOUND_STEP_DETAIL_KEY.startsWith('_')).toBe(true);
  });
});
