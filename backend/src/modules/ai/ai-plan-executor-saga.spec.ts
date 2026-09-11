/**
 * AI-ROADMAP Phase 7 — the saga actually runs.
 *
 * §47 built compensation and nothing invoked it, which is the failure pattern
 * this programme keeps repeating. These tests exercise `executePlan` itself, so
 * a regression that stops calling `compensate` fails here rather than being
 * invisible behind §47's own green suite.
 *
 * The seam is opt-in: without `specs` and `runCompensation` the executor
 * behaves exactly as it did before, which is why the pre-existing 25 tests were
 * unaffected.
 */
import { executePlan, type CaptureReader } from './ai-plan-executor.util.js';
import type {
  CommandPlan,
  PlanValidationResult,
} from './ai-command-plan.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const spec = (
  id: string,
  compensation?: CommandSpec['compensation'],
): CommandSpec => ({
  id,
  aliases: [],
  domain: id.split('.')[0],
  surfaces: ['dashboard'],
  tiers: { dashboard: ['owner'] },
  risk: 'T1',
  description: id,
  variables: {},
  examples: [],
  confirm: 'never',
  handler: 'X',
  compensation,
});

const SPECS: CommandSpec[] = [
  spec('appointment.create', {
    kind: 'inverse',
    command: 'appointment.cancel',
    captures: ['appointmentId'],
  }),
  spec('appointment.reschedule', {
    kind: 'inverse',
    command: 'appointment.reschedule',
    captures: ['appointmentId', 'originalStart'],
  }),
  spec('appointment.mark_paid', {
    kind: 'none',
    reason: 'Payment records are financial events.',
  }),
  spec('appointment.cancel', { kind: 'none', reason: 'already cancelled' }),
];

const plan = (...commands: string[]): CommandPlan => ({
  steps: commands.map((command, i) => ({
    id: `s${i + 1}`,
    command,
    variables: {},
    confidence: 1,
    dependsOn: [],
  })),
  unresolved: [],
  topicChanged: false,
});

const validation = (ids: string[]): PlanValidationResult => ({
  executable: true,
  requiresConfirmation: false,
  orderedStepIds: ids,
  problems: [],
  highestRisk: 'T1',
});

/** Succeeds for every command except the named one. */
const runnerFailing =
  (failOn: string) =>
  async ({ step }: { step: { command: string } }) =>
    step.command === failOn
      ? { ok: false, error: 'boom' }
      : { ok: true, output: { id: 'x' } };

