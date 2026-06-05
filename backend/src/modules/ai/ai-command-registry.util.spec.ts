import {
  buildCommandRegistryView,
  canAppearInCompound,
  getAllCommandEntries,
  getCommandEntry,
  getCommandsByModule,
  getCommandsBySurface,
  getCompoundRecipeById,
  getCompoundRecipesForSurface,
  getIntentIdsBySurface,
  getRegistryExecutionMode,
  isIntentAllowedForTier,
  isIntentAllowedOnSurface,
  isRegistryMutating,
  registrySummaryForPrompt,
  resolveCompoundRecipesForPrompt,
  resolveHandlerForSurface,
} from './ai-command-registry.util.js';
import { COMMAND_REGISTRY } from './ai-command-registry.js';

describe('ai-command-registry.util', () => {
  it('resolves handlers with and without per-surface overrides', () => {
    expect(
      resolveHandlerForSurface('not_a_real_intent', 'dashboard'),
    ).toBeUndefined();
    expect(resolveHandlerForSurface('create_booking_cash', 'dashboard')).toBe(
      'AiBookingDepthService',
    );
    expect(resolveHandlerForSurface('mark_paid', 'dashboard')).toBe(
      'AiBookingDepthService',
    );
    expect(resolveHandlerForSurface('mark_paid', 'provider')).toBe(
      'AiProviderBookingService',
    );
    expect(resolveHandlerForSurface('mark_paid', 'public')).toBe(
      'AiBookingDepthService',
    );
    expect(resolveHandlerForSurface('list_bookings', 'dashboard')).toBe(
      'AiCommandService',
    );
    expect(resolveHandlerForSurface('list_bookings', 'provider')).toBe(
      'ProviderAiCommandService',
    );
  });

  it('enforces tier and surface allow-lists', () => {
    expect(isIntentAllowedForTier('missing_intent', 'owner')).toBe(false);
    expect(
      isIntentAllowedForTier('create_booking', 'client', 'dashboard'),
    ).toBe(false);
    expect(isIntentAllowedForTier('create_package', 'owner', 'provider')).toBe(
      false,
    );
    expect(isIntentAllowedForTier('create_booking', 'owner', 'dashboard')).toBe(
      true,
    );
    expect(isIntentAllowedForTier('unknown', 'client')).toBe(true);
    expect(isIntentAllowedOnSurface('create_booking', 'public')).toBe(false);
    expect(isIntentAllowedOnSurface('book_package', 'customer')).toBe(true);
    expect(isIntentAllowedOnSurface('book_package', 'public')).toBe(false);
  });

  it('resolves compound recipes only for compound-marked prompts', () => {
    expect(resolveCompoundRecipesForPrompt('dashboard', '')).toEqual([]);
    expect(resolveCompoundRecipesForPrompt('dashboard', '   ')).toEqual([]);
    expect(
      resolveCompoundRecipesForPrompt('dashboard', 'Show appointments today'),
    ).toEqual([]);
    expect(
      resolveCompoundRecipesForPrompt(
        'dashboard',
        'Cancel booking and then reschedule',
      ),
    ).toEqual(getCompoundRecipesForSurface('dashboard'));
    expect(
      resolveCompoundRecipesForPrompt(
        'provider',
        'List visits; mark booking paid',
      ),
    ).toEqual(getCompoundRecipesForSurface('provider'));
    expect(
      resolveCompoundRecipesForPrompt(
        'customer',
        'Book package and also pay cash at visit',
      ),
    ).toEqual(getCompoundRecipesForSurface('customer'));
    expect(
      resolveCompoundRecipesForPrompt(
        'public',
        'List providers and book appointment',
      ),
    ).toEqual(getCompoundRecipesForSurface('public'));
    expect(
      resolveCompoundRecipesForPrompt(
        'dashboard',
        'Fill slots after that clear schedule',
      ),
    ).toEqual(getCompoundRecipesForSurface('dashboard'));
    expect(
      resolveCompoundRecipesForPrompt(
        'dashboard',
        'Show appointments then cancel booking',
      ),
    ).toEqual(getCompoundRecipesForSurface('dashboard'));
    expect(
      resolveCompoundRecipesForPrompt(
        'dashboard',
        'Show appointments and list bookings',
      ),
    ).toEqual(getCompoundRecipesForSurface('dashboard'));
  });

  it('reports compound-step eligibility for present and absent intents', () => {
    const nonCompoundId = COMMAND_REGISTRY.find(
      (entry) => !entry.compoundStep,
    )?.id;
    expect(nonCompoundId).toBeDefined();
    expect(canAppearInCompound(nonCompoundId!)).toBe(false);
    expect(canAppearInCompound('mark_paid')).toBe(true);
    expect(canAppearInCompound('not_a_real_intent')).toBe(false);
  });

  it('returns the full registry list', () => {
    expect(getAllCommandEntries().length).toBe(COMMAND_REGISTRY.length);
  });

  it('covers registry lookups, views, and summaries', () => {
    expect(getCommandEntry('not_a_real_intent')).toBeUndefined();
    expect(isRegistryMutating('missing')).toBe(false);
    expect(isRegistryMutating('mark_paid')).toBe(true);
    expect(getRegistryExecutionMode('optimize_schedule')).toBe('orchestration');
    expect(canAppearInCompound('unknown')).toBe(false);
    expect(getIntentIdsBySurface('provider')).toContain('mark_paid');
    expect(getCommandsByModule('catalog').map((entry) => entry.id)).toContain(
      'create_package',
    );
    expect(getCommandsBySurface('customer').map((entry) => entry.id)).toContain(
      'book_package',
    );
    expect(getCommandsBySurface('public').map((entry) => entry.id)).toContain(
      'book_appointment',
    );
    expect(
      getCompoundRecipesForSurface('dashboard').find(
        (recipe) => recipe.llmDecompose,
      )?.id,
    ).toBe('dashboard_operational_compound');
    expect(getCompoundRecipeById('missing_recipe')).toBeUndefined();
    expect(getCompoundRecipeById('provider_booking_compound')?.maxSteps).toBe(
      4,
    );

    const view = buildCommandRegistryView('create_package_booking');
    expect(view?.compoundRecipes.length).toBeGreaterThan(0);
    expect(buildCommandRegistryView('missing')).toBeNull();

    expect(registrySummaryForPrompt('dashboard')).toContain(
      'compound_recipes=',
    );
    expect(registrySummaryForPrompt('provider')).toContain(
      'provider_booking_compound',
    );
    expect(registrySummaryForPrompt('customer')).toContain(
      'customer_booking_compound',
    );
    expect(registrySummaryForPrompt('public')).toContain(
      'public_assistant_compound',
    );
  });
});
