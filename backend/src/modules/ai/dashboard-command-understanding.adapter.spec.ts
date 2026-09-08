import { Test, type TestingModule } from '@nestjs/testing';
import {
  DashboardCommandUnderstandingAdapter,
  buildDashboardClassifyCallbacks,
  buildDashboardClassifierContext,
  buildDashboardUnderstandInput,
} from './dashboard-command-understanding.adapter.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import {
  DASHBOARD_COMMAND_UNDERSTANDING_SURFACE,
  DASHBOARD_UNDERSTANDING_ADAPTER_PIPE_MARKER,
} from './command-understanding-adapter.types.js';
import type { ClassifierCatalog } from './ai-command-routing.util.js';

const catalog: ClassifierCatalog = {
  employees: [{ id: 'e1', name: 'Anna' } as never],
  services: [{ id: 's1', name: 'Haircut' } as never],
  customers: [{ id: 'c1', name: 'James' } as never],
  templates: [],
};

describe('dashboard-command-understanding.adapter (pipe-1.12.1)', () => {
  it('exports pipe marker and dashboard surface constant', () => {
    expect(DASHBOARD_UNDERSTANDING_ADAPTER_PIPE_MARKER).toBe('pipe-1.12.1');
    expect(DASHBOARD_COMMAND_UNDERSTANDING_SURFACE).toBe('dashboard');
  });

  describe('buildDashboardClassifierContext', () => {
    it('appends HY/RU classifier hint to catalog context', () => {
      const context = buildDashboardClassifierContext({
        catalog,
        timeZone: 'Asia/Yerevan',
        pipelineContext: {
          originalPrompt: 'Կտրվածք',
          normalizedPrompt: 'Կտրվածք',
          classifierContext: 'User locale: hy',
          method: 'passthrough',
        },
      });

      expect(context).toContain('Anna');
      expect(context).toContain('User locale: hy');
    });
  });

  describe('buildDashboardClassifyCallbacks', () => {
    it('passes normalized prompt and merged catalog context to classify', async () => {
      const classify = jest.fn().mockResolvedValue({
        action: 'create_booking',
        params: {},
        reasoning: 'test',
        confidence: 0.9,
      });

      const { classify: classifyStage } = buildDashboardClassifyCallbacks({
        catalog,
        timeZone: 'Asia/Yerevan',
        classify,
      });

      await classifyStage({
        originalPrompt: 'book haircut',
        normalizedPrompt: 'book haircut tomorrow',
        classifierContext: null,
        method: 'passthrough',
      });

      expect(classify).toHaveBeenCalledWith(
        'book haircut tomorrow',
        expect.stringContaining('Anna'),
      );
    });

    it('forwards narrow shortlist on narrow re-classify', async () => {
      const classify = jest.fn().mockResolvedValue({
        action: 'create_booking',
        params: {},
        reasoning: 'narrow',
        confidence: 0.72,
      });

      const { narrowReclassify } = buildDashboardClassifyCallbacks({
        catalog,
        timeZone: 'Asia/Yerevan',
        classify,
      });

      await narrowReclassify!(['create_booking', 'book_nearest_slot'], {
        originalPrompt: 'hair long',
        normalizedPrompt: 'hair long',
        classifierContext: null,
        method: 'passthrough',
      });

      expect(classify).toHaveBeenCalledWith(
        'hair long',
        expect.stringContaining('Haircut'),
        ['create_booking', 'book_nearest_slot'],
      );
    });
  });

  describe('buildDashboardUnderstandInput', () => {
    it('maps dashboard deps to pipeline input with confidence bands', () => {
      const input = buildDashboardUnderstandInput({
        businessId: 'biz-dash',
        userId: 'user-1',
        effectivePrompt: 'My hair is getting long',
        timeZone: 'Asia/Yerevan',
        catalog,
        confidence: { low: 0.61, high: 0.88 },
        sessionConfidenceHigh: 0.9,
        lastAction: 'check_providers_for_service',
        sessionContext: { timeZone: 'Asia/Yerevan' },
        classify: jest.fn(),
      });

      expect(input.surface).toBe('dashboard');
      expect(input.confidenceLow).toBe(0.61);
      expect(input.confidenceHigh).toBe(0.9);
      expect(input.employees).toEqual([{ id: 'e1', name: 'Anna' }]);
      expect(input.customers).toEqual([{ id: 'c1', name: 'James' }]);
      expect(input.lastAction).toBe('check_providers_for_service');
      expect(input.classify).toEqual(expect.any(Function));
      expect(input.narrowReclassify).toEqual(expect.any(Function));
    });

    it('forwards the location roster, because e2e-bug.460 depends on it', () => {
      // §216 — pinned after a wrong diagnosis. `e2e-bug.484` claimed nothing
      // populated `catalog.locations`, so the staff-vs-location disambiguation
      // was inert on this surface. It is not: `executeCommand` loads the roster
      // and the branch-scope path preserves it through a spread. The reason the
      // field was invisible is that the intermediate parameter types omitted it
      // (fixed in §216), not that it was absent. This test asserts the roster
      // reaches the pipeline, so the claim cannot be re-made from a grep.
      const input = buildDashboardUnderstandInput({
        businessId: 'biz-dash',
        userId: 'user-1',
        effectivePrompt: 'move Downtown to 9am',
        timeZone: 'Asia/Yerevan',
        catalog: {
          ...catalog,
          locations: [{ id: 'loc-1', name: 'Downtown' }],
        },
        confidence: { low: 0.6, high: 0.9 },
        sessionContext: {},
        classify: jest.fn(),
      });

      expect(input.locations).toEqual([{ id: 'loc-1', name: 'Downtown' }]);
    });

    it('degrades to an empty roster when the producer omits locations', () => {
      // The optional half of the same contract: a surface that never loads
      // locations must not crash or pass undefined into the rescue chain.
      const input = buildDashboardUnderstandInput({
        businessId: 'biz-dash',
        userId: 'user-1',
        effectivePrompt: 'move Downtown to 9am',
        timeZone: 'Asia/Yerevan',
        catalog,
        confidence: { low: 0.6, high: 0.9 },
        sessionContext: {},
        classify: jest.fn(),
      });

      expect(input.locations).toEqual([]);
    });
  });

  describe('DashboardCommandUnderstandingAdapter', () => {
    let adapter: DashboardCommandUnderstandingAdapter;
    let understandMock: jest.Mock;

    beforeEach(async () => {
      understandMock = jest.fn().mockResolvedValue({
        status: 'resolved',
        action: 'create_booking',
        params: {},
        reasoning: 'adapter',
        confidence: 0.91,
        candidates: [],
        trace: [],
        gate: {},
        context: {},
        normalization: {},
        surface: 'dashboard',
      });

      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          DashboardCommandUnderstandingAdapter,
          {
            provide: CommandUnderstandingPipelineService,
            useValue: { understand: understandMock },
          },
        ],
      }).compile();

      adapter = moduleRef.get(DashboardCommandUnderstandingAdapter);
    });

    it('delegates understand to CommandUnderstandingPipelineService', async () => {
      const classify = jest.fn();
      await adapter.understand({
        businessId: 'biz-adapter',
        effectivePrompt: 'Need a trim soon',
        timeZone: 'Asia/Yerevan',
        catalog,
        confidence: { low: 0.65, high: 0.82 },
        classify,
      });

      expect(understandMock).toHaveBeenCalledTimes(1);
      expect(understandMock.mock.calls[0][0].surface).toBe('dashboard');
      expect(understandMock.mock.calls[0][0].businessId).toBe('biz-adapter');
    });

    it('createResolveRoute memoizes merged complexity routing', async () => {
      const intelligence = {
        routeComplexity: jest.fn().mockResolvedValue({
          tier: 'orchestration',
          useDecomposition: false,
          reasoning: 'llm',
        }),
      };
      const router = {
        routeDeterministic: jest.fn().mockReturnValue({
          tier: 'simple_mutate',
          useDecomposition: false,
          reasoning: 'det',
        }),
        mergeRoutes: jest.fn().mockImplementation((_llm, det) => det),
      };

      const resolveRoute = adapter.createResolveRoute({
        businessId: 'biz-route',
        classifierPrompt: 'Show schedule',
        employees: catalog.employees,
        router,
        intelligence,
      });

      const [first, second] = await Promise.all([
        resolveRoute(),
        resolveRoute(),
      ]);

      expect(first).toBe(second);
      expect(intelligence.routeComplexity).toHaveBeenCalledTimes(1);
    });
  });
});
