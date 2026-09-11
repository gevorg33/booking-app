/**
 * AI-ROADMAP Phase 1 — persisting per-step compound outcomes.
 *
 * The pure attribution is tested in `ai-compound-step-outcome.util.spec.ts`.
 * This covers the write path and its safety properties: step rows must never be
 * able to fail an AI command, must not appear for non-compound messages, and
 * must be correlated to the parent trace by the id the caller supplied rather
 * than a generated one.
 */
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import { AiCommandTrace } from './entities/ai-command-trace.entity.js';
import { AiCommandTraceStep } from './entities/ai-command-trace-step.entity.js';
import {
  attachCompoundStepAttribution,
  COMPOUND_STEP_DETAIL_KEY,
} from './ai-compound-step-outcome.util.js';
import type { RecordAiCommandTraceInput } from './ai-command-trace.util.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';

const flush = (): Promise<void> => new Promise((r) => setImmediate(r));

function compoundInput(
  overrides: Partial<RecordAiCommandTraceInput> = {},
): RecordAiCommandTraceInput {
  const result = {
    success: false,
    action: 'compound_intent',
    details: {
      executionTimeline: [
        { stepId: 's1', status: 'completed' },
        { stepId: 's2', status: 'failed', error: 'No slot available' },
      ],
    } as Record<string, unknown>,
  };
  attachCompoundStepAttribution(result, {
    actions: ['reschedule_booking', 'create_booking'],
    planStepIdsByIndex: [['s1'], ['s2']],
  });
  return {
    businessId: 'biz-1',
    surface: 'dashboard',
    promptRaw: 'move my 3pm to tomorrow and book Anna for Friday',
    action: 'compound_intent',
    traceId: 'trace-9',
    result,
    ...overrides,
  };
}

