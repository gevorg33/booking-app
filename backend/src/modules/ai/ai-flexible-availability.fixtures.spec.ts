import {
  AVAILABILITY_WINDOW_PARSE_SCENARIOS,
  AVAIL_BUDGET_OR_SCENARIOS,
  AVAIL_COMPOUND_PROMPT_SCENARIOS,
  AVAIL_DISAMBIGUATION_SCENARIOS,
  AVAIL_DOMAIN_FIXTURE_IDS,
  AVAIL_HANDLER_OUTCOME_SCENARIOS,
  AVAIL_MULTILINGUAL_SCENARIOS,
  AVAIL_OR_WINDOW_SCENARIOS,
  AVAIL_PUBLIC_PROMPTS,
  AVAIL_CUSTOMER_PROMPTS,
  AVAIL_SECTION_A_OR_SCENARIOS,
  AVAIL_SECTION_H_DASHBOARD_PARITY_SCENARIOS,
  AVAIL_SECTION_H_SPECIFIC_PROVIDER_SCENARIOS,
  AVAIL_SECTION_I_AFTER_WORK_LUNCH_SCENARIOS,
  AVAIL_SECTION_J_ASAP_CHIP_SCENARIOS,
  AVAIL_SECTION_I_TIME_VARIANT_SCENARIOS,
  AVAIL_SECTION_J_IMPERATIVE_SCENARIOS,
  AVAIL_SECTION_J_VOICE_SCENARIOS,
  AVAIL_SECTION_K_ADD_WINDOW_SCENARIOS,
  AVAIL_SECTION_K_AFTER_BUDGET_SCENARIOS,
  AVAIL_SECTION_K_DROP_WINDOW_SCENARIOS,
  AVAIL_SECTION_K_SESSION_SCENARIOS,
  AVAIL_SECTION_L_ANY_PROVIDER_SCENARIOS,
  AVAIL_SECTION_L_NAMED_FALLBACK_SCENARIOS,
  AVAIL_SECTION_L_PROVIDER_OR_SCENARIOS,
  AVAIL_SECTION_L_SAME_PROVIDER_SCENARIOS,
  AVAIL_SECTION_M_BUDGET_NO_SLOTS_SCENARIOS,
  AVAIL_SECTION_M_NEITHER_WINDOW_SCENARIOS,
  AVAIL_SECTION_M_PARTIAL_WINDOW_SCENARIOS,
  AVAIL_SECTION_M_NO_SLOT_SCENARIOS,
  FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES,
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS,
} from './ai-flexible-availability.fixtures.js';
import { enrichAvailabilityWindowsFromPrompt } from './ai-flexible-availability.util.js';
import {
  extractMaxPriceFromBudgetPrompt,
  shouldExtractBudgetMaxPrice,
} from './ai-budget-service-discovery.util.js';

