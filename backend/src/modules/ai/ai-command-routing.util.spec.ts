import {
  appendMultilingualClassifierContext,
  buildClassifierCatalogContext,
  resolveMergedComplexityRoute,
  resolveParsedIntent,
  runParallelRouteAndClassification,
} from './ai-command-routing.util.js';
import type { ClassifiedIntent } from './ai-command-routing.util.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';

const decomposition = {
  isCompoundPrompt: (p: string) => /\band then\b/i.test(p),
} as IntentDecompositionService;

const router = new CommandComplexityRouterService(decomposition);

const employees = [
  { id: 'emp-1', name: 'Gevorg Gasparyan', businessId: 'biz-1', isActive: true } as any,
  { id: 'emp-2', name: 'Mary Torgomyan', businessId: 'biz-1', isActive: true } as any,
];

const catalog = {
  employees,
  services: [{ id: 'svc-1', name: 'facemassage', businessId: 'biz-1' } as any],
  customers: [{ id: 'cust-1', name: 'Anna', businessId: 'biz-1', isActive: true } as any],
  templates: [{ id: 'tpl-1', name: 'Weekday 9-17', businessId: 'biz-1', isDeleted: false } as any],
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('ai-command-routing.util', () => {
  describe('buildClassifierCatalogContext', () => {
    it('includes employees, services, customers, and templates', () => {
      const ctx = buildClassifierCatalogContext(catalog, 'Asia/Yerevan');
      expect(ctx).toContain('Available employees:');
      expect(ctx).toContain('Gevorg Gasparyan (id: emp-1)');
      expect(ctx).toContain('facemassage (id: svc-1)');
      expect(ctx).toContain('Anna (id: cust-1)');
      expect(ctx).toContain('Weekday 9-17');
      expect(ctx).toContain('timezone: Asia/Yerevan');
    });

    it('shows none when there are no schedule templates', () => {
      const ctx = buildClassifierCatalogContext(
        { ...catalog, templates: [] },
        'UTC',
      );
      expect(ctx).toContain('Schedule templates: none');
    });
  });

  describe('appendMultilingualClassifierContext', () => {
    it('appends Armenian hint when present', () => {
      const base = 'Available employees: Gevorg';
      const hint = 'User command (may be Armenian/Russian/transliteration): "Ցույց տուր"';
      expect(appendMultilingualClassifierContext(base, hint)).toBe(`${base}\n${hint}`);
    });

    it('returns catalog context unchanged when hint is null', () => {
      const base = 'Available employees: Gevorg';
      expect(appendMultilingualClassifierContext(base, null)).toBe(base);
    });
  });

  describe('resolveMergedComplexityRoute', () => {
    it('skips LLM when preset route is provided', async () => {
      const intelligence = {
        routeComplexity: jest.fn(),
      };

      const merged = await resolveMergedComplexityRoute(
        'biz-1',
        'Show appointments today',
        employees,
        router,
        intelligence,
        { tier: 'read_only', useDecomposition: false, reasoning: 'preset' },
      );

      expect(intelligence.routeComplexity).not.toHaveBeenCalled();
      expect(merged.tier).toBe('read_only');
      expect(merged.reasoning).toBe('preset');
    });

    it('skips LLM when deterministic route is read_only (ai-i10)', async () => {
      const intelligence = {
        routeComplexity: jest.fn(),
      };

      const merged = await resolveMergedComplexityRoute(
        'biz-1',
        'Show appointments today',
        employees,
        router,
        intelligence,
      );

      expect(intelligence.routeComplexity).not.toHaveBeenCalled();
      expect(merged.tier).toBe('read_only');
    });

    it('calls LLM and merges with deterministic route when no preset', async () => {
      const intelligence = {
        routeComplexity: jest.fn(async () => ({
          tier: 'orchestration' as const,
          useDecomposition: false,
          reasoning: 'LLM',
        })),
      };

      const merged = await resolveMergedComplexityRoute(
        'biz-1',
        'Optimize schedule for tomorrow',
        employees,
        router,
        intelligence,
      );

      expect(intelligence.routeComplexity).toHaveBeenCalledWith(
        'biz-1',
        'Optimize schedule for tomorrow',
        'dashboard',
      );
      expect(merged.tier).toBe('orchestration');
      expect(merged.reasoning).toBe('LLM');
    });

    it('uses deterministic compound tier when LLM returns null tier', async () => {
      const intelligence = {
        routeComplexity: jest.fn(async () => ({
          tier: undefined as unknown as 'simple_mutate',
          useDecomposition: true,
        })),
      };

      const merged = await resolveMergedComplexityRoute(
        'biz-1',
        'Cancel all and then clear schedule',
        employees,
        router,
        intelligence,
      );

      expect(merged.tier).toBe('compound');
    });
  });

  describe('runParallelRouteAndClassification', () => {
    it('starts route and classify before either completes', async () => {
      let routeStarted = false;
      let classifyStarted = false;

      await runParallelRouteAndClassification({
        resolveRoute: async () => {
          routeStarted = true;
          await delay(25);
          expect(classifyStarted).toBe(true);
          return { tier: 'simple_mutate', useDecomposition: false };
        },
        classify: async () => {
          classifyStarted = true;
          await delay(25);
          expect(routeStarted).toBe(true);
          return {
            action: 'list_bookings',
            params: {},
            reasoning: 'test',
          };
        },
      });
    });

    it('returns both route and classification results', async () => {
      const result = await runParallelRouteAndClassification({
        resolveRoute: async () => ({
          tier: 'read_only',
          useDecomposition: false,
          reasoning: 'det',
        }),
        classify: async () => ({
          action: 'list_bookings',
          params: { date: '02/06/2026' },
          reasoning: 'list',
          confidence: 0.9,
        }),
      });

      expect(result.route.tier).toBe('read_only');
      expect(result.classification?.action).toBe('list_bookings');
    });

    it('propagates rejection when classify fails', async () => {
      await expect(
        runParallelRouteAndClassification({
          resolveRoute: async () => ({ tier: 'simple_mutate', useDecomposition: false }),
          classify: async () => {
            throw new Error('classify failed');
          },
        }),
      ).rejects.toThrow('classify failed');
    });
  });

  describe('resolveParsedIntent', () => {
    const classified: ClassifiedIntent = {
      action: 'list_bookings',
      params: {},
      reasoning: 'cached',
    };

    it('returns preclassified intent without calling classify', async () => {
      const classify = jest.fn();
      const parsed = await resolveParsedIntent({
        preclassified: classified,
        classify,
      });
      expect(parsed).toBe(classified);
      expect(classify).not.toHaveBeenCalled();
    });

    it('returns null when preclassified is null', async () => {
      const classify = jest.fn();
      const parsed = await resolveParsedIntent({
        preclassified: null,
        classify,
      });
      expect(parsed).toBeNull();
      expect(classify).not.toHaveBeenCalled();
    });

    it('calls classify when preclassified is undefined', async () => {
      const classify = jest.fn(async () => classified);
      const parsed = await resolveParsedIntent({ classify });
      expect(parsed).toEqual(classified);
      expect(classify).toHaveBeenCalledTimes(1);
    });
  });
});
