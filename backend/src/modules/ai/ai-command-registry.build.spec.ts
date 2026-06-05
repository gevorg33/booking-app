import {
  buildCommandRegistry,
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
  CUSTOMER_INTENTS,
  ORCHESTRATION_INTENT_IDS,
  resolveIntentSurfaces,
  validateRegistryAgainstCapabilityMatrix,
} from './ai-command-registry.build.js';
import {
  buildCommandRegistry as buildCommandRegistryReexport,
  buildCompoundCommandRecipes as buildCompoundCommandRecipesReexport,
  collectCompoundStepIds as collectCompoundStepIdsReexport,
  ORCHESTRATION_INTENT_IDS as orchestrationIdsReexport,
  validateRegistryAgainstCapabilityMatrix as validateRegistryReexport,
} from './ai-command-registry.js';

describe('ai-command-registry.build', () => {
  it('re-exports build helpers from the registry barrel', () => {
    const recipes = buildCompoundCommandRecipesReexport();
    const compoundIds = collectCompoundStepIdsReexport(recipes);
    const registry = buildCommandRegistryReexport(compoundIds);
    expect(registry.length).toBeGreaterThan(200);
    expect(validateRegistryReexport(registry)).toEqual([]);
    expect(orchestrationIdsReexport.has('optimize_schedule')).toBe(true);
  });

  it('builds entries for every capability intent', () => {
    const compoundIds = collectCompoundStepIds(buildCompoundCommandRecipes());
    const registry = buildCommandRegistry(compoundIds);
    expect(registry.length).toBeGreaterThan(200);
    expect(registry.every((entry) => entry.surfaces.length > 0)).toBe(true);
  });

  it('classifies unknown as read-only with all tiers and no mutation', () => {
    const registry = buildCommandRegistry(new Set());
    const unknown = registry.find((entry) => entry.id === 'unknown');
    expect(unknown?.executionMode).toBe('read_only');
    expect(unknown?.mutating).toBe(false);
    expect(unknown?.tiers).toEqual(
      expect.arrayContaining(['client', 'staff', 'manager', 'owner']),
    );
  });

  it('marks orchestration intents from the orchestration set', () => {
    const registry = buildCommandRegistry(new Set());
    for (const id of ORCHESTRATION_INTENT_IDS) {
      expect(registry.find((entry) => entry.id === id)?.executionMode).toBe(
        'orchestration',
      );
    }
    expect(
      registry.find((entry) => entry.id === 'create_booking_cash')
        ?.executionMode,
    ).toBe('simple_mutate');
    expect(
      registry.find((entry) => entry.id === 'list_bookings')?.executionMode,
    ).toBe('read_only');
  });

  it('scopes customer intents to client tier and sprint seeds to sprint metadata', () => {
    const registry = buildCommandRegistry(new Set());
    expect(
      registry.find((entry) => entry.id === 'book_package')?.surfaces,
    ).toContain('customer');
    expect(
      registry.find((entry) => entry.id === 'book_package')?.tiers,
    ).toEqual(['client']);
    expect(
      registry.find((entry) => entry.id === 'create_booking_cash')?.sprint,
    ).toBe('bookingDepth');
    expect(
      registry.find((entry) => entry.id === 'list_bookings')?.sprint,
    ).toBeUndefined();
  });

  it('applies surface handler overrides and legacy default handlers', () => {
    const registry = buildCommandRegistry(new Set());
    const markPaid = registry.find((entry) => entry.id === 'mark_paid');
    expect(markPaid?.surfaceHandlers?.dashboard).toBe('AiBookingDepthService');
    expect(markPaid?.surfaceHandlers?.provider).toBe(
      'AiProviderBookingService',
    );
    expect(
      registry.find((entry) => entry.id === 'list_bookings')?.handler,
    ).toBe('AiCommandService');
    expect(
      registry.find((entry) => entry.id === 'list_bookings')?.surfaceHandlers
        ?.provider,
    ).toBe('ProviderAiCommandService');
  });

  it('flags compound-step eligibility from recipe step ids', () => {
    const compoundIds = new Set(['mark_paid', 'book_package']);
    const registry = buildCommandRegistry(compoundIds);
    expect(
      registry.find((entry) => entry.id === 'mark_paid')?.compoundStep,
    ).toBe(true);
    expect(
      registry.find((entry) => entry.id === 'list_bookings')?.compoundStep,
    ).toBe(false);
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
      recipes.find((recipe) => recipe.id === 'dashboard_operational_compound')
        ?.llmDecompose,
    ).toBe(true);
  });

  it('validates registry alignment against capability matrix lists', () => {
    const registry = buildCommandRegistry(
      collectCompoundStepIds(buildCompoundCommandRecipes()),
    );
    expect(validateRegistryAgainstCapabilityMatrix(registry)).toEqual([]);

    const drift = validateRegistryAgainstCapabilityMatrix([
      {
        id: 'synthetic_missing_intent',
        surfaces: ['dashboard'],
        tiers: ['owner'],
        mutating: false,
        executionMode: 'read_only',
        apiModule: 'ai-command',
        handler: 'AiCommandService',
        compoundStep: false,
      },
    ]);
    expect(drift.some((msg) => msg.includes('Missing dashboard intent'))).toBe(
      true,
    );
    expect(drift.some((msg) => msg.includes('Missing provider intent'))).toBe(
      true,
    );
    expect(drift.some((msg) => msg.includes('Missing public intent'))).toBe(
      true,
    );
    expect(drift.some((msg) => msg.includes('Missing customer intent'))).toBe(
      true,
    );
  });
});
