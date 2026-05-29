import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';

describe('CommandComplexityRouterService', () => {
  const decomposition = { isCompoundPrompt: (p: string) => /\band then\b|;\s*/i.test(p) } as IntentDecompositionService;
  const router = new CommandComplexityRouterService(decomposition);
  const employees = [
    { id: '1', name: 'Gevorg Gasparyan' },
    { id: '2', name: 'Mary Torgomyan' },
  ];

  it('routes compound prompts', () => {
    const route = router.routeDeterministic(
      'Cancel all appointments and then clear schedule for Gevorg',
      employees,
    );
    expect(route.tier).toBe('compound');
    expect(route.useDecomposition).toBe(true);
  });

  it('routes period-separated compound prompts', () => {
    const route = router.routeDeterministic(
      'Cancel appointments. Clear schedule for Mary.',
      employees,
    );
    expect(route.tier).toBe('compound');
  });

  it('routes read-only availability queries', () => {
    const route = router.routeDeterministic('Who can do facemassage today?', employees);
    expect(route.tier).toBe('read_only');
  });

  it('routes orchestration for optimize prompts', () => {
    const route = router.routeDeterministic('Optimize schedule for tomorrow', employees);
    expect(route.tier).toBe('orchestration');
  });

  it('routes provider fallback booking to orchestration', () => {
    const route = router.routeDeterministic(
      'Book facemassage on Gevorg tomorrow at 9; if not available then Mary; if not whoever is free',
      employees,
    );
    expect(route.tier).toBe('orchestration');
  });

  it('routes simple booking mutations', () => {
    const route = router.routeDeterministic(
      'Book facemassage with Gevorg tomorrow at 10:00',
      employees,
    );
    expect(route.tier).toBe('simple_mutate');
  });

  it('merges LLM route with deterministic fallback', () => {
    const merged = router.mergeRoutes(
      { tier: 'orchestration', useDecomposition: false, reasoning: 'LLM' },
      { tier: 'simple_mutate', useDecomposition: false, reasoning: 'det' },
    );
    expect(merged.tier).toBe('orchestration');
    expect(merged.reasoning).toBe('LLM');
  });
});
