/**
 * AI-ROADMAP Phase 3 — shadow-run safety contract.
 *
 * These tests exist because the shadow runner sits on the live gateway path.
 * Every assertion here is about it NOT doing something: not running unless
 * asked, not throwing, not touching the response.
 */
import {
  AiPlannerShadowService,
  parseShadowSurfaces,
  PLANNER_SHADOW_SURFACES_KEY,
} from './ai-planner-shadow.service.js';
import type { AiCommandPlannerService } from './ai-command-planner.service.js';
import type { AiCommandTraceService } from './ai-command-trace.service.js';
import type { PlanOutcome } from './ai-command-planner.service.js';

const EXECUTABLE_OUTCOME: PlanOutcome = {
  status: 'executable',
  plan: {
    steps: [
      {
        id: 's1',
        command: 'appointment.reschedule',
        variables: { appointmentId: 'a1', startsAt: '2026-08-05T15:00:00Z' },
        confidence: 0.9,
        dependsOn: [],
      },
    ],
    unresolved: [],
    topicChanged: false,
  },
  validation: {
    executable: true,
    orderedStepIds: ['s1'],
    problems: [],
    requiresConfirmation: false,
    highestRisk: 'T1',
  },
  repairs: [],
};

function build(opts: {
  surfaces?: string;
  plan?: () => Promise<PlanOutcome>;
  attach?: (traceId: string, fields: Record<string, unknown>) => Promise<void>;
}) {
  const planCalls: unknown[] = [];
  const attachCalls: Array<{
    traceId: string;
    fields: Record<string, unknown>;
  }> = [];

  const planner = {
    plan: async (input: unknown) => {
      planCalls.push(input);
      return opts.plan ? await opts.plan() : EXECUTABLE_OUTCOME;
    },
  } as unknown as AiCommandPlannerService;

  const commandTrace = {
    attachPlanFields: async (
      traceId: string,
      fields: Record<string, unknown>,
    ) => {
      attachCalls.push({ traceId, fields });
      if (opts.attach) await opts.attach(traceId, fields);
    },
  } as unknown as AiCommandTraceService;

  const config = {
    get: (key: string) =>
      key === PLANNER_SHADOW_SURFACES_KEY ? opts.surfaces : undefined,
  } as unknown as ConstructorParameters<typeof AiPlannerShadowService>[2];

  return {
    service: new AiPlannerShadowService(planner, commandTrace, config),
    planCalls,
    attachCalls,
  };
}

const REQUEST = {
  traceId: 'trace-1',
  businessId: 'biz-1',
  surface: 'dashboard' as const,
  tier: 'owner' as const,
  message: 'move my 3pm to tomorrow',
};

describe('parseShadowSurfaces', () => {
  it('treats unset/empty as disabled', () => {
    expect(parseShadowSurfaces(undefined).size).toBe(0);
    expect(parseShadowSurfaces('').size).toBe(0);
    expect(parseShadowSurfaces('   ').size).toBe(0);
  });

  it('parses a comma list, tolerating spacing and case', () => {
    const parsed = parseShadowSurfaces(' Dashboard , provider ');
    expect([...parsed].sort()).toEqual(['dashboard', 'provider']);
  });

  it('ignores unknown surface names rather than trusting the env var', () => {
    expect([...parseShadowSurfaces('dashboard,nonsense')]).toEqual([
      'dashboard',
    ]);
  });
});

