import {
  buildPlanTraceFields,
  EMPTY_PLAN_TRACE_FIELDS,
} from './ai-command-plan.trace.js';
import type { PlanOutcome } from './ai-command-planner.service.js';
import { validatePlan } from './ai-command-plan.validate.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { PLAN_FIXTURES } from './ai-command-plan.fixtures.js';
import { buildAiCommandTraceRow } from './ai-command-trace.util.js';

const outcomeFor = (fixtureId: string): PlanOutcome => {
  const f = PLAN_FIXTURES.find((x) => x.id === fixtureId)!;
  const validation = validatePlan(COMMAND_SPECS, f.plan, f.surface, f.tier);
  return validation.executable
    ? { status: 'executable', plan: f.plan, validation, repairs: [] }
    : {
        status: 'clarify',
        plan: f.plan,
        validation,
        question: 'q',
        repairs: [],
      };
};

describe('AI-ROADMAP Phase 3 — plan telemetry', () => {
  describe('buildPlanTraceFields', () => {
    it('returns all-null for a legacy (non-planner) row', () => {
      expect(buildPlanTraceFields(undefined)).toEqual(EMPTY_PLAN_TRACE_FIELDS);
      expect(buildPlanTraceFields(null)).toEqual(EMPTY_PLAN_TRACE_FIELDS);
    });

    it('records the shape of a multi-command plan', () => {
      const fields = buildPlanTraceFields(
        outcomeFor('multi-command-all-supported'),
      );
      expect(fields).toMatchObject({
        planOutcome: 'executable',
        planStepCount: 3,
        planCommands: [
          'appointment.reschedule',
          'appointment.cancel_bulk',
          'catalog.create_category',
        ],
        // cancel_bulk is T3, so the plan's highest risk is T3.
        planHighestRisk: 'T3',
        planProblems: null,
      });
    });

    it('also records commands in legacy form so shadow comparison is like-for-like', () => {
      // The planner emits canonical ids; the old classifier writes legacy names
      // into `classified_action`. Without this mapping the shadow view reports a
      // disagreement for EVERY ported command and the real signal is drowned.
      const fields = buildPlanTraceFields(
        outcomeFor('multi-command-all-supported'),
      );
      expect(fields.planCommandsLegacy).toEqual([
        'reschedule_booking',
        'cancel_bookings',
        'create_service_category',
      ]);
    });

    it('leaves an unmapped command unchanged in the legacy list', () => {
      const fields = buildPlanTraceFields(
        outcomeFor('headline-three-commands-one-unsupported'),
      );
      // `patient.create` has no spec, so it has no legacy name to map to.
      expect(fields.planCommandsLegacy?.at(-1)).toBe('patient.create');
    });

    it('records why a plan could not execute, so clarifies are measurable', () => {
      const fields = buildPlanTraceFields(
        outcomeFor('headline-three-commands-one-unsupported'),
      );
      expect(fields.planOutcome).toBe('clarify');
      expect(fields.planStepCount).toBe(3);
      expect(fields.planProblems).toEqual([
        {
          code: 'unknown_command',
          command: 'patient.create',
          details: ['patient.create'],
        },
      ]);
    });

    it('records a surface violation distinctly from a missing variable', () => {
      const violation = buildPlanTraceFields(
        outcomeFor('surface-violation-customer-command-on-dashboard'),
      );
      const missing = buildPlanTraceFields(
        outcomeFor('missing-required-variable'),
      );
      expect(violation.planProblems?.[0].code).toBe('surface_violation');
      expect(missing.planProblems?.[0].code).toBe('missing_variables');
    });

    it('records the decode failure when the planner was unavailable', () => {
      const fields = buildPlanTraceFields({
        status: 'unavailable',
        reason: 'not_json',
      });
      expect(fields).toMatchObject({
        planOutcome: 'unavailable',
        planStepCount: null,
        planCommands: null,
        planProblems: [{ code: 'not_json', details: [] }],
      });
    });

    it('records repairs so model output quality is trackable', () => {
      const base = outcomeFor('multi-command-all-supported');
      const withRepairs = {
        ...base,
        repairs: ['stripped non-JSON wrapper'],
      } as PlanOutcome;
      expect(buildPlanTraceFields(withRepairs).planRepairs).toEqual([
        'stripped non-JSON wrapper',
      ]);
    });

    it('leaves repairs null when the model output was clean', () => {
      expect(
        buildPlanTraceFields(outcomeFor('multi-command-all-supported'))
          .planRepairs,
      ).toBeNull();
    });
  });

  describe('trace row integration', () => {
    const baseInput = {
      businessId: 'biz-1',
      surface: 'dashboard' as const,
      promptRaw: 'do three things',
      action: 'compound_intent',
      result: { success: true, action: 'compound_intent', details: {} },
    };

    it('plan fields are null on rows the legacy pipeline produced', () => {
      const row = buildAiCommandTraceRow(baseInput);
      expect(row.planOutcome).toBeNull();
      expect(row.planCommands).toBeNull();
    });

    it('plan fields populate when the planner handled the message', () => {
      const row = buildAiCommandTraceRow({
        ...baseInput,
        planOutcome: outcomeFor('multi-command-all-supported'),
      });
      expect(row.planOutcome).toBe('executable');
      expect(row.planStepCount).toBe(3);
      expect(row.planCommands).toHaveLength(3);
    });

    it('does not disturb the existing steal-attribution fields', () => {
      const row = buildAiCommandTraceRow({
        ...baseInput,
        planOutcome: outcomeFor('multi-command-all-supported'),
      });
      // No pipelineTrace supplied, so attribution stays empty — the plan
      // columns are additive and must not interfere.
      expect(row.classifiedAction).toBeNull();
      expect(row.actionChangedBy).toBeNull();
    });
  });
});
