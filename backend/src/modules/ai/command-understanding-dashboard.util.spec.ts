import {
  buildDashboardResolveRoute,
  createMemoizedDashboardResolveRoute,
} from './command-understanding-dashboard.util.js';
import type { ComplexityRoute } from './command-complexity-router.service.js';

describe('command-understanding-dashboard.util (pipe-1.3.1)', () => {
  it('createMemoizedDashboardResolveRoute reuses one merged route promise', async () => {
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
    const resolveRoute = createMemoizedDashboardResolveRoute({
      businessId: 'biz-memo',
      classifierPrompt: 'reassign conflicting bookings',
      employees: [{ id: 'e1', name: 'Anna' } as never],
      router,
      intelligence,
    });

    const [first, second] = await Promise.all([resolveRoute(), resolveRoute()]);

    expect(first).toBe(second);
    expect(intelligence.routeComplexity).toHaveBeenCalledTimes(1);
  });

  it('buildDashboardResolveRoute delegates to resolveMergedComplexityRoute', async () => {
    const deterministic: ComplexityRoute = {
      tier: 'read_only',
      useDecomposition: false,
      reasoning: 'det',
    };
    const llm: ComplexityRoute = {
      tier: 'simple_mutate',
      useDecomposition: false,
      reasoning: 'llm',
    };
    const router = {
      routeDeterministic: jest.fn().mockReturnValue(deterministic),
      mergeRoutes: jest.fn().mockReturnValue(llm),
    };
    const intelligence = {
      routeComplexity: jest.fn().mockResolvedValue({
        tier: 'orchestration',
        useDecomposition: false,
        reasoning: 'llm raw',
      }),
    };

    const resolveRoute = buildDashboardResolveRoute({
      businessId: 'biz-dash',
      classifierPrompt: 'Show appointments today',
      employees: [{ id: 'e1', name: 'Anna' } as never],
      router,
      intelligence,
    });

    const route = await resolveRoute();

    expect(router.routeDeterministic).toHaveBeenCalledWith('Show appointments today', [
      { id: 'e1', name: 'Anna' },
    ]);
    expect(intelligence.routeComplexity).not.toHaveBeenCalled();
    expect(route).toEqual(deterministic);
  });
});
