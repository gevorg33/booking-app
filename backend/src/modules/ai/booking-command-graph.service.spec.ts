import { BookingCommandGraphService } from './booking-command-graph.service.js';
import { BookingAgentRouterService } from '../../engine/langgraph/services/booking-agent-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { CompoundCommandGraphService } from './compound-command-graph.service.js';
import { CommandReasoningService } from './command-reasoning.service.js';
import { ReactBookingAgentService } from '../../engine/langgraph/services/react-booking-agent.service.js';
import { ReactResultCompilerService } from './react-result-compiler.service.js';

describe('BookingCommandGraphService', () => {
  const router = {
    useCommandGraph: () => true,
    useReactAgent: () => false,
    useCompoundGraph: () => false,
  } as BookingAgentRouterService;

  const decomposition = {
    isCompoundPrompt: (p: string) => /\band then\b/i.test(p),
    isGoalExecutionPrompt: (p: string) =>
      /set up my new stylist/i.test(p),
    decomposeGoal: jest.fn(async () => []),
    decomposeGoalWithCapabilities: jest.fn(async () => []),
    decompose: jest.fn(async () => [
      { action: 'cancel_bookings', params: {}, reasoning: 'cancel' },
      { action: 'clear_schedule', params: {}, reasoning: 'clear' },
    ]),
  } as unknown as IntentDecompositionService;

  const compoundGraph = {} as CompoundCommandGraphService;
  const reasoning = {
    enrichResult: jest.fn(async (_biz, _prompt, result) => result),
  } as unknown as CommandReasoningService;
  const reactAgent = {} as ReactBookingAgentService;
  const reactCompiler = {} as ReactResultCompilerService;

  const graph = new BookingCommandGraphService(
    router,
    decomposition,
    compoundGraph,
    reasoning,
    reactAgent,
    reactCompiler,
  );

  const baseInput = {
    businessId: 'biz-1',
    prompt: 'Cancel all and then clear schedule',
    effectivePrompt: 'Cancel all and then clear schedule',
    catalog: { employees: [], services: [], customers: [], templates: [] },
    timeZone: 'UTC',
    confidenceThresholds: { low: 0.5, high: 0.85 },
    delegates: {
      executeSingleIntent: jest.fn(async () => ({
        success: true,
        action: 'list_bookings',
        summary: 'single',
        details: {},
      })),
      buildCompoundPlan: jest.fn(),
      toCommandResult: jest.fn(),
      executeLegacyCompound: jest.fn(async () => ({
        success: true,
        action: 'compound',
        summary: 'compound',
        details: { subIntents: ['a', 'b'] },
      })),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses compound path when complexity route tier is compound', async () => {
    await graph.run({
      ...baseInput,
      complexityRoute: { tier: 'compound', useDecomposition: true },
    });

    expect(baseInput.delegates.executeLegacyCompound).toHaveBeenCalled();
    expect(baseInput.delegates.executeSingleIntent).not.toHaveBeenCalled();
  });

  it('uses single-intent delegate for simple_mutate route', async () => {
    await graph.run({
      ...baseInput,
      effectivePrompt: 'Book facemassage tomorrow at 10:00',
      prompt: 'Book facemassage tomorrow at 10:00',
      complexityRoute: { tier: 'simple_mutate', useDecomposition: false },
    });

    expect(baseInput.delegates.executeSingleIntent).toHaveBeenCalled();
    expect(baseInput.delegates.executeLegacyCompound).not.toHaveBeenCalled();
  });

  it('prefers compound markers in prompt even when route is simple_mutate', async () => {
    await graph.run({
      ...baseInput,
      complexityRoute: { tier: 'simple_mutate', useDecomposition: false },
    });

    expect(baseInput.delegates.executeLegacyCompound).toHaveBeenCalled();
  });

  it('parity-3.2 — routes goal prompts through compound execution path', async () => {
    (decomposition.decomposeGoalWithCapabilities as jest.Mock).mockResolvedValueOnce([
      {
        action: 'assign_employee_services',
        params: { employeeName: 'Anna' },
        reasoning: 'goal step 1',
      },
      {
        action: 'apply_schedule',
        params: { employeeName: 'Anna' },
        reasoning: 'goal step 2',
      },
    ]);

    await graph.run({
      ...baseInput,
      effectivePrompt: 'Set up my new stylist Anna end-to-end',
      prompt: 'Set up my new stylist Anna end-to-end',
      session: {
        context: {
          _accessTier: 'owner',
          _planTierId: 'business',
        },
      },
      complexityRoute: { tier: 'simple_mutate', useDecomposition: false },
    });

    expect(decomposition.decomposeGoalWithCapabilities).toHaveBeenCalled();
    expect(baseInput.delegates.executeLegacyCompound).toHaveBeenCalled();
    expect(baseInput.delegates.executeSingleIntent).not.toHaveBeenCalled();
  });
});
