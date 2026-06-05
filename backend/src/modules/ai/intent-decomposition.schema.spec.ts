import {
  buildDecompositionSchemaView,
  listCompoundRecipeIds,
  resolveAllowedActionsFromRecipes,
  resolveMaxStepsFromRecipes,
} from './intent-decomposition.schema.js';
import { GOLDEN_COMPOUND_PATTERNS } from './intent-decomposition.util.js';

describe('intent-decomposition.schema', () => {
  it('builds dashboard schema from registry compound recipes', () => {
    const schema = buildDecompositionSchemaView('dashboard');
    expect(schema.surface).toBe('dashboard');
    expect(schema.allowedActions).toContain('cancel_package_visit');
    expect(schema.allowedActions).toContain('fill_slot_from_waitlist');
    expect(schema.recipeIds).toContain('dashboard_operational_compound');
    expect(schema.promptBlock).toContain('bulk_smart_cancel');
    expect(schema.maxSteps).toBeGreaterThanOrEqual(4);
    expect(schema.sharedEntityBlock).toContain('packageId');
  });

  it('builds customer schema with golden patterns and self-service actions', () => {
    const schema = buildDecompositionSchemaView('customer');
    expect(schema.allowedActions).toContain('book_package');
    expect(schema.allowedActions).toContain('promo_code_help');
    expect(schema.recipeIds).toEqual(
      expect.arrayContaining([
        'customer_booking_compound',
        'customer_self_service_compound',
      ]),
    );
    expect(schema.goldenPatternIds).toContain(
      'customer_book_package_apply_promo',
    );
    expect(schema.promptBlock).toContain('promo_code_help');
  });

  it('builds provider and public schemas', () => {
    const provider = buildDecompositionSchemaView('provider');
    expect(provider.allowedActions).toContain('mark_paid');
    expect(provider.recipeIds).toContain('provider_booking_compound');

    const pub = buildDecompositionSchemaView('public');
    expect(pub.allowedActions).toContain('book_appointment');
    expect(pub.promptBlock).toContain('anonymous public booking');
  });

  it('falls back to surface intent list when recipe allow-list is empty', () => {
    expect(resolveMaxStepsFromRecipes([])).toBe(4);
    expect(resolveMaxStepsFromRecipes([{ maxSteps: 3 }, { maxSteps: 6 }])).toBe(
      6,
    );
    expect(resolveAllowedActionsFromRecipes([], 'customer')).toContain(
      'book_package',
    );
    expect(
      resolveAllowedActionsFromRecipes(['book_package'], 'customer'),
    ).toEqual(['book_package']);
  });

  it('lists all compound recipe ids and aligns golden pattern surfaces', () => {
    const ids = listCompoundRecipeIds();
    expect(ids).toContain('dashboard_operational_compound');
    expect(ids).toContain('customer_self_service_compound');
    for (const pattern of GOLDEN_COMPOUND_PATTERNS) {
      expect(ids).toContain(pattern.recipeId);
    }
  });

  it('aligns golden pattern ids per surface in schema views', () => {
    for (const surface of [
      'dashboard',
      'customer',
      'provider',
      'public',
    ] as const) {
      const schema = buildDecompositionSchemaView(surface);
      const expectedGoldenIds = GOLDEN_COMPOUND_PATTERNS.filter(
        (pattern) => pattern.surface === surface,
      ).map((pattern) => pattern.id);
      expect([...schema.goldenPatternIds].sort()).toEqual(
        expectedGoldenIds.sort(),
      );
    }
  });

  it('embeds surface-specific compound rules in prompt blocks', () => {
    expect(buildDecompositionSchemaView('dashboard').promptBlock).toContain(
      'bulk_smart_cancel',
    );
    expect(buildDecompositionSchemaView('customer').promptBlock).toContain(
      'book_package + promo_code_help',
    );
    expect(buildDecompositionSchemaView('provider').promptBlock).toContain(
      'mark_paid',
    );
    expect(buildDecompositionSchemaView('public').promptBlock).toContain(
      'anonymous public booking',
    );
  });

  it('keeps allowed actions unique and sorted in dashboard schema', () => {
    const schema = buildDecompositionSchemaView('dashboard');
    const unique = new Set(schema.allowedActions);
    expect(unique.size).toBe(schema.allowedActions.length);
    expect([...schema.allowedActions]).toEqual(
      [...schema.allowedActions].sort(),
    );
  });
});
