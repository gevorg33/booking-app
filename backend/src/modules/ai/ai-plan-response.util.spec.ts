/**
 * AI-ROADMAP §3.3 — honest partial success.
 *
 * The bugs these defend against all reported work that had not happened:
 * e2e-bug.136 (`clear_schedule`), e2e-bug.348 ("category created" when it was
 * not) and e2e-bug.256 (clinic compounds).
 *
 * The structural claim is that the response *cannot* restate the request,
 * because the request is not a parameter. That is asserted directly below.
 */
import {
  buildExecutionResponse,
  buildPlanResponse,
} from './ai-plan-response.util.js';
import { executePlan } from './ai-plan-executor.util.js';
import type {
  PlanExecutionResult,
  StepResult,
} from './ai-plan-executor.util.js';

const result = (overrides: Partial<StepResult> = {}): StepResult => ({
  stepId: 's1',
  command: 'appointment.create',
  status: 'executed',
  output: null,
  error: null,
  blockedBy: null,
  ...overrides,
});

describe('buildPlanResponse', () => {
  describe('the structural guarantee', () => {
    it('takes results and a labeller — the request is not in scope', () => {
      // If a future edit wants to restate the user's wording, it has to add a
      // parameter first. That is the mechanism: not diligence, arity.
      expect(buildPlanResponse.length).toBeLessThanOrEqual(2);
    });

    it('says nothing about commands that were not in the results', () => {
      const response = buildPlanResponse([
        result({ command: 'appointment.create' }),
      ]);
      expect(response.summary).not.toContain('cancel');
      expect(response.details.executed).toEqual(['appointment.create']);
    });
  });

  describe('a fully successful run', () => {
    it('reports success and names what ran', () => {
      const response = buildPlanResponse([
        result({ stepId: 's1', command: 'appointment.reschedule' }),
        result({ stepId: 's2', command: 'appointment.cancel_bulk' }),
      ]);
      expect(response.success).toBe(true);
      expect(response.summary).toBe('Done: reschedule and cancel_bulk.');
    });
  });

  describe('a partial run is never a success', () => {
    it('reports success:false when any step failed', () => {
      const response = buildPlanResponse([
        result({ stepId: 's1' }),
        result({ stepId: 's2', status: 'failed', error: 'No slot' }),
      ]);
      expect(response.success).toBe(false);
    });

    it('reports success:false when any step was skipped', () => {
      // e2e-bug.348's shape: the category was created, the services were not,
      // and the user was told it had all worked.
      const response = buildPlanResponse([
        result({ stepId: 's1', command: 'catalog.create_category' }),
        result({
          stepId: 's2',
          command: 'catalog.create_with_services',
          status: 'skipped',
          blockedBy: 's1',
        }),
      ]);
      expect(response.success).toBe(false);
      expect(response.summary).toContain("Didn't attempt");
    });

    it('states what did happen as well as what did not', () => {
      const response = buildPlanResponse([
        result({ stepId: 's1', command: 'appointment.reschedule' }),
        result({
          stepId: 's2',
          command: 'appointment.mark_paid',
          status: 'failed',
          error: 'Card declined',
        }),
      ]);
      // Leading with the failure would be honest but unhelpful; omitting the
      // success would understate what the user now has to reason about.
      expect(response.summary).toContain('Done: reschedule.');
      expect(response.summary).toContain("Couldn't mark_paid: Card declined.");
    });

    it('carries the error text so the user can act on it', () => {
      const response = buildPlanResponse([
        result({ status: 'failed', error: 'No slot available' }),
      ]);
      expect(response.summary).toContain('No slot available');
      expect(response.details.failed[0].error).toBe('No slot available');
    });

    it('does not invent a reason when the handler gave none', () => {
      const response = buildPlanResponse([result({ status: 'failed' })]);
      expect(response.summary).toBe("Couldn't create.");
    });
  });

  describe('skipped steps are reported as not-attempted', () => {
    it('does not count them as failures', () => {
      // One failure that blocks two steps is one failure, not three.
      const response = buildPlanResponse([
        result({ stepId: 's1', status: 'failed', error: 'boom' }),
        result({ stepId: 's2', status: 'skipped', blockedBy: 's1' }),
        result({ stepId: 's3', status: 'skipped', blockedBy: 's1' }),
      ]);
      expect(response.details.failed).toHaveLength(1);
      expect(response.details.skipped).toHaveLength(2);
    });

    it('explains why they did not run', () => {
      const response = buildPlanResponse([
        result({ stepId: 's1', status: 'failed', error: 'boom' }),
        result({ stepId: 's2', status: 'skipped', blockedBy: 's1' }),
      ]);
      expect(response.summary).toContain("didn't succeed");
    });

    it('handles a run where everything was skipped', () => {
      const response = buildPlanResponse([
        result({ stepId: 's1', status: 'skipped', blockedBy: 's0' }),
      ]);
      expect(response.success).toBe(false);
      expect(response.summary).toBe(
        'Nothing ran, because an earlier step did not succeed.',
      );
    });
  });

  it('reports an empty result set as nothing having run', () => {
    const response = buildPlanResponse([]);
    expect(response.success).toBe(false);
    expect(response.summary).toBe('Nothing ran.');
  });

  it('falls back to the raw id for an unrecognised command shape', () => {
    // Slightly technical is better than confidently wrong.
    const response = buildPlanResponse([result({ command: 'legacy_action' })]);
    expect(response.summary).toContain('legacy_action');
  });

  it('accepts a custom labeller for human-readable text', () => {
    const response = buildPlanResponse(
      [result({ command: 'appointment.reschedule' })],
      (c) => (c === 'appointment.reschedule' ? 'moved the appointment' : c),
    );
    expect(response.summary).toBe('Done: moved the appointment.');
  });
});