describe('ai-flexible-availability.fixtures (avail-1.10 / avail-1.12)', () => {
  it('ships expanded classifier rules for OR windows, budget, and disambiguation', () => {
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'availabilityWindows',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'check_providers_for_service',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain('Overlap clarify');
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'NOT recommend_specialists',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'Any slots Friday afternoon for a facial?',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'Massage under $80 tomorrow or Thursday evening',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'tomorrow eve or fri afternoon',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain('session follow-ups');
  });

  it('maps parse golden prompts into classifier rules', () => {
    for (const scenario of AVAILABILITY_WINDOW_PARSE_SCENARIOS) {
      expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(scenario.prompt);
    }
  });

  it('uses unique fixture ids across the availability domain', () => {
    expect(AVAIL_DOMAIN_FIXTURE_IDS.length).toBe(
      new Set(AVAIL_DOMAIN_FIXTURE_IDS).size,
    );
  });

  it('ships at least 45 unique availability domain fixture ids (avail-1.12)', () => {
    expect(AVAIL_DOMAIN_FIXTURE_IDS.length).toBeGreaterThanOrEqual(45);
    expect(SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.length).toBeGreaterThanOrEqual(
      45,
    );
  });

  it.each(SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS)(
    'scenario $id has required fixture fields',
    ({ id, prompt, surface, expectedAction }) => {
      expect(id).toBeTruthy();
      expect(prompt.trim().length).toBeGreaterThan(0);
      expect(['public', 'customer', 'both', 'dashboard']).toContain(surface);
      expect(expectedAction.trim().length).toBeGreaterThan(0);
    },
  );

  it('ships section A OR window scenarios', () => {
    expect(AVAIL_SECTION_A_OR_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'avail-or-tomorrow-friday-en',
      'avail-either-morning-en',
      'avail-or-book-en',
      'avail-three-way-or-en',
    ]);
  });

  it('ships OR window classifier scenarios beyond section A', () => {
    expect(AVAIL_OR_WINDOW_SCENARIOS.length).toBeGreaterThanOrEqual(8);
    expect(AVAIL_OR_WINDOW_SCENARIOS.map((scenario) => scenario.id)).toContain(
      'avail-budget-or-en',
    );
  });

  it('ships section D handler outcome scenarios', () => {
    expect(
      AVAIL_HANDLER_OUTCOME_SCENARIOS.map((scenario) => scenario.id),
    ).toEqual(
      expect.arrayContaining([
        'avail-budget-no-match-or-en',
        'avail-budget-pick-service-first-en',
        'avail-slots-window-a-only',
        'avail-slots-window-b-only',
        'avail-earliest-across-windows',
        'avail-overlap-tomorrow-is-friday',
        'avail-public-timeofday-filter',
        'avail-neither-window-en',
        'avail-partial-one-window-en',
        'avail-budget-blocks-all-en',
        'avail-clarify-overlap-en',
      ]),
    );
  });

  it('ships section E compound scenarios', () => {
    expect(AVAIL_COMPOUND_PROMPT_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'avail-check-then-book-or-en',
      'avail-list-budget-then-or-en',
    ]);
  });

  it('ships section F multilingual scenarios', () => {
    expect(AVAIL_MULTILINGUAL_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'avail-or-hy',
      'avail-or-ru',
      'avail-or-translit-en',
    ]);
  });

  it('ships section G disambiguation scenarios', () => {
    expect(AVAIL_DISAMBIGUATION_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'avail-no-or-and-en',
      'avail-not-single-timeofday-en',
      'avail-not-gift-card-en',
      'avail-not-recommend-en',
    ]);
  });

  it('ships section H specific-time and per-window provider scenarios (avail-1.12)', () => {
    expect(
      AVAIL_SECTION_H_SPECIFIC_PROVIDER_SCENARIOS.map((scenario) => scenario.id),
    ).toEqual(['avail-or-specific-times-en', 'avail-or-with-provider-en']);
    expect(
      AVAIL_SECTION_H_SPECIFIC_PROVIDER_SCENARIOS.every(
        (scenario) => !scenario.phase2,
      ),
    ).toBe(true);
  });

  it('ships section H dashboard OR parity scenario (avail-1.12)', () => {
    expect(
      AVAIL_SECTION_H_DASHBOARD_PARITY_SCENARIOS.map((scenario) => scenario.id),
    ).toEqual(['avail-dashboard-parity-en']);
    expect(AVAIL_SECTION_H_DASHBOARD_PARITY_SCENARIOS[0]?.surface).toBe(
      'dashboard',
    );
    expect(AVAIL_SECTION_H_DASHBOARD_PARITY_SCENARIOS[0]?.phase2).toBeUndefined();
  });

  it('ships section I time variant scenarios (avail-1.12)', () => {
    expect(AVAIL_SECTION_I_TIME_VARIANT_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'avail-tonight-or-tomorrow-en',
      'avail-this-weekend-or-en',
      'avail-next-week-or-en',
      'avail-after-work-en',
      'avail-lunch-or-en',
    ]);
  });

  it('ships section I after-work and lunch OR scenarios without phase2', () => {
    expect(
      AVAIL_SECTION_I_AFTER_WORK_LUNCH_SCENARIOS.map((scenario) => scenario.id),
    ).toEqual(['avail-after-work-en', 'avail-lunch-or-en']);
    expect(
      AVAIL_SECTION_I_AFTER_WORK_LUNCH_SCENARIOS.every(
        (scenario) => !scenario.phase2,
      ),
    ).toBe(true);
  });

  it('ships section J voice/mobile scenarios (avail-1.12)', () => {
    expect(AVAIL_SECTION_J_VOICE_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'avail-voice-short-en',
      'avail-voice-asap-or-en',
      'avail-voice-chip-en',
      'avail-imperative-en',
    ]);
  });

  it('ships section J ASAP and chip OR scenarios without phase2', () => {
    expect(
      AVAIL_SECTION_J_ASAP_CHIP_SCENARIOS.map((scenario) => scenario.id),
    ).toEqual(['avail-voice-asap-or-en', 'avail-voice-chip-en']);
    expect(
      AVAIL_SECTION_J_ASAP_CHIP_SCENARIOS.every((scenario) => !scenario.phase2),
    ).toBe(true);
  });

  it('ships section J imperative OR scenario without phase2', () => {
    expect(AVAIL_SECTION_J_IMPERATIVE_SCENARIOS.map((scenario) => scenario.id)).toEqual(
      ['avail-imperative-en'],
    );
    expect(
      AVAIL_SECTION_J_IMPERATIVE_SCENARIOS.every((scenario) => !scenario.phase2),
    ).toBe(true);
  });

  it('ships section K add-window session scenario without phase2', () => {
    expect(AVAIL_SECTION_K_ADD_WINDOW_SCENARIOS.map((scenario) => scenario.id)).toEqual(
      ['avail-session-add-window-en'],
    );
    expect(
      AVAIL_SECTION_K_ADD_WINDOW_SCENARIOS.every((scenario) => !scenario.phase2),
    ).toBe(true);
    expect(AVAIL_SECTION_K_ADD_WINDOW_SCENARIOS[0]?.sessionTurns).toEqual([
      'I want a haircut tomorrow evening',
      'or Friday afternoon works too',
    ]);
  });

  it('ships section K drop-window and after-budget session scenarios without phase2', () => {
    expect(AVAIL_SECTION_K_DROP_WINDOW_SCENARIOS.map((scenario) => scenario.id)).toEqual(
      ['avail-session-drop-window-en'],
    );
    expect(
      AVAIL_SECTION_K_AFTER_BUDGET_SCENARIOS.map((scenario) => scenario.id),
    ).toEqual(['avail-session-after-budget-en']);
    expect(
      [...AVAIL_SECTION_K_DROP_WINDOW_SCENARIOS, ...AVAIL_SECTION_K_AFTER_BUDGET_SCENARIOS].every(
        (scenario) => !scenario.phase2,
      ),
    ).toBe(true);
  });

  it('ships section K session scenarios (avail-1.12)', () => {
    expect(AVAIL_SECTION_K_SESSION_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'avail-session-add-window-en',
      'avail-session-drop-window-en',
      'avail-session-after-budget-en',
      'avail-session-pick-slot-en',
    ]);
    expect(
      AVAIL_SECTION_K_SESSION_SCENARIOS.every(
        (scenario) => scenario.sessionFlow && scenario.sessionTurns?.length,
      ),
    ).toBe(true);
  });

  it('ships section L provider OR scenarios (avail-1.12)', () => {
    expect(AVAIL_SECTION_L_PROVIDER_OR_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'avail-or-any-provider-en',
      'avail-or-named-fallback-en',
      'avail-or-same-provider-en',
    ]);
  });

  it('ships section L any-provider and named-fallback scenarios without phase2', () => {
    expect(AVAIL_SECTION_L_ANY_PROVIDER_SCENARIOS.map((scenario) => scenario.id)).toEqual(
      ['avail-or-any-provider-en'],
    );
    expect(
      AVAIL_SECTION_L_NAMED_FALLBACK_SCENARIOS.map((scenario) => scenario.id),
    ).toEqual(['avail-or-named-fallback-en']);
    expect(
      [
        ...AVAIL_SECTION_L_ANY_PROVIDER_SCENARIOS,
        ...AVAIL_SECTION_L_NAMED_FALLBACK_SCENARIOS,
      ].every((scenario) => !scenario.phase2),
    ).toBe(true);
  });

  it('ships section L same-provider scenario without phase2', () => {
    expect(AVAIL_SECTION_L_SAME_PROVIDER_SCENARIOS.map((scenario) => scenario.id)).toEqual(
      ['avail-or-same-provider-en'],
    );
    expect(
      AVAIL_SECTION_L_SAME_PROVIDER_SCENARIOS.every((scenario) => !scenario.phase2),
    ).toBe(true);
    expect(AVAIL_SECTION_L_SAME_PROVIDER_SCENARIOS[0]?.expectedParams).toMatchObject({
      sameProviderAcrossWindows: true,
    });
  });

  it('ships section M budget-no-slots scenario separate from budget clarify', () => {
    expect(AVAIL_SECTION_M_BUDGET_NO_SLOTS_SCENARIOS.map((scenario) => scenario.id)).toEqual(
      ['avail-budget-blocks-all-en'],
    );
    expect(AVAIL_SECTION_M_BUDGET_NO_SLOTS_SCENARIOS[0]?.handlerOutcome).toBe(true);
  });

  it('ships section M neither-window and partial-window scenarios without phase2', () => {
    expect(AVAIL_SECTION_M_NEITHER_WINDOW_SCENARIOS.map((scenario) => scenario.id)).toEqual(
      ['avail-neither-window-en'],
    );
    expect(AVAIL_SECTION_M_PARTIAL_WINDOW_SCENARIOS.map((scenario) => scenario.id)).toEqual(
      ['avail-partial-one-window-en'],
    );
    expect(
      [
        ...AVAIL_SECTION_M_NEITHER_WINDOW_SCENARIOS,
        ...AVAIL_SECTION_M_PARTIAL_WINDOW_SCENARIOS,
      ].every((scenario) => !scenario.phase2 && scenario.handlerOutcome === true),
    ).toBe(true);
  });

  it('ships section M no-slot/clarify scenarios (avail-1.12)', () => {
    expect(AVAIL_SECTION_M_NO_SLOT_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'avail-neither-window-en',
      'avail-partial-one-window-en',
      'avail-budget-blocks-all-en',
      'avail-clarify-overlap-en',
    ]);
    expect(
      AVAIL_SECTION_M_NO_SLOT_SCENARIOS.every(
        (scenario) => scenario.handlerOutcome === true,
      ),
    ).toBe(true);
  });

  it('has at least ten public and ten customer applicable prompts', () => {
    expect(AVAIL_PUBLIC_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(AVAIL_CUSTOMER_PROMPTS.length).toBeGreaterThanOrEqual(10);
  });

  it.each(AVAILABILITY_WINDOW_PARSE_SCENARIOS)(
    'enrichAvailabilityWindowsFromPrompt recovers OR windows for parse golden $id',
    ({ prompt, expectedWindows }) => {
      const enriched = enrichAvailabilityWindowsFromPrompt(
        {
          serviceCategory: 'haircut',
          date: 'tomorrow',
          timeOfDay: 'evening',
        },
        prompt,
      );
      expect(enriched.availabilityWindows).toEqual(expectedWindows);
    },
  );

  it.each(
    AVAIL_BUDGET_OR_SCENARIOS.filter(
      (scenario) =>
        !scenario.handlerOutcome &&
        (scenario.id === 'avail-budget-or-en' ||
          scenario.id === 'avail-budget-under-or-en'),
    ),
  )(
    'budget OR scenarios extract maxPrice for $id',
    ({ prompt, expectedParams, skipMaxPrice }) => {
      if (skipMaxPrice) {
        expect(shouldExtractBudgetMaxPrice(prompt)).toBe(false);
        expect(extractMaxPriceFromBudgetPrompt(prompt)).toBeNull();
        return;
      }
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(
        expectedParams?.maxPrice,
      );
    },
  );
});
