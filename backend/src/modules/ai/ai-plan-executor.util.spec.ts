/**
 * AI-ROADMAP Phase 5 — the DAG executor.
 *
 * The rules under test are the ones that stop a multi-command plan lying about
 * what it did. Each maps to something that has actually gone wrong: §21's
 * `orderedStepIds` trap, and the three false-success bugs (e2e-bug.136, .348,
 * .256) where the platform reported work it had not done.
 */
import {
  dependenciesOf,
  executePlan,
  resolveStepReferences,
  summarizeExecution,
  type StepRunner,
} from './ai-plan-executor.util.js';
import type {
  CommandPlan,
  PlanStep,
  PlanValidationResult,
} from './ai-command-plan.types.js';

const step = (overrides: Partial<PlanStep> = {}): PlanStep => ({
  id: 's1',
  command: 'appointment.create',
  variables: {},
  confidence: 0.95,
  dependsOn: [],
  ...overrides,
});

const plan = (steps: PlanStep[]): CommandPlan => ({
  steps,
  unresolved: [],
  topicChanged: false,
});

const validation = (
  overrides: Partial<PlanValidationResult> = {},
): PlanValidationResult => ({
  executable: true,
  orderedStepIds: ['s1'],
  problems: [],
  requiresConfirmation: false,
  highestRisk: 'T1',
  ...overrides,
});

/** A runner that succeeds, recording the variables it was given. */
function recordingRunner(
  outputs: Record<string, Record<string, unknown>> = {},
): {
  run: StepRunner;
  calls: { id: string; variables: Record<string, unknown> }[];
} {
  const calls: { id: string; variables: Record<string, unknown> }[] = [];
  const run: StepRunner = async ({ step: s, variables }) => {
    calls.push({ id: s.id, variables });
    return { ok: true, output: outputs[s.id] ?? {} };
  };
  return { run, calls };
}

describe('dependenciesOf', () => {
  it('includes explicit dependsOn ids', () => {
    expect(dependenciesOf(step({ dependsOn: ['s1', 's2'] }))).toEqual([
      's1',
      's2',
    ]);
  });

  it('discovers dependencies hidden in $ref variables', () => {
    // A plan can reference an earlier step without listing it in dependsOn;
    // running such a step first would pass a literal "$s1.id" to a handler.
    expect(
      dependenciesOf(step({ id: 's2', variables: { patientId: '$s1.id' } })),
    ).toEqual(['s1']);
  });

  it('finds refs nested inside objects and arrays', () => {
    const s = step({
      variables: { draft: { lines: [{ ownerId: '$s7.id' }] } },
    });
    expect(dependenciesOf(s)).toEqual(['s7']);
  });
});

describe('resolveStepReferences', () => {
  it('substitutes a completed step output', () => {
    const { variables, missingFrom } = resolveStepReferences(
      { patientId: '$s1.id', date: '2026-08-07' },
      new Map([['s1', { id: 'pat-9' }]]),
    );
    expect(variables).toEqual({ patientId: 'pat-9', date: '2026-08-07' });
    expect(missingFrom).toBeNull();
  });

  it('substitutes inside nested structures', () => {
    const { variables } = resolveStepReferences(
      { draft: { lines: [{ ownerId: '$s1.id' }] } },
      new Map([['s1', { id: 'emp-2' }]]),
    );
    expect(variables).toEqual({ draft: { lines: [{ ownerId: 'emp-2' }] } });
  });

  it('preserves non-string values untouched', () => {
    const { variables } = resolveStepReferences(
      { count: 3, active: true, tags: ['a'] },
      new Map(),
    );
    expect(variables).toEqual({ count: 3, active: true, tags: ['a'] });
  });

  it('reports the step whose output was missing rather than substituting null', () => {
    const { variables, missingFrom } = resolveStepReferences(
      { patientId: '$s1.id' },
      new Map([['s1', { name: 'David' }]]), // has output, but no `id`
    );
    expect(missingFrom).toBe('s1');
    // The placeholder survives, so a caller that ignored `missingFrom` would
    // write a literal "$s1.id" — which is why the executor skips instead.
    expect(variables.patientId).toBe('$s1.id');
  });
});

describe('summarizeExecution', () => {
  const result = (status: 'executed' | 'failed' | 'skipped') => ({
    stepId: 'x',
    command: 'c',
    status,
    output: null,
    error: null,
    blockedBy: null,
  });

  it.each([
    [['executed', 'executed'], 'completed'],
    [['executed', 'failed'], 'partial'],
    [['executed', 'skipped'], 'partial'],
    [['failed', 'skipped'], 'failed'],
    [['failed'], 'failed'],
  ] as const)('%p summarises as %s', (statuses, expected) => {
    expect(summarizeExecution(statuses.map(result))).toBe(expected);
  });

  it('never calls a partial run complete', () => {
    // The false-success family: e2e-bug.136, .348, .256 all reported success
    // for work that had not happened.
    expect(summarizeExecution([result('executed'), result('failed')])).not.toBe(
      'completed',
    );
  });
});