describe('executePlan runs the saga on a partial failure', () => {
  it('compensates the step that already succeeded', async () => {
    const compensated: string[] = [];
    const result = await executePlan(
      plan('appointment.create', 'appointment.reschedule'),
      validation(['s1', 's2']),
      runnerFailing('appointment.reschedule'),
      {
        specs: SPECS,
        captureState: () => ({ appointmentId: 'a1' }),
        runCompensation: async ({ step }) => {
          compensated.push(step.command);
          return { ok: true };
        },
      },
    );
    expect(result.status).toBe('partial');
    expect(result.saga?.status).toBe('rolled_back');
    expect(compensated).toEqual(['appointment.cancel']);
  });

  it('captures pre-state BEFORE the step runs', async () => {
    // `originalStart` does not exist after a reschedule; a capture taken
    // afterwards builds a rollback that quietly does nothing.
    const order: string[] = [];
    const captureState: CaptureReader = ({ step }) => {
      order.push(`capture:${step.command}`);
      return { appointmentId: 'a1', originalStart: '10:00' };
    };
    await executePlan(
      plan('appointment.reschedule', 'appointment.mark_paid'),
      validation(['s1', 's2']),
      async ({ step }) => {
        order.push(`run:${step.command}`);
        return step.command === 'appointment.mark_paid'
          ? { ok: false, error: 'boom' }
          : { ok: true, output: {} };
      },
      {
        specs: SPECS,
        captureState,
        runCompensation: async () => ({ ok: true }),
      },
    );
    expect(order.slice(0, 2)).toEqual([
      'capture:appointment.reschedule',
      'run:appointment.reschedule',
    ]);
  });

  it('strands an irreversible write rather than claiming a rollback', async () => {
    const result = await executePlan(
      plan('appointment.mark_paid', 'appointment.reschedule'),
      validation(['s1', 's2']),
      runnerFailing('appointment.reschedule'),
      {
        specs: SPECS,
        captureState: () => ({}),
        runCompensation: async () => ({ ok: true }),
      },
    );
    expect(result.saga?.status).toBe('partially_rolled_back');
    expect(result.saga?.stranded.map((s) => s.command)).toEqual([
      'appointment.mark_paid',
    ]);
  });

  it('strands a step whose capture reader threw', async () => {
    // A failed capture is not a failed step, but it does make the step
    // uncompensatable — and saying so beats compensating with undefined.
    const result = await executePlan(
      plan('appointment.create', 'appointment.reschedule'),
      validation(['s1', 's2']),
      runnerFailing('appointment.reschedule'),
      {
        specs: SPECS,
        captureState: () => {
          throw new Error('db down');
        },
        runCompensation: async () => ({ ok: true }),
      },
    );
    expect(result.saga?.status).toBe('partially_rolled_back');
    expect(result.saga?.stranded[0].status).toBe('missing_capture');
  });

  it('does not compensate a plan that completed', async () => {
    const compensated: string[] = [];
    const result = await executePlan(
      plan('appointment.create'),
      validation(['s1']),
      async () => ({ ok: true, output: {} }),
      {
        specs: SPECS,
        captureState: () => ({ appointmentId: 'a1' }),
        runCompensation: async ({ step }) => {
          compensated.push(step.command);
          return { ok: true };
        },
      },
    );
    expect(result.status).toBe('completed');
    expect(result.saga).toBeNull();
    expect(compensated).toEqual([]);
  });

  it('does not compensate when nothing executed', async () => {
    // 'failed' means no write is standing, so there is nothing to undo.
    const compensated: string[] = [];
    const result = await executePlan(
      plan('appointment.create'),
      validation(['s1']),
      async () => ({ ok: false, error: 'boom' }),
      {
        specs: SPECS,
        captureState: () => ({}),
        runCompensation: async ({ step }) => {
          compensated.push(step.command);
          return { ok: true };
        },
      },
    );
    expect(result.status).toBe('failed');
    expect(compensated).toEqual([]);
  });

  it('stays opt-in: no specs means the old behaviour', async () => {
    // A caller that did not opt in must get exactly what it got before §55,
    // not a silently different result.
    const result = await executePlan(
      plan('appointment.create', 'appointment.reschedule'),
      validation(['s1', 's2']),
      runnerFailing('appointment.reschedule'),
    );
    expect(result.status).toBe('partial');
    expect(result.saga).toBeNull();
  });

  it('does not call the capture reader when nothing needs capturing', async () => {
    // `mark_paid` is irreversible, so there is no pre-state worth reading.
    const seen: string[] = [];
    await executePlan(
      plan('appointment.mark_paid'),
      validation(['s1']),
      async () => ({ ok: true, output: {} }),
      {
        specs: SPECS,
        captureState: ({ step }) => {
          seen.push(step.command);
          return {};
        },
        runCompensation: async () => ({ ok: true }),
      },
    );
    expect(seen).toEqual([]);
  });

  it('reports a compensation that itself failed', async () => {
    const result = await executePlan(
      plan('appointment.create', 'appointment.reschedule'),
      validation(['s1', 's2']),
      runnerFailing('appointment.reschedule'),
      {
        specs: SPECS,
        captureState: () => ({ appointmentId: 'a1' }),
        runCompensation: async () => ({ ok: false, error: 'cancel rejected' }),
      },
    );
    expect(result.saga?.status).toBe('compensation_failed');
    expect(result.saga?.compensationErrors[0].error).toBe('cancel rejected');
  });
});
