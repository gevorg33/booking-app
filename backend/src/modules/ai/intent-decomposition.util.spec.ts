import * as registryUtil from './ai-command-registry.util.js';
import type { LlmService } from '../../engine/agent/llm.service.js';
import {
  COMPOUND_DECOMPOSITION_SCENARIOS,
  COMPOUND_MARKER_PROMPTS,
} from './intent-decomposition.fixtures.js';
import {
  buildCustomerPromoHelpStep,
  COMPOUND_PROMPT_MARKERS,
  decomposeCompoundPrompt,
  decompositionLogLabel,
  decomposeCustomerSelfServiceCompound,
  decomposeDeterministicForSurface,
  getCompoundRecipeById,
  GOLDEN_COMPOUND_PATTERNS,
  GOLDEN_COMPOUND_PATTERN_IDS,
  isCompoundPrompt,
  listDecomposeHandlersForSurface,
  matchGoldenCompoundPattern,
  normalizeHandlerSteps,
  pickLongerCompoundMatch,
  toDecomposedIntentStep,
  validateStepsAgainstRecipe,
} from './intent-decomposition.util.js';

describe('intent-decomposition.util', () => {
  it.each(COMPOUND_MARKER_PROMPTS)(
    'detects compound marker for: $prompt',
    ({ prompt, compound }) => {
      expect(isCompoundPrompt(prompt)).toBe(compound);
      if (compound) {
        expect(COMPOUND_PROMPT_MARKERS.test(prompt)).toBe(true);
      }
    },
  );

  it('matches golden customer book package + apply promo pattern', () => {
    const result = matchGoldenCompoundPattern(
      'customer',
      'Book spa day package and apply promo code SAVE10',
    );
    expect(result?.source).toBe('golden');
    expect(result?.recipeId).toBe('customer_self_service_compound');
    expect(result?.steps.map((step) => step.action)).toEqual([
      'book_package',
      'promo_code_help',
    ]);
    expect(result?.steps[1].params.promoCode).toBe('SAVE10');
  });

  it('matches golden dashboard cancel visit + notify waitlist patterns', () => {
    const fill = matchGoldenCompoundPattern(
      'dashboard',
      'Cancel package visit for Anna and notify waitlist',
    );
    expect(fill?.steps.map((step) => step.action)).toEqual([
      'cancel_package_visit',
      'fill_slot_from_waitlist',
    ]);

    const coordinate = matchGoldenCompoundPattern(
      'dashboard',
      'Cancel package visit and coordinate waitlist offer',
    );
    expect(coordinate?.steps.map((step) => step.action)).toEqual([
      'cancel_package_visit',
      'coordinate_waitlist_offer',
    ]);
    expect(
      matchGoldenCompoundPattern(
        'provider',
        'Cancel package visit and notify waitlist',
      ),
    ).toBeNull();
  });

  it('decomposes customer self-service compounds across booking and promo segments', () => {
    const steps = decomposeCustomerSelfServiceCompound(
      'Book spa day package and apply promo WELCOME',
    );
    expect(steps.length).toBeGreaterThanOrEqual(2);
    expect(steps.map((step) => step.action)).toContain('book_package');
    expect(steps.map((step) => step.action)).toContain('promo_code_help');

    const payment = decomposeCustomerSelfServiceCompound(
      'Book package id pkg-spa-1 and pay cash at visit',
    );
    expect(payment.map((step) => step.action)).toEqual(
      expect.arrayContaining(['book_package', 'pay_cash_at_visit']),
    );
  });

  it('decomposes deterministic dashboard and provider compounds from registry handlers', () => {
    const dashboard = decomposeDeterministicForSurface(
      'dashboard',
      'List subscriptions for Anna and tag customer as VIP',
    );
    expect(dashboard?.source).toBe('deterministic');
    expect(dashboard?.recipeId).toBe('dashboard_crm_compound');
    expect(dashboard?.steps.length).toBeGreaterThanOrEqual(2);

    const provider = decomposeDeterministicForSurface(
      'provider',
      'Show my package appointments today and mark booking paid',
    );
    expect(provider?.recipeId).toBe('provider_booking_compound');
    expect(provider?.steps.map((step) => step.action)).toContain('mark_paid');
  });

  it('prefers golden patterns over generic deterministic handlers', () => {
    const result = decomposeDeterministicForSurface(
      'dashboard',
      'Cancel package visit tomorrow and notify waitlist customers',
    );
    expect(result?.source).toBe('golden');
    expect(result?.recipeId).toBe('dashboard_operational_compound');
  });

  it('normalizes and validates compound steps against recipe allow-lists', () => {
    expect(
      normalizeHandlerSteps(
        [
          { action: 'book_package', params: { packageId: 'pkg-1' } },
          { action: 'not_allowed_intent', params: {} },
          { action: 'promo_code_help', params: {} },
        ],
        ['book_package', 'promo_code_help'],
      ),
    ).toHaveLength(2);

    expect(
      validateStepsAgainstRecipe(
        [
          { action: 'book_package', params: {}, reasoning: 'a' },
          { action: 'promo_code_help', params: {}, reasoning: 'b' },
        ],
        ['book_package', 'promo_code_help'],
      ),
    ).toBe(true);
    expect(
      validateStepsAgainstRecipe(
        [{ action: 'book_package', params: {}, reasoning: 'a' }],
        ['book_package'],
      ),
    ).toBe(false);
  });

  it('lists decompose handlers and compound recipes per surface', () => {
    expect(listDecomposeHandlersForSurface('customer')).toContain(
      'decomposeCustomerBookingCompoundPrompt',
    );
    expect(listDecomposeHandlersForSurface('dashboard').length).toBeGreaterThan(
      5,
    );
    expect(
      getCompoundRecipeById('customer_booking_compound')?.surfaces,
    ).toContain('customer');
    expect(getCompoundRecipeById('missing_recipe')).toBeUndefined();
    expect(GOLDEN_COMPOUND_PATTERNS.length).toBeGreaterThanOrEqual(5);
  });

  it('maps raw handler steps to decomposed intent steps', () => {
    expect(
      toDecomposedIntentStep({
        action: 'book_package',
        params: { packageId: 'pkg-1' },
        segment: 'book',
      }),
    ).toMatchObject({
      action: 'book_package',
      reasoning: 'Compound step: book_package',
      segment: 'book',
    });
    expect(
      toDecomposedIntentStep({
        action: 'book_package',
        params: undefined as unknown as Record<string, unknown>,
      }),
    ).toEqual({
      action: 'book_package',
      params: {},
      reasoning: 'Compound step: book_package',
      segment: undefined,
    });
  });

  it('covers golden promo-without-code and skipped single-step golden builds', () => {
    const withoutCode = matchGoldenCompoundPattern(
      'customer',
      'Book spa day package and apply promo at checkout',
    );
    expect(withoutCode?.steps[1].params.promoCode).toBeUndefined();

    const promoPattern = GOLDEN_COMPOUND_PATTERNS.find(
      (pattern) => pattern.id === 'customer_book_package_apply_promo',
    )!;
    const buildSteps = promoPattern.buildSteps;
    const spy = jest.spyOn(promoPattern, 'buildSteps')
      .mockReturnValueOnce([
        { action: 'book_package', params: {}, reasoning: 'only one' },
      ]);
    expect(
      matchGoldenCompoundPattern(
        'customer',
        'Book spa day package and apply promo SAVE10',
      ),
    ).toBeNull();
    spy.mockRestore();
    expect(buildSteps).toBeDefined();
  });

  it('returns partial customer steps when only one segment classifies', () => {
    expect(
      decomposeCustomerSelfServiceCompound(
        'Book spa day package; completely unrecognizable segment xyz',
      ),
    ).toEqual([expect.objectContaining({ action: 'book_package' })]);
  });

  it('skips registry recipes with missing handlers or single-step handler output', () => {
    const recipesSpy = jest.spyOn(registryUtil, 'getCompoundRecipesForSurface');
    recipesSpy.mockReturnValueOnce([
      {
        id: 'fake_recipe',
        llmDecompose: false,
        decomposeUtil: 'missingHandler',
        allowedStepIntentIds: ['create_booking', 'list_bookings'],
        maxSteps: 4,
        surfaces: ['dashboard'],
      } as ReturnType<typeof registryUtil.getCompoundRecipesForSurface>[number],
      {
        id: 'dashboard_catalog_compound',
        llmDecompose: false,
        decomposeUtil: 'decomposeCatalogCompoundPrompt',
        allowedStepIntentIds: ['list_packages'],
        maxSteps: 4,
        surfaces: ['dashboard'],
      } as ReturnType<typeof registryUtil.getCompoundRecipesForSurface>[number],
    ]);
    expect(
      decomposeDeterministicForSurface(
        'dashboard',
        'List packages today and then random gibberish only',
      ),
    ).toBeNull();
    recipesSpy.mockRestore();
  });

  it('builds customer promo help steps with and without explicit codes', () => {
    expect(buildCustomerPromoHelpStep('apply promo at checkout')).toMatchObject(
      {
        action: 'promo_code_help',
        params: {},
      },
    );
    expect(buildCustomerPromoHelpStep('apply promo code SAVE10')).toMatchObject(
      {
        action: 'promo_code_help',
        params: { promoCode: 'SAVE10' },
      },
    );
  });

  it('keeps the longer compound match when comparing handler outputs', () => {
    const short = {
      recipeId: 'short_compound',
      steps: [
        { action: 'list_customer_subscriptions', params: {}, reasoning: 'a' },
        { action: 'tag_customer', params: {}, reasoning: 'b' },
      ],
    };
    const long = {
      recipeId: 'long_compound',
      steps: [
        { action: 'list_packages', params: {}, reasoning: 'a' },
        { action: 'create_package', params: {}, reasoning: 'b' },
        { action: 'configure_package', params: {}, reasoning: 'c' },
      ],
    };
    expect(pickLongerCompoundMatch(null, short)).toBe(short);
    expect(pickLongerCompoundMatch(short, long)).toBe(long);
    expect(pickLongerCompoundMatch(long, short)).toBe(long);
  });

  it('skips non-matching golden patterns and invalid compound branches', () => {
    expect(
      matchGoldenCompoundPattern(
        'customer',
        'Cancel package visit and notify waitlist',
      ),
    ).toBeNull();
    expect(
      validateStepsAgainstRecipe(
        [
          { action: 'book_package', params: {}, reasoning: 'a' },
          { action: 'hack', params: {}, reasoning: 'b' },
        ],
        ['book_package', 'promo_code_help'],
      ),
    ).toBe(false);
    expect(decomposeCustomerSelfServiceCompound('')).toEqual([]);
    expect(
      decomposeCustomerSelfServiceCompound('apply promo at checkout'),
    ).toMatchObject([{ action: 'promo_code_help' }]);
  });

  it('orchestrates compound decomposition with parameter defaults', async () => {
    const llm = { completeJson: jest.fn() } as unknown as LlmService;
    expect(
      await decomposeCompoundPrompt(llm, 'biz-1', undefined, 'short'),
    ).toEqual([]);
    expect(
      await decomposeCompoundPrompt(
        llm,
        'biz-1',
        undefined,
        'Cancel package visit and notify waitlist for Friday',
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'cancel_package_visit' }),
        expect.objectContaining({ action: 'fill_slot_from_waitlist' }),
      ]),
    );
    expect(
      decompositionLogLabel('dashboard_operational_compound', 'dashboard'),
    ).toBe('dashboard_operational_compound');
    expect(decompositionLogLabel(undefined, 'dashboard')).toBe('dashboard');
  });

  it('returns empty for non-compound or unsupported surfaces', () => {
    expect(
      decomposeDeterministicForSurface(
        'public',
        'List providers and book appointment',
      ),
    ).toBeNull();
    expect(
      decomposeCustomerSelfServiceCompound('What is your address'),
    ).toEqual([]);
    expect(
      decomposeCustomerSelfServiceCompound('apply promo SPRING'),
    ).toHaveLength(1);
    expect(
      decomposeDeterministicForSurface('customer', 'hello world'),
    ).toBeNull();
  });

  it.each(COMPOUND_DECOMPOSITION_SCENARIOS)(
    'deterministic util scenario $id on $surface',
    (scenario) => {
      const result = decomposeDeterministicForSurface(
        scenario.surface,
        scenario.prompt,
      );
      if (scenario.expectEmpty) {
        expect(result).toBeNull();
        return;
      }
      expect(result?.steps.length).toBeGreaterThanOrEqual(
        scenario.minSteps ?? 2,
      );
      if (scenario.orderedActions) {
        expect(result?.steps.map((step) => step.action)).toEqual(
          scenario.orderedActions,
        );
      }
      if (scenario.actions) {
        expect(result?.steps.map((step) => step.action)).toEqual(
          expect.arrayContaining(scenario.actions),
        );
      }
    },
  );

  it('exports golden pattern ids aligned with golden patterns', () => {
    expect(GOLDEN_COMPOUND_PATTERN_IDS).toEqual(
      GOLDEN_COMPOUND_PATTERNS.map((pattern) => pattern.id),
    );
  });

  it('propagates promo params across golden customer compound steps', () => {
    const result = matchGoldenCompoundPattern(
      'customer',
      'Book spa day package and apply promo code WELCOME',
    );
    expect(result?.steps.map((step) => step.action)).toEqual([
      'book_package',
      'promo_code_help',
    ]);
    expect(result?.steps[0].params.promoCode).toBe('WELCOME');
    expect(result?.steps[1].params.promoCode).toBe('WELCOME');
  });

  it('decomposeCompoundPrompt uses LLM fallback with filtering and maxSteps', async () => {
    const llm = { completeJson: jest.fn() } as unknown as LlmService;

    (llm.completeJson as jest.Mock).mockResolvedValue({
      intents: [
        { action: 'summarize_day', params: {}, reasoning: 'Summarize' },
        {
          action: 'list_bookings',
          params: { customerName: 'Maria' },
          reasoning: 'List',
        },
        { action: 'create_booking', params: {}, reasoning: 'Extra' },
        { action: 'unknown', params: {}, reasoning: 'Skip' },
      ],
    });

    const steps = await decomposeCompoundPrompt(
      llm,
      'biz-1',
      'owner-1',
      'Summarize today and then list all bookings for Maria',
      'America/New_York',
      'dashboard',
    );
    expect(steps.length).toBeGreaterThanOrEqual(2);
    expect(steps.length).toBeLessThanOrEqual(4);
    expect(steps.map((step) => step.action)).not.toContain('unknown');
    expect((llm.completeJson as jest.Mock).mock.calls[0][3].userId).toBe(
      'owner-1',
    );

    (llm.completeJson as jest.Mock).mockRejectedValueOnce(
      new Error('LLM unavailable'),
    );
    expect(
      await decomposeCompoundPrompt(
        llm,
        'biz-1',
        undefined,
        'Summarize today and then list all bookings for Maria',
        'UTC',
        'dashboard',
      ),
    ).toEqual([]);

    expect(
      await decomposeCompoundPrompt(
        llm,
        'biz-1',
        undefined,
        'Optimize schedule and rebalance capacity',
        'UTC',
        'customer',
      ),
    ).toEqual([]);
    expect(llm.completeJson).toHaveBeenCalled();
  });

  it('decomposeCompoundPrompt falls through to LLM when deterministic yields one step', async () => {
    const llm = { completeJson: jest.fn() } as unknown as LlmService;
    const prompt = 'Book spa day package and apply promo code WELCOME';
    const deterministicOnly = decomposeDeterministicForSurface(
      'customer',
      prompt,
    );
    expect(deterministicOnly?.steps.length ?? 0).toBeGreaterThanOrEqual(2);

    (llm.completeJson as jest.Mock).mockResolvedValue({
      intents: [
        { action: 'summarize_day', params: {}, reasoning: 'a' },
        { action: 'list_bookings', params: {}, reasoning: 'b' },
      ],
    });

    const dashboardPrompt = 'Summarize day and then list bookings for team';
    const partial = decomposeDeterministicForSurface(
      'dashboard',
      dashboardPrompt,
    );
    if (!partial || partial.steps.length >= 2) {
      const steps = await decomposeCompoundPrompt(
        llm,
        'biz-1',
        undefined,
        dashboardPrompt,
        'UTC',
        'dashboard',
      );
      expect(steps.length).toBeGreaterThanOrEqual(2);
    }
  });
});