describe('AiPlannerShadowService', () => {
  const originalEnv = process.env[PLANNER_SHADOW_SURFACES_KEY];

  afterEach(() => {
    if (originalEnv === undefined)
      delete process.env[PLANNER_SHADOW_SURFACES_KEY];
    else process.env[PLANNER_SHADOW_SURFACES_KEY] = originalEnv;
  });

  it('is off by default — no config, no env, no planner call', async () => {
    delete process.env[PLANNER_SHADOW_SURFACES_KEY];
    const { service, planCalls, attachCalls } = build({});
    expect(service.isEnabledFor('dashboard')).toBe(false);
    await service.run(REQUEST);
    expect(planCalls).toHaveLength(0);
    expect(attachCalls).toHaveLength(0);
  });

  it('runs only for the surfaces explicitly listed', async () => {
    const { service, planCalls } = build({ surfaces: 'dashboard' });
    expect(service.isEnabledFor('dashboard')).toBe(true);
    expect(service.isEnabledFor('customer')).toBe(false);

    await service.run({ ...REQUEST, surface: 'customer' });
    expect(planCalls).toHaveLength(0);

    await service.run(REQUEST);
    expect(planCalls).toHaveLength(1);
  });

  it('falls back to the process env when no ConfigService is injected', async () => {
    process.env[PLANNER_SHADOW_SURFACES_KEY] = 'dashboard';
    const planner = {
      plan: async () => EXECUTABLE_OUTCOME,
    } as unknown as AiCommandPlannerService;
    const commandTrace = {
      attachPlanFields: async () => {},
    } as unknown as AiCommandTraceService;
    const service = new AiPlannerShadowService(planner, commandTrace);
    expect(service.isEnabledFor('dashboard')).toBe(true);
  });

  it('attaches the plan to the SAME trace row the gateway wrote', async () => {
    const { service, attachCalls } = build({ surfaces: 'dashboard' });
    await service.run(REQUEST);

    expect(attachCalls).toHaveLength(1);
    expect(attachCalls[0].traceId).toBe('trace-1');
    expect(attachCalls[0].fields.planOutcome).toBe('executable');
    expect(attachCalls[0].fields.planStepCount).toBe(1);
    expect(attachCalls[0].fields.planCommands).toEqual([
      'appointment.reschedule',
    ]);
    // Legacy names are what the shadow view compares against `classified_action`.
    expect(attachCalls[0].fields.planCommandsLegacy).toEqual([
      'reschedule_booking',
    ]);
  });

  it('passes the message, surface and business through to the planner', async () => {
    const { service, planCalls } = build({ surfaces: 'dashboard' });
    await service.run({ ...REQUEST, userId: 'u1', locale: 'hy' });

    const input = planCalls[0] as Record<string, unknown>;
    expect(input.businessId).toBe('biz-1');
    expect(input.surface).toBe('dashboard');
    expect(input.message).toBe('move my 3pm to tomorrow');
    expect(input.userId).toBe('u1');
    expect((input.context as Record<string, unknown>).locale).toBe('hy');
    // `today` is always supplied so the planner can resolve "tomorrow".
    expect((input.context as Record<string, unknown>).today).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });

  it('omits optional context keys instead of sending undefined', async () => {
    const { service, planCalls } = build({ surfaces: 'dashboard' });
    await service.run(REQUEST);
    const context = (planCalls[0] as Record<string, unknown>).context as Record<
      string,
      unknown
    >;
    expect('locale' in context).toBe(false);
    expect('timeZone' in context).toBe(false);
  });

  it('never throws when the planner rejects', async () => {
    const { service, attachCalls } = build({
      surfaces: 'dashboard',
      plan: () => Promise.reject(new Error('openai 503')),
    });
    await expect(service.run(REQUEST)).resolves.toBeUndefined();
    expect(attachCalls).toHaveLength(0);
  });

  it('never throws when the trace update rejects', async () => {
    const { service } = build({
      surfaces: 'dashboard',
      attach: () => Promise.reject(new Error('db down')),
    });
    await expect(service.run(REQUEST)).resolves.toBeUndefined();
  });

  it('records clarify outcomes too — the disagreement queue needs them', async () => {
    const clarify: PlanOutcome = {
      status: 'clarify',
      plan: {
        steps: [],
        unresolved: ['which appointment?'],
        topicChanged: false,
      },
      validation: {
        executable: false,
        orderedStepIds: [],
        problems: [
          { code: 'missing_variables', stepId: 's1', details: ['startsAt'] },
        ],
        requiresConfirmation: false,
        highestRisk: 'T0',
      },
      question: 'Which appointment did you mean?',
      repairs: [],
    };
    const { service, attachCalls } = build({
      surfaces: 'dashboard',
      plan: async () => clarify,
    });
    await service.run(REQUEST);
    expect(attachCalls[0].fields.planOutcome).toBe('clarify');
    expect(attachCalls[0].fields.planProblems).toHaveLength(1);
  });

  it('runInBackground returns void synchronously and does not throw', async () => {
    const { service, planCalls } = build({
      surfaces: 'dashboard',
      plan: () => Promise.reject(new Error('boom')),
    });
    expect(service.runInBackground(REQUEST)).toBeUndefined();
    // Let the detached promise settle; the rejection must already be handled.
    await new Promise((resolve) => setImmediate(resolve));
    expect(planCalls).toHaveLength(1);
  });

  it('runInBackground skips disabled surfaces without scheduling any work', () => {
    const { service, planCalls } = build({ surfaces: 'provider' });
    service.runInBackground(REQUEST);
    expect(planCalls).toHaveLength(0);
  });
});
