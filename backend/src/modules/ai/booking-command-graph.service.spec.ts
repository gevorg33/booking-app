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

  const reactAgent = {
    run: jest.fn(),
  } as unknown as ReactBookingAgentService;

  const reactCompiler = {
    compile: jest.fn(),
  } as unknown as ReactResultCompilerService;

  const decomposition = {
    isCompoundPrompt: (p: string) => /\band then\b/i.test(p),
    decompose: jest.fn(async () => [
      { action: 'cancel_bookings', params: {} },
      { action: 'clear_schedule', params: {} },
    ]),
  } as unknown as IntentDecompositionService;

  const compoundGraph = {} as CompoundCommandGraphService;
  const reasoning = {
    enrichResult: jest.fn(async (_biz, _prompt, result) => result),
  } as unknown as CommandReasoningService;

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

  describe('ReAct fallback (pipe-1.9.2)', () => {
    const reactRouter = {
      useCommandGraph: () => true,
      useReactAgent: () => true,
      useCompoundGraph: () => false,
    } as BookingAgentRouterService;

    const reactGraph = new BookingCommandGraphService(
      reactRouter,
      decomposition,
      compoundGraph,
      reasoning,
      reactAgent,
      reactCompiler,
    );

    it('invokes ReAct only when pipeline returns unknown', async () => {
      (reactAgent.run as jest.Mock).mockResolvedValue({
        messages: [],
        proposals: [{ action: 'create_booking', params: {} }],
      });
      (reactCompiler.compile as jest.Mock).mockResolvedValue({
        success: true,
        action: 'react_agent',
        summary: 'ReAct proposal',
        details: { langGraphPath: 'react_agent' },
      });

      const unknownResult = {
        success: false,
        action: 'unknown',
        summary: 'clarify',
        details: { needsClarification: true },
      };

      const input = {
        ...baseInput,
        effectivePrompt: 'help me figure out what to do with tomorrow',
        prompt: 'help me figure out what to do with tomorrow',
        complexityRoute: { tier: 'orchestration' as const },
        delegates: {
          ...baseInput.delegates,
          executeSingleIntent: jest.fn(async () => unknownResult),
        },
      };

      const result = await reactGraph.run(input);

      expect(input.delegates.executeSingleIntent).toHaveBeenCalled();
      expect(reactAgent.run).toHaveBeenCalled();
      expect(reactCompiler.compile).toHaveBeenCalled();
      expect(result.action).toBe('react_agent');
      expect(result.details.reactFallback).toBe(true);
      expect(result.details.pipeMarker).toBe('pipe-1.9.2');
    });

    it('skips ReAct when pipeline resolves a concrete intent', async () => {
      const input = {
        ...baseInput,
        effectivePrompt: 'Optimize tomorrow schedule',
        prompt: 'Optimize tomorrow schedule',
        complexityRoute: { tier: 'orchestration' as const },
        delegates: {
          ...baseInput.delegates,
          executeSingleIntent: jest.fn(async () => ({
            success: true,
            action: 'optimize_schedule',
            summary: 'optimized',
            details: {},
          })),
        },
      };

      await reactGraph.run(input);

      expect(input.delegates.executeSingleIntent).toHaveBeenCalled();
      expect(reactAgent.run).not.toHaveBeenCalled();
    });

    it('returns pipeline unknown when ReAct fallback fails', async () => {
      (reactAgent.run as jest.Mock).mockResolvedValue({ error: 'llm down' });

      const unknownResult = {
        success: false,
        action: 'unknown',
        summary: 'still unknown',
        details: {},
      };

      const input = {
        ...baseInput,
        effectivePrompt: 'something vague',
        prompt: 'something vague',
        complexityRoute: { tier: 'orchestration' as const },
        delegates: {
          ...baseInput.delegates,
          executeSingleIntent: jest.fn(async () => unknownResult),
        },
      };

      const result = await reactGraph.run(input);

      expect(reactAgent.run).toHaveBeenCalled();
      expect(result).toEqual(unknownResult);
    });
  });
});
