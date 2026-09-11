import { PLAN_FIXTURES } from './ai-command-plan.fixtures.js';
import type { CommandPlan, PlanStep } from './ai-command-plan.types.js';
import {
  describePlanClarification,
  validatePlan,
} from './ai-command-plan.validate.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';

const fixture = (id: string) => {
  const f = PLAN_FIXTURES.find((x) => x.id === id);
  if (!f) throw new Error(`missing fixture ${id}`);
  return f;
};

const step = (over: Partial<PlanStep> = {}): PlanStep => ({
  id: 's1',
  command: 'appointment.reschedule',
  // `bookingId` + `date` + `timeSlot`, not the `appointmentId`/`newStart` this
  // used to carry: neither of those is read by any handler (tech-debt A6).
  variables: { bookingId: 'apt-1', date: '2026-08-04', timeSlot: '15:00' },
  confidence: 0.9,
  dependsOn: [],
  ...over,
});

const plan = (
  steps: PlanStep[],
  over: Partial<CommandPlan> = {},
): CommandPlan => ({
  steps,
  unresolved: [],
  topicChanged: false,
  ...over,
});

describe('AI-ROADMAP Phase 3 — plan validation', () => {
  describe('golden fixtures', () => {
    it.each(PLAN_FIXTURES.map((f) => [f.id, f] as const))(
      '%s reaches the expected verdict',
      (_id, f) => {
        const result = validatePlan(COMMAND_SPECS, f.plan, f.surface, f.tier);
        expect(result.executable).toBe(f.expectExecutable);
      },
    );
  });

  describe('the headline multi-command example', () => {
    const f = fixture('headline-three-commands-one-unsupported');
    const result = validatePlan(COMMAND_SPECS, f.plan, f.surface, f.tier);

    it('extracts three separate commands from one message', () => {
      expect(f.plan.steps).toHaveLength(3);
    });

    it('accepts the two commands the platform actually has', () => {
      const rejected = result.problems.map((p) => p.stepId);
      expect(rejected).not.toContain('s1');
      expect(rejected).not.toContain('s2');
    });

    it('refuses the unsupported one instead of approximating it', () => {
      // A fuzzy matcher would happily steal "create a new patient named David"
      // to `update_customer` (mutating a real person) or `appointment.create`.
      expect(result.problems).toContainEqual({
        code: 'unknown_command',
        stepId: 's3',
        command: 'patient.create',
        details: ['patient.create'],
      });
    });

    it('executes nothing when any step is invalid', () => {
      expect(result.executable).toBe(false);
    });

    it('says what it cannot do, by name', () => {
      expect(describePlanClarification(result, f.plan)).toContain(
        'patient.create',
      );
    });
  });

  describe('dependency handling', () => {
    it('orders dependent steps after their prerequisites', () => {
      const f = fixture('dependent-steps-with-output-reference');
      const result = validatePlan(COMMAND_SPECS, f.plan, f.surface, f.tier);
      expect(result.executable).toBe(true);
      expect(result.orderedStepIds).toEqual(['s1', 's2']);
    });

    it("keeps the user's stated order for independent steps", () => {
      const f = fixture('multi-command-all-supported');
      const result = validatePlan(COMMAND_SPECS, f.plan, f.surface, f.tier);
      expect(result.orderedStepIds).toEqual(['s1', 's2', 's3']);
    });

    it('accepts a $ref to a later-resolved value without type-checking it yet', () => {
      const p = plan([
        step({
          id: 's1',
          command: 'catalog.create_category',
          variables: { categoryName: 'X' },
        }),
        step({
          id: 's2',
          command: 'catalog.assign_services_category_bulk',
          variables: { serviceNames: ['A'], categoryName: '$s1.categoryName' },
          dependsOn: ['s1'],
        }),
      ]);
      expect(
        validatePlan(COMMAND_SPECS, p, 'dashboard', 'owner').executable,
      ).toBe(true);
    });

    it('rejects a $ref to a step that is not in the plan', () => {
      const p = plan([
        step({
          command: 'catalog.assign_services_category_bulk',
          variables: { serviceNames: ['A'], categoryName: '$s9.categoryName' },
        }),
      ]);
      const result = validatePlan(COMMAND_SPECS, p, 'dashboard', 'owner');
      expect(result.problems.map((x) => x.code)).toContain(
        'dangling_dependency',
      );
      expect(result.executable).toBe(false);
    });

    it('detects a dependency cycle before anything runs', () => {
      const p = plan([
        step({ id: 's1', dependsOn: ['s2'] }),
        step({ id: 's2', dependsOn: ['s1'] }),
      ]);
      const result = validatePlan(COMMAND_SPECS, p, 'dashboard', 'owner');
      expect(result.problems.map((x) => x.code)).toContain('dependency_cycle');
      expect(result.executable).toBe(false);
    });

    it('rejects duplicate step ids', () => {
      const result = validatePlan(
        COMMAND_SPECS,
        plan([step({ id: 's1' }), step({ id: 's1' })]),
        'dashboard',
        'owner',
      );
      expect(result.problems.map((x) => x.code)).toContain('duplicate_step_id');
    });
  });

  describe('the steal guard', () => {
    it('rejects a command that is not legal on this surface', () => {
      const f = fixture('surface-violation-customer-command-on-dashboard');
      const result = validatePlan(COMMAND_SPECS, f.plan, f.surface, f.tier);
      expect(result.problems[0]).toMatchObject({
        code: 'surface_violation',
        command: 'appointment.cancel_mine',
      });
      expect(result.executable).toBe(false);
    });

    it('accepts the same command on the surface it belongs to', () => {
      const f = fixture('surface-violation-customer-command-on-dashboard');
      expect(
        validatePlan(COMMAND_SPECS, f.plan, 'customer', 'client').executable,
      ).toBe(true);
    });

    it('never substitutes a different command for an unknown one', () => {
      const result = validatePlan(
        COMMAND_SPECS,
        plan([step({ command: 'appointment.reschedul' })]), // typo
        'dashboard',
        'owner',
      );
      expect(result.problems.map((p) => p.code)).toEqual(['unknown_command']);
      expect(result.executable).toBe(false);
    });
  });

  describe('variables', () => {
    it('names the missing variable rather than failing generically', () => {
      const f = fixture('missing-required-variable');
      const result = validatePlan(COMMAND_SPECS, f.plan, f.surface, f.tier);
      expect(result.problems).toContainEqual({
        code: 'missing_variables',
        stepId: 's1',
        command: 'appointment.create',
        details: ['date'],
      });
      expect(describePlanClarification(result, f.plan)).toContain('date');
    });

    it('reports a hallucinated param but does not block on it', () => {
      const p = plan([
        step({
          variables: {
            bookingId: 'a',
            date: '2026-08-04',
            timeSlot: '15:00',
            templateName: 'Standard Mon-Fri',
          },
        }),
      ]);
      const result = validatePlan(COMMAND_SPECS, p, 'dashboard', 'owner');
      expect(result.problems.map((x) => x.code)).toContain('unknown_variables');
      expect(result.executable).toBe(true);
    });
  });

  describe('confidence and ambiguity', () => {
    it('refuses to execute a low-confidence step', () => {
      const result = validatePlan(
        COMMAND_SPECS,
        plan([step({ confidence: 0.3 })]),
        'dashboard',
        'owner',
      );
      expect(result.problems.map((x) => x.code)).toContain('low_confidence');
      expect(result.executable).toBe(false);
    });

    it('blocks execution while any entity is unresolved', () => {
      const f = fixture('unresolved-entity-blocks-execution');
      const result = validatePlan(COMMAND_SPECS, f.plan, f.surface, f.tier);
      expect(result.executable).toBe(false);
      expect(describePlanClarification(result, f.plan)).toContain('Which');
    });
  });

  describe('risk and confirmation', () => {
    it('reports the highest risk tier in the plan', () => {
      const result = validatePlan(
        COMMAND_SPECS,
        plan([
          step({ id: 's1', command: 'catalog.list_packages', variables: {} }),
          step({
            id: 's2',
            command: 'appointment.mark_paid',
            variables: { bookingId: 'a' },
          }),
        ]),
        'dashboard',
        'owner',
      );
      expect(result.highestRisk).toBe('T2');
    });

    it('requires confirmation when any step is money or bulk', () => {
      expect(
        validatePlan(
          COMMAND_SPECS,
          plan([
            step({
              command: 'appointment.mark_paid',
              variables: { bookingId: 'a' },
            }),
          ]),
          'dashboard',
          'owner',
        ).requiresConfirmation,
      ).toBe(true);
    });

    it('does not require confirmation for a plan of reads', () => {
      const result = validatePlan(
        COMMAND_SPECS,
        plan([step({ command: 'catalog.list_packages', variables: {} })]),
        'dashboard',
        'owner',
      );
      expect(result.requiresConfirmation).toBe(false);
      expect(result.highestRisk).toBe('T0');
      expect(result.executable).toBe(true);
    });
  });

  describe('describePlanClarification', () => {
    it('returns null for an executable plan', () => {
      const f = fixture('multi-command-all-supported');
      const result = validatePlan(COMMAND_SPECS, f.plan, f.surface, f.tier);
      expect(describePlanClarification(result, f.plan)).toBeNull();
    });
  });
});