describe('executePlan', () => {
  describe('refuses before touching anything', () => {
    it('refuses a plan that failed validation', async () => {
      // §21: orderedStepIds is populated for refused plans too, because a
      // previewable order is useful. It is not an execution permit.
      const { run, calls } = recordingRunner();
      const result = await executePlan(
        plan([step()]),
        validation({ executable: false, orderedStepIds: ['s1'] }),
        run,
      );
      expect(result.status).toBe('refused');
      expect(result.steps).toEqual([]);
      expect(calls).toEqual([]);
    });

    it('refuses when confirmation is required and absent', async () => {
      const { run, calls } = recordingRunner();
      const result = await executePlan(
        plan([step()]),
        validation({ requiresConfirmation: true }),
        run,
      );
      expect(result.status).toBe('refused');
      expect(result.refusedBecause).toContain('confirmation');
      expect(calls).toEqual([]);
    });

    it('runs once confirmation is given', async () => {
      const { run } = recordingRunner();
      const result = await executePlan(
        plan([step()]),
        validation({ requiresConfirmation: true }),
        run,
        { confirmed: true },
      );
      expect(result.status).toBe('completed');
    });

    it('refuses an empty plan', async () => {
      const { run } = recordingRunner();
      const result = await executePlan(plan([]), validation(), run);
      expect(result.status).toBe('refused');
    });
  });

  describe('dependency wiring', () => {
    it('passes an earlier step output into a later step', async () => {
      // The headline shape: create a patient, then book them.
      const { run, calls } = recordingRunner({ s1: { id: 'pat-9' } });
      const result = await executePlan(
        plan([
          step({ id: 's1', command: 'patient.create' }),
          step({
            id: 's2',
            command: 'appointment.create',
            variables: { patientId: '$s1.id' },
            dependsOn: ['s1'],
          }),
        ]),
        validation({ orderedStepIds: ['s1', 's2'] }),
        run,
      );
      expect(result.status).toBe('completed');
      expect(calls[1].variables).toEqual({ patientId: 'pat-9' });
    });

    it('executes in dependency order, not plan order', async () => {
      const { run, calls } = recordingRunner({ s2: { id: 'x' } });
      await executePlan(
        plan([
          step({ id: 's1', variables: { ref: '$s2.id' }, dependsOn: ['s2'] }),
          step({ id: 's2' }),
        ]),
        validation({ orderedStepIds: ['s2', 's1'] }),
        run,
      );
      expect(calls.map((c) => c.id)).toEqual(['s2', 's1']);
    });
  });

  describe('failure does not cascade into false failures', () => {
    it('skips a dependent step rather than failing it', async () => {
      const run: StepRunner = async ({ step: s }) =>
        s.id === 's1' ? { ok: false, error: 'No slot' } : { ok: true };
      const result = await executePlan(
        plan([step({ id: 's1' }), step({ id: 's2', dependsOn: ['s1'] })]),
        validation({ orderedStepIds: ['s1', 's2'] }),
        run,
      );
      expect(result.steps.map((s) => s.status)).toEqual(['failed', 'skipped']);
      // Two steps, one failure — not two failures.
      expect(result.steps.filter((s) => s.status === 'failed')).toHaveLength(1);
      expect(result.steps[1].blockedBy).toBe('s1');
    });

    it('still runs independent steps when another fails', async () => {
      const run: StepRunner = async ({ step: s }) =>
        s.id === 's1' ? { ok: false, error: 'No slot' } : { ok: true };
      const result = await executePlan(
        plan([step({ id: 's1' }), step({ id: 's2' })]),
        validation({ orderedStepIds: ['s1', 's2'] }),
        run,
      );
      expect(result.steps.map((s) => s.status)).toEqual(['failed', 'executed']);
      expect(result.status).toBe('partial');
    });

    it('reports a partial run as partial, never as completed', async () => {
      const run: StepRunner = async ({ step: s }) =>
        s.id === 's2' ? { ok: false, error: 'boom' } : { ok: true };
      const result = await executePlan(
        plan([step({ id: 's1' }), step({ id: 's2' })]),
        validation({ orderedStepIds: ['s1', 's2'] }),
        run,
      );
      expect(result.status).toBe('partial');
    });

    it('treats a thrown handler as one failed step, not a failed plan', async () => {
      const run: StepRunner = async ({ step: s }) => {
        if (s.id === 's1') throw new Error('connection reset');
        return { ok: true };
      };
      const result = await executePlan(
        plan([step({ id: 's1' }), step({ id: 's2' })]),
        validation({ orderedStepIds: ['s1', 's2'] }),
        run,
      );
      expect(result.steps[0]).toMatchObject({
        status: 'failed',
        error: 'connection reset',
      });
      // The step that succeeded really did happen and is still reported.
      expect(result.steps[1].status).toBe('executed');
      expect(result.status).toBe('partial');
    });

    it('skips a step whose dependency executed but returned no such field', async () => {
      // Running it would write the literal "$s1.id" to the database.
      const { run, calls } = recordingRunner({ s1: { name: 'David' } });
      const result = await executePlan(
        plan([
          step({ id: 's1', command: 'patient.create' }),
          step({
            id: 's2',
            variables: { patientId: '$s1.id' },
            dependsOn: ['s1'],
          }),
        ]),
        validation({ orderedStepIds: ['s1', 's2'] }),
        run,
      );
      expect(result.steps[1].status).toBe('skipped');
      expect(result.steps[1].blockedBy).toBe('s1');
      expect(calls.map((c) => c.id)).toEqual(['s1']);
    });
  });

  it('reports every step exactly once', async () => {
    const { run } = recordingRunner();
    const result = await executePlan(
      plan([step({ id: 's1' }), step({ id: 's2' }), step({ id: 's3' })]),
      validation({ orderedStepIds: ['s1', 's2', 's3'] }),
      run,
    );
    expect(result.steps.map((s) => s.stepId)).toEqual(['s1', 's2', 's3']);
  });
});