describe('AiCommandTraceService — compound step rows', () => {
  const traceRepo = {
    create: (p: Partial<AiCommandTrace>) => p,
    save: async (e: Partial<AiCommandTrace>) => e as AiCommandTrace,
  };

  let inserted: Partial<AiCommandTraceStep>[][];
  let stepRepo: { insert: jest.Mock };
  let service: AiCommandTraceService;

  async function build(insertImpl?: () => Promise<unknown>) {
    inserted = [];
    stepRepo = {
      insert: jest.fn(async (rows: Partial<AiCommandTraceStep>[]) => {
        inserted.push(rows);
        return insertImpl ? insertImpl() : { identifiers: [] };
      }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiCommandTraceService,
        { provide: getRepositoryToken(AiCommandTrace), useValue: traceRepo },
        { provide: getRepositoryToken(AiCommandTraceStep), useValue: stepRepo },
      ],
    }).compile();
    service = moduleRef.get(AiCommandTraceService);
  }

  beforeEach(() => build());

  it('writes one row per sub-intent, naming the step that failed', async () => {
    service.recordFireAndForget(compoundInput());
    await flush();

    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toEqual([
      expect.objectContaining({
        traceId: 'trace-9',
        businessId: 'biz-1',
        surface: 'dashboard',
        stepIndex: 0,
        action: 'reschedule_booking',
        outcome: 'executed',
        planStepIds: ['s1'],
        error: null,
      }),
      expect.objectContaining({
        stepIndex: 1,
        action: 'create_booking',
        outcome: 'failed',
        error: 'No slot available',
      }),
    ]);
  });

  it('writes nothing for an ordinary single-action message', async () => {
    service.recordFireAndForget({
      businessId: 'biz-1',
      surface: 'dashboard',
      promptRaw: 'list my bookings',
      action: 'list_bookings',
      traceId: 'trace-1',
      result: { success: true, action: 'list_bookings', details: {} },
    });
    await flush();
    expect(stepRepo.insert).not.toHaveBeenCalled();
  });

  it('correlates rows by the caller-supplied traceId', async () => {
    service.recordFireAndForget(compoundInput({ traceId: 'trace-abc' }));
    await flush();
    expect(inserted[0].every((r) => r.traceId === 'trace-abc')).toBe(true);
  });

  it('writes nothing rather than orphan rows when no traceId was supplied', async () => {
    // `buildAiCommandTraceRow` generates a traceId when one is absent, and that
    // generated id is not visible here — rows keyed on a guess would never join
    // back to their parent.
    service.recordFireAndForget(compoundInput({ traceId: undefined }));
    await flush();
    expect(stepRepo.insert).not.toHaveBeenCalled();
  });

  it('swallows a step-write failure instead of failing the command', async () => {
    await build(() => Promise.reject(new Error('relation does not exist')));
    expect(() => service.recordFireAndForget(compoundInput())).not.toThrow();
    await flush();
    expect(stepRepo.insert).toHaveBeenCalled();
  });

  it('degrades to no step rows when the step repository is absent', async () => {
    // A deployment that has not run the migration must still serve AI commands.
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiCommandTraceService,
        { provide: getRepositoryToken(AiCommandTrace), useValue: traceRepo },
      ],
    }).compile();
    const bare = moduleRef.get(AiCommandTraceService);
    expect(() => bare.recordFireAndForget(compoundInput())).not.toThrow();
    await flush();
  });

  it('records a silent drop as not_planned, not as success', async () => {
    // The compound reported success while one sub-intent never produced a plan
    // — e2e-bug.347's shape, and the reason `ai_command_compound_silent_drop`
    // exists.
    const result = {
      success: true,
      action: 'compound_intent',
      details: {
        executionTimeline: [{ stepId: 's1', status: 'completed' }],
      } as Record<string, unknown>,
    };
    attachCompoundStepAttribution(result, {
      actions: ['create_service_category', 'create_service'],
      planStepIdsByIndex: [['s1'], []],
    });

    service.recordFireAndForget(compoundInput({ result }));
    await flush();

    expect(inserted[0].map((r) => r.outcome)).toEqual([
      'executed',
      'not_planned',
    ]);
  });

  it('keeps the attribution off the client response', async () => {
    // Underscore-prefixed detail keys are stripped by
    // `sanitizeCommandDetailsForClient`; telemetry runs on the unsanitized
    // result first.
    const result = { success: true, action: 'compound_intent', details: {} };
    attachCompoundStepAttribution(result, {
      actions: ['a'],
      planStepIdsByIndex: [['s1']],
    });
    expect(Object.keys(result.details)).toEqual([COMPOUND_STEP_DETAIL_KEY]);
    expect(COMPOUND_STEP_DETAIL_KEY.startsWith('_')).toBe(true);
  });
});

/**
 * Attribution maps a merged-plan step id back to the sub-intent that produced
 * it. That is only sound because `mergePlans` copies sub-plan steps with their
 * ids intact. If merging ever regenerated ids, every step row would silently
 * become `executed` regardless of what happened — a false-success bug in the
 * telemetry meant to catch false-success bugs. This pins the assumption.
 */
describe('mergePlans keeps the ids attribution depends on', () => {
  const planWith = (id: string, stepIds: string[]): AgentPlan =>
    ({
      id,
      agentType: 'SCHEDULING_OPTIMIZATION',
      businessId: 'biz-1',
      intent: 'x',
      reasoning: '',
      steps: stepIds.map((s) => ({
        id: s,
        action: 'cancel_bookings',
        description: s,
        params: {},
        dependsOn: [],
      })),
      constraints: [],
      riskAssessment: { level: 'low', factors: [] },
      status: 'DRAFT',
      createdAt: new Date(),
    }) as unknown as AgentPlan;

  it('preserves every sub-plan step id, in order', () => {
    const builder = new OperationalPlanBuilderService();
    const merged = builder.mergePlans('biz-1', 'compound_intent', [
      planWith('p1', ['s1', 's2']),
      planWith('p2', ['s3']),
    ]);
    expect(merged.steps.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
  });

  it('does not merge two sub-plans into one step', () => {
    const builder = new OperationalPlanBuilderService();
    const merged = builder.mergePlans('biz-1', 'compound_intent', [
      planWith('p1', ['s1']),
      planWith('p2', ['s2']),
    ]);
    expect(merged.steps).toHaveLength(2);
  });
});