describe('e2e-bug.384 — a zero-step plan is not executable', () => {
  const empty = (unresolved: string[]) => ({
    steps: [],
    unresolved,
    topicChanged: false,
  });

  it('refuses an empty plan that says nothing', () => {
    // The silent case. This used to validate as EXECUTABLE, so it fell through
    // to the caller's command comparison and was scored as though the planner
    // had chosen a wrong command — which inflated the measured wrong-command
    // rate from 6% to 42% across §70-§79.
    const v = validatePlan(COMMAND_SPECS, empty([]), 'dashboard', 'owner');
    expect(v.executable).toBe(false);
    expect(v.problems.map((p) => p.code)).toContain('empty_plan');
  });

  it('refuses an empty plan that explains itself', () => {
    const v = validatePlan(
      COMMAND_SPECS,
      empty(['could not map this request']),
      'dashboard',
      'owner',
    );
    expect(v.executable).toBe(false);
    expect(v.problems.map((p) => p.code)).toContain('empty_plan');
  });

  it('agrees with the executor, which already refused these', () => {
    // `executePlan` returns "Plan has no steps". Validation now says the same,
    // so the two cannot disagree about the same plan.
    const v = validatePlan(COMMAND_SPECS, empty([]), 'dashboard', 'owner');
    expect(v.executable).toBe(false);
  });

  it('does not flag a plan that has steps', () => {
    const v = validatePlan(
      COMMAND_SPECS,
      {
        steps: [
          {
            id: 's1',
            command: 'appointment.cancel_bulk',
            variables: { customerName: 'Mary' },
            confidence: 0.95,
            dependsOn: [],
          },
        ],
        unresolved: [],
        topicChanged: false,
      },
      'dashboard',
      'owner',
    );
    expect(v.problems.map((p) => p.code)).not.toContain('empty_plan');
  });

  describe('e2e-bug.389 - unresolved notes block only what they should', () => {
    const step = (command: string, variables = {}): PlanStep => ({
      id: 's1',
      command,
      variables,
      confidence: 0.95,
      dependsOn: [],
    });
    const planWith = (
      steps: PlanStep[],
      unresolved: string[],
    ): CommandPlan => ({
      steps,
      unresolved,
      topicChanged: false,
    });

    it('a pure read executes despite an unresolved note', () => {
      // The case from the tour/guide slice: "list upcoming tour departures with
      // pax and remaining capacity" routes correctly and cannot express "pax".
      const v = validatePlan(
        COMMAND_SPECS,
        planWith(
          [step('tour.list_upcoming_departures')],
          ['pax and remaining capacity'],
        ),
        'dashboard',
        'owner',
      );
      expect(v.highestRisk).toBe('T0');
      expect(v.executable).toBe(true);
    });

    it('names the note in problems even when it does not block', () => {
      // The old behaviour recorded nothing at all, so a refusal had no reason
      // and a caveat was invisible.
      const v = validatePlan(
        COMMAND_SPECS,
        planWith([step('tour.list_upcoming_departures')], ['pax']),
        'dashboard',
        'owner',
      );
      expect(v.problems.map((p) => p.code)).toContain('unresolved_notes');
      expect(
        v.problems.find((p) => p.code === 'unresolved_notes')?.details,
      ).toEqual(['pax']);
    });

    it('says nothing when there is nothing unresolved', () => {
      const v = validatePlan(
        COMMAND_SPECS,
        planWith([step('tour.list_upcoming_departures')], []),
        'dashboard',
        'owner',
      );
      expect(v.problems.map((p) => p.code)).not.toContain('unresolved_notes');
      expect(v.executable).toBe(true);
    });

    it('a plan that needs confirmation still blocks', () => {
      // Acting on a partial reading of a message that changes something is
      // exactly what Phase 6's clarify exists to prevent.
      const spec = COMMAND_SPECS.find(
        (sp) => sp.confirm === 'always' && sp.risk !== 'T0',
      );
      expect(spec).toBeDefined();
      if (!spec) return;
      const v = validatePlan(
        COMMAND_SPECS,
        planWith([step(spec.id)], ['the second thing you asked for']),
        spec.surfaces[0],
        (spec.tiers[spec.surfaces[0]] ?? ['owner'])[0],
      );
      expect(v.executable).toBe(false);
      expect(v.problems.map((p) => p.code)).toContain('unresolved_notes');
    });

    it('a blocked plan still asks about the unresolved part', () => {
      const spec = COMMAND_SPECS.find(
        (sp) => sp.confirm === 'always' && sp.risk !== 'T0',
      );
      if (!spec) return;
      const plan = planWith(
        [step(spec.id)],
        ['the second thing you asked for'],
      );
      const v = validatePlan(
        COMMAND_SPECS,
        plan,
        spec.surfaces[0],
        (spec.tiers[spec.surfaces[0]] ?? ['owner'])[0],
      );
      const question = describePlanClarification(v, plan);
      expect(question).toContain('the second thing you asked for');
    });

    it('an executable read produces no clarifying question', () => {
      const plan = planWith([step('tour.list_upcoming_departures')], ['pax']);
      const v = validatePlan(COMMAND_SPECS, plan, 'dashboard', 'owner');
      expect(describePlanClarification(v, plan)).toBeNull();
    });

    it('an unresolved note cannot rescue a plan that is broken anyway', () => {
      const v = validatePlan(
        COMMAND_SPECS,
        planWith([step('patient.create')], ['something']),
        'dashboard',
        'owner',
      );
      expect(v.executable).toBe(false);
      expect(v.problems.map((p) => p.code)).toContain('unknown_command');
    });
  });
});
