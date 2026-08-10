/**
 * e2e-bug.348 — the LLM's compound steps used to win unconditionally, losing the
 * category link on "create a category with these services".
 */
import { chooseCatalogCompoundSteps } from './ai-catalog.logic.js';

const PROMPT =
  'Create a category Y with three services: service A, 30 minutes, $50; service B, 45 minutes, $45; service C, 60 minutes, $70.';

const step = (action: string, params: Record<string, unknown> = {}) =>
  ({ action, params }) as never;

describe('chooseCatalogCompoundSteps', () => {
  it('falls back to the deterministic decomposition when the LLM supplies none', () => {
    const steps = chooseCatalogCompoundSteps(PROMPT, undefined);
    expect(steps.map((s) => s.action)).toEqual(['bulk_create_catalog']);
  });

  it('replaces LLM create_services with the deterministic draft that keeps the category', () => {
    const steps = chooseCatalogCompoundSteps(PROMPT, [
      step('create_services', { names: ['service A', 'service B', 'service C'] }),
    ]);
    expect(steps.map((s) => s.action)).toEqual(['bulk_create_catalog']);
    const draft = (steps[0].params as { catalogDraft: { categoryName: string; services: unknown[] } })
      .catalogDraft;
    expect(draft.categoryName).toBe('Y');
    expect(draft.services).toHaveLength(3);
  });

  it('keeps every other LLM step, in order', () => {
    // The case a blanket "prefer deterministic" broke: category + services AND
    // a package. The deterministic path yields one step; preferring it wholesale
    // would silently drop the package.
    const steps = chooseCatalogCompoundSteps(PROMPT, [
      step('create_services', {}),
      step('create_package', { packageName: 'Bundle' }),
    ]);
    expect(steps.map((s) => s.action)).toEqual([
      'bulk_create_catalog',
      'create_package',
    ]);
  });

  it('preserves ordering when the service step is not first', () => {
    const steps = chooseCatalogCompoundSteps(PROMPT, [
      step('create_package', { packageName: 'Bundle' }),
      step('create_services', {}),
    ]);
    expect(steps.map((s) => s.action)).toEqual([
      'create_package',
      'bulk_create_catalog',
    ]);
  });

  it('leaves the LLM plan alone when it already creates the category', () => {
    const llm = [step('bulk_create_catalog', { catalogDraft: { categoryName: 'Z', services: [{}] } })];
    expect(chooseCatalogCompoundSteps(PROMPT, llm)).toBe(llm);
  });

  it('leaves the LLM plan alone when it has no service-creating step', () => {
    const llm = [step('create_package', {}), step('create_subscription_plan', {})];
    expect(chooseCatalogCompoundSteps(PROMPT, llm)).toBe(llm);
  });

  it('leaves the LLM plan alone when the prompt yields no complete draft', () => {
    // No category named, so there is no link to repair and nothing to prefer.
    const llm = [step('create_services', {})];
    expect(chooseCatalogCompoundSteps('add a 30 minute $40 massage', llm)).toBe(llm);
  });
});
