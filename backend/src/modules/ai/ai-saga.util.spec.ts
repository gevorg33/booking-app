/**
 * AI-ROADMAP Phase 5 — transactional grouping and saga compensation.
 *
 * The behaviour worth protecting is not "it rolls back". It is that it **tells
 * the truth when it cannot** — 6 of the registry's 14 mutating commands declare
 * themselves irreversible or human-only, and a saga that reported success over
 * a stranded payment would be actively harmful.
 */
import {
  aggregateOf,
  compensate,
  describeStranded,
  groupByAggregate,
  planCompensation,
  type CaptureMap,
} from './ai-saga.util.js';
import type { CommandPlan, PlanStep } from './ai-command-plan.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';
import type { StepResult, StepRunner } from './ai-plan-executor.util.js';

const spec = (
  id: string,
  domain: string,
  compensation?: CommandSpec['compensation'],
): CommandSpec => ({
  id,
  aliases: [],
  domain,
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
  spec('appointment.create', 'appointment', {
    kind: 'inverse',
    command: 'appointment.cancel_mine',
    captures: ['appointmentId'],
  }),
  spec('appointment.reschedule', 'appointment', {
    kind: 'inverse',
    command: 'appointment.reschedule',
    captures: ['appointmentId', 'originalStart'],
  }),
  spec('appointment.mark_paid', 'appointment', {
    kind: 'none',
    reason: 'Payment records are financial events.',
  }),
  spec('appointment.update_bulk', 'appointment', {
    kind: 'manual',
    reason: 'Needs per-row pre-state.',
  }),
  spec('catalog.update_service', 'catalog', {
    kind: 'inverse',
    command: 'catalog.update_service',
    captures: ['serviceId'],
  }),
  spec('catalog.list_packages', 'catalog'),
];

const step = (id: string, command: string): PlanStep => ({
  id,
  command,
  variables: {},
  confidence: 1,
  dependsOn: [],
});

const plan = (...steps: PlanStep[]): CommandPlan => ({
  steps,
  unresolved: [],
  topicChanged: false,
});

const executed = (stepId: string, command: string): StepResult => ({
  stepId,
  command,
  status: 'executed',
  output: {},
  error: null,
  blockedBy: null,
});

const failedStep = (stepId: string, command: string): StepResult => ({
  ...executed(stepId, command),
  status: 'failed',
  error: 'boom',
});

describe('aggregateOf', () => {
  it('reads the aggregate from the spec domain', () => {
    expect(aggregateOf(SPECS, step('s1', 'appointment.create'))).toBe(
      'appointment',
    );
  });

  it('does not claim an aggregate it cannot determine', () => {
    // Grouping an unknown command with a known one would put two unrelated
    // writes in one transaction.
    expect(aggregateOf(SPECS, step('s1', 'mystery.command'))).toBe('unknown');
  });
});

describe('groupByAggregate', () => {
  it('puts consecutive same-aggregate steps in one transaction', () => {
    // The cheap path: a failure inside the group rolls back with no
    // compensation at all, leaving no cancelled rows and sending no emails.
    const groups = groupByAggregate(
      plan(
        step('s1', 'appointment.create'),
        step('s2', 'appointment.reschedule'),
      ),
      SPECS,
    );
    expect(groups).toEqual([
      { aggregate: 'appointment', stepIds: ['s1', 's2'] },
    ]);
  });

  it('starts a new group when the aggregate changes', () => {
    const groups = groupByAggregate(
      plan(
        step('s1', 'appointment.create'),
        step('s2', 'catalog.update_service'),
      ),
      SPECS,
    );
    expect(groups.map((g) => g.aggregate)).toEqual(['appointment', 'catalog']);
  });

  it('does not rejoin an aggregate split by another one', () => {
    // Merging s1 and s3 would hold the appointment transaction open across the
    // catalog write. Reordering to widen a transaction changes the order writes
    // become visible in, which is not a silent trade.
    const groups = groupByAggregate(
      plan(
        step('s1', 'appointment.create'),
        step('s2', 'catalog.update_service'),
        step('s3', 'appointment.reschedule'),
      ),
      SPECS,
    );
    expect(groups).toEqual([
      { aggregate: 'appointment', stepIds: ['s1'] },
      { aggregate: 'catalog', stepIds: ['s2'] },
      { aggregate: 'appointment', stepIds: ['s3'] },
    ]);
  });

  it('handles an empty plan', () => {
    expect(groupByAggregate(plan(), SPECS)).toEqual([]);
  });
});

describe('planCompensation', () => {
  const captures: CaptureMap = new Map([
    ['s1', { appointmentId: 'a1' }],
    ['s2', { appointmentId: 'a1', originalStart: '2026-08-01T10:00:00Z' }],
  ]);

  it('undoes in reverse order', () => {
    // Dependents must be unwound before what they depend on.
    const result = planCompensation(
      [
        executed('s1', 'appointment.create'),
        executed('s2', 'appointment.reschedule'),
      ],
      SPECS,
      captures,
    );
    expect(result.actions.map((a) => a.stepId)).toEqual(['s2', 's1']);
  });

  it('feeds captured pre-state to the compensating command', () => {
    // The original start exists only in the row before the write; without the
    // capture the "undo" would move the appointment to undefined.
    const result = planCompensation(
      [executed('s2', 'appointment.reschedule')],
      SPECS,
      captures,
    );
    expect(result.actions[0]).toMatchObject({
      status: 'compensable',
      compensatingCommand: 'appointment.reschedule',
      variables: {
        appointmentId: 'a1',
        originalStart: '2026-08-01T10:00:00Z',
      },
    });
  });

  it('refuses to compensate when the pre-state was never captured', () => {
    // A rollback that runs with a missing capture is a rollback that quietly
    // does the wrong thing.
    const result = planCompensation(
      [executed('s2', 'appointment.reschedule')],
      SPECS,
      new Map([['s2', { appointmentId: 'a1' }]]),
    );
    expect(result.actions[0].status).toBe('missing_capture');
    expect(result.actions[0].reason).toContain('originalStart');
    expect(result.fullyReversible).toBe(false);
  });

  it('strands a payment rather than inventing a refund', () => {
    // The whole point. A refund is a second financial event with its own record
    // and possibly fees — not an undo.
    const result = planCompensation(
      [executed('s1', 'appointment.mark_paid')],
      SPECS,
      captures,
    );
    expect(result.actions[0].status).toBe('irreversible');
    expect(result.fullyReversible).toBe(false);
    expect(result.stranded).toHaveLength(1);
  });

  it('marks a human-only compensation as needing a human', () => {
    const result = planCompensation(
      [executed('s1', 'appointment.update_bulk')],
      SPECS,
      captures,
    );
    expect(result.actions[0].status).toBe('needs_human');
    expect(result.actions[0].reason).toContain('pre-state');
  });

  it('treats an undeclared compensation as irreversible, not reversible', () => {
    // The optimistic reading is the dangerous one.
    const result = planCompensation(
      [executed('s1', 'catalog.list_packages')],
      SPECS,
      captures,
    );
    expect(result.actions[0].status).toBe('irreversible');
  });

  it('does not compensate a step that failed', () => {
    // A failed step made no write to undo.
    const result = planCompensation(
      [failedStep('s1', 'appointment.create')],
      SPECS,
      captures,
    );
    expect(result.actions).toEqual([]);
  });

  it('does not compensate a step that was skipped', () => {
    const skipped: StepResult = {
      ...executed('s1', 'appointment.create'),
      status: 'skipped',
      blockedBy: 's0',
    };
    expect(planCompensation([skipped], SPECS, captures).actions).toEqual([]);
  });

  it('is fully reversible only when every step can actually be undone', () => {
    const allGood = planCompensation(
      [executed('s1', 'appointment.create')],
      SPECS,
      captures,
    );
    expect(allGood.fullyReversible).toBe(true);

    const mixed = planCompensation(
      [
        executed('s1', 'appointment.create'),
        executed('s2', 'appointment.mark_paid'),
      ],
      SPECS,
      captures,
    );
    expect(mixed.fullyReversible).toBe(false);
  });
});

describe('compensate', () => {
  const captures: CaptureMap = new Map([['s1', { appointmentId: 'a1' }]]);
  const okRunner: StepRunner = async () => ({ ok: true, output: {} });

  it('does nothing when the plan succeeded', () => {
    const runner = jest.fn(okRunner);
    return compensate(
      [executed('s1', 'appointment.create')],
      SPECS,
      runner,
      captures,
    ).then((result) => {
      expect(result.status).toBe('completed');
      expect(runner).not.toHaveBeenCalled();
    });
  });

  it('rolls back completed steps when a later one failed', async () => {
    const result = await compensate(
      [
        executed('s1', 'appointment.create'),
        failedStep('s2', 'appointment.reschedule'),
      ],
      SPECS,
      okRunner,
      captures,
    );
    expect(result.status).toBe('rolled_back');
    expect(result.compensated.map((c) => c.stepId)).toEqual(['s1']);
    expect(result.stranded).toEqual([]);
  });

  it('runs the compensating command, not the original', async () => {
    const seen: string[] = [];
    await compensate(
      [
        executed('s1', 'appointment.create'),
        failedStep('s2', 'appointment.mark_paid'),
      ],
      SPECS,
      async ({ step: s }) => {
        seen.push(s.command);
        return { ok: true };
      },
      captures,
    );
    expect(seen).toEqual(['appointment.cancel_mine']);
  });

  it('reports partial rollback when something could not be undone', async () => {
    // Money moved and the appointment was created. Only one is reversible, and
    // saying "rolled back" here would be a lie.
    const result = await compensate(
      [
        executed('s1', 'appointment.create'),
        executed('s2', 'appointment.mark_paid'),
        failedStep('s3', 'appointment.reschedule'),
      ],
      SPECS,
      okRunner,
      captures,
    );
    expect(result.status).toBe('partially_rolled_back');
    expect(result.stranded.map((s) => s.command)).toEqual([
      'appointment.mark_paid',
    ]);
  });

  it('escalates when a compensation itself fails', async () => {
    // The loudest outcome: the system is now in a state nobody planned for.
    const result = await compensate(
      [
        executed('s1', 'appointment.create'),
        failedStep('s2', 'appointment.reschedule'),
      ],
      SPECS,
      async () => ({ ok: false, error: 'cancel rejected' }),
      captures,
    );
    expect(result.status).toBe('compensation_failed');
    expect(result.compensationErrors).toEqual([
      { stepId: 's1', error: 'cancel rejected' },
    ]);
  });

  it('catches a thrown compensation rather than losing the rest', async () => {
    const result = await compensate(
      [
        executed('s1', 'appointment.create'),
        failedStep('s2', 'appointment.reschedule'),
      ],
      SPECS,
      async () => {
        throw new Error('connection lost');
      },
      captures,
    );
    expect(result.status).toBe('compensation_failed');
    expect(result.compensationErrors[0].error).toBe('connection lost');
  });

  it('keeps undoing after one compensation fails', async () => {
    // Stopping early would strand more than necessary.
    const attempted: string[] = [];
    const twoSteps: CaptureMap = new Map([
      ['s1', { appointmentId: 'a1' }],
      ['s2', { serviceId: 'svc1' }],
    ]);
    await compensate(
      [
        executed('s1', 'appointment.create'),
        executed('s2', 'catalog.update_service'),
        failedStep('s3', 'appointment.reschedule'),
      ],
      SPECS,
      async ({ step: s }) => {
        attempted.push(s.command);
        return { ok: attempted.length > 1, error: 'first one fails' };
      },
      twoSteps,
    );
    expect(attempted).toEqual([
      'catalog.update_service',
      'appointment.cancel_mine',
    ]);
  });
});

describe('describeStranded', () => {
  it('names each surviving write and why it survived', async () => {
    // A saga that knows it stranded a payment and says "something went wrong"
    // has thrown away the only part the user needed.
    const result = await compensate(
      [
        executed('s1', 'appointment.mark_paid'),
        failedStep('s2', 'appointment.create'),
      ],
      SPECS,
      async () => ({ ok: true }),
      new Map(),
    );
    const lines = describeStranded(result);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('appointment.mark_paid');
    expect(lines[0]).toContain('financial events');
  });

  it('says nothing when everything was undone', async () => {
    const result = await compensate(
      [
        executed('s1', 'appointment.create'),
        failedStep('s2', 'appointment.reschedule'),
      ],
      SPECS,
      async () => ({ ok: true }),
      new Map([['s1', { appointmentId: 'a1' }]]),
    );
    expect(describeStranded(result)).toEqual([]);
  });
});
