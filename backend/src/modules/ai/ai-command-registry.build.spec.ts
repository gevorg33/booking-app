import {
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
  CUSTOMER_INTENTS,
  resolveIntentSurfaces,
} from './ai-command-registry.build.js';
import {
  COMMAND_REGISTRY,
  buildCompoundCommandRecipes as buildCompoundCommandRecipesReexport,
  collectCompoundStepIds as collectCompoundStepIdsReexport,
  ORCHESTRATION_INTENT_IDS as orchestrationIdsReexport,
  validateRegistryAgainstCapabilityMatrix as validateRegistryReexport,
} from './ai-command-registry.js';

describe('ai-command-registry.build', () => {
  it('re-exports build helpers from the registry barrel', () => {
    // §162 — `buildCommandRegistry` is gone; the barrel's registry is generated.
    // The helpers that remain are the compound-recipe ones and the validator.
    const recipes = buildCompoundCommandRecipesReexport();
    const compoundIds = collectCompoundStepIdsReexport(recipes);
    expect(compoundIds.size).toBeGreaterThan(0);
    expect(COMMAND_REGISTRY.length).toBeGreaterThan(200);
    expect(validateRegistryReexport(COMMAND_REGISTRY)).toEqual([]);
    expect(orchestrationIdsReexport.has('optimize_schedule')).toBe(true);
  });

  it('collects compound step ids from recipes', () => {
    expect(collectCompoundStepIds([]).size).toBe(0);
    const recipes = buildCompoundCommandRecipes();
    const ids = collectCompoundStepIds(recipes);
    expect(ids.has('mark_paid')).toBe(true);
    expect(ids.has('book_package')).toBe(true);
  });

  it('resolves empty surfaces for intents missing from bindings', () => {
    expect(resolveIntentSurfaces('synthetic_unbound_intent')).toEqual([]);
    expect(CUSTOMER_INTENTS).toContain('book_package');
  });

  it('builds compound recipes for dashboard, provider, customer, and public surfaces', () => {
    const recipes = buildCompoundCommandRecipes();
    const recipeIds = recipes.map((recipe) => recipe.id);
    expect(recipeIds).toEqual(
      expect.arrayContaining([
        'dashboard_operational_compound',
        'dashboard_catalog_compound',
        'provider_booking_compound',
        'customer_booking_compound',
        'customer_self_service_compound',
        'public_assistant_compound',
      ]),
    );
    expect(
      recipes.filter((recipe) => recipe.surfaces.includes('customer')).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      recipes.find((recipe) => recipe.id === 'public_assistant_compound')
        ?.surfaces,
    ).toEqual(expect.arrayContaining(['public', 'customer']));
    expect(
      recipes.find((recipe) => recipe.id === 'dashboard_operational_compound')
        ?.llmDecompose,
    ).toBe(true);
  });
});