describe('buildExecutionResponse', () => {
  const execution = (
    overrides: Partial<PlanExecutionResult> = {},
  ): PlanExecutionResult => ({
    status: 'completed',
    steps: [result()],
    refusedBecause: null,
    ...overrides,
  });

  it('reports a refusal as the refusal, not as an outcome list', () => {
    const response = buildExecutionResponse(
      execution({
        status: 'refused',
        steps: [],
        refusedBecause: 'Plan requires confirmation before it can run.',
      }),
    );
    expect(response.success).toBe(false);
    expect(response.summary).toBe(
      'Plan requires confirmation before it can run.',
    );
    expect(response.details.executed).toEqual([]);
  });

  it('never claims success for a refused plan', () => {
    const response = buildExecutionResponse(
      execution({ status: 'refused', steps: [], refusedBecause: null }),
    );
    expect(response.success).toBe(false);
  });

  it('delegates to the result-derived summary otherwise', () => {
    expect(buildExecutionResponse(execution()).success).toBe(true);
  });
});

/**
 * End-to-end through the real executor: a plan whose second step fails must
 * produce a response that says so. Testing the builder in isolation proves the
 * text is right; this proves the wiring is.
 */
describe('executor → response, end to end', () => {
  it('reports the honest outcome of a partially-failing plan', async () => {
    const plan = {
      steps: [
        {
          id: 's1',
          command: 'catalog.create_category',
          variables: {},
          confidence: 0.95,
          dependsOn: [],
        },
        {
          id: 's2',
          command: 'catalog.create_with_services',
          variables: {},
          confidence: 0.95,
          dependsOn: [],
        },
        {
          id: 's3',
          command: 'appointment.create',
          variables: { ref: '$s2.id' },
          confidence: 0.95,
          dependsOn: ['s2'],
        },
      ],
      unresolved: [],
      topicChanged: false,
    };
    const validation = {
      executable: true,
      orderedStepIds: ['s1', 's2', 's3'],
      problems: [],
      requiresConfirmation: false,
      highestRisk: 'T1' as const,
    };

    const execution = await executePlan(plan, validation, async ({ step }) =>
      step.id === 's2'
        ? { ok: false, error: 'Duplicate service name' }
        : { ok: true, output: { id: 'x' } },
    );

    const response = buildExecutionResponse(execution);

    expect(execution.status).toBe('partial');
    expect(response.success).toBe(false);
    // The category really was created — say so.
    expect(response.summary).toContain('Done: create_category.');
    // The services really were not — say that too, with the reason.
    expect(response.summary).toContain(
      "Couldn't create_with_services: Duplicate service name.",
    );
    // And the booking never ran, which is not the same as failing.
    expect(response.details.skipped.map((s) => s.command)).toEqual([
      'appointment.create',
    ]);
    expect(response.details.failed).toHaveLength(1);
  });
});
