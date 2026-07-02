import {
  AVAILABILITY_WINDOW_ENRICHMENT_SCENARIOS,
  AVAILABILITY_WINDOW_PARSE_SCENARIOS,
  FLEXIBLE_AVAILABILITY_BUDGET_SCENARIOS,
  FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES,
  FLEXIBLE_AVAILABILITY_NEAREST_PICK_SCENARIOS,
  AVAIL_DISAMBIGUATION_SCENARIOS,
  AVAIL_SECTION_H_DASHBOARD_PARITY_SCENARIOS,
  AVAIL_SECTION_H_SPECIFIC_PROVIDER_SCENARIOS,
  AVAIL_SECTION_I_AFTER_WORK_LUNCH_SCENARIOS,
  AVAIL_SECTION_J_ASAP_CHIP_SCENARIOS,
  AVAIL_SECTION_J_IMPERATIVE_SCENARIOS,
  AVAIL_SECTION_K_ADD_WINDOW_SCENARIOS,
  AVAIL_SECTION_K_AFTER_BUDGET_SCENARIOS,
  AVAIL_SECTION_K_DROP_WINDOW_SCENARIOS,
  AVAIL_SECTION_L_ANY_PROVIDER_SCENARIOS,
  AVAIL_SECTION_L_NAMED_FALLBACK_SCENARIOS,
  AVAIL_SECTION_L_SAME_PROVIDER_SCENARIOS,
  AVAIL_SECTION_M_BUDGET_NO_SLOTS_SCENARIOS,
  AVAIL_SECTION_M_NEITHER_WINDOW_SCENARIOS,
  AVAIL_SECTION_M_PARTIAL_WINDOW_SCENARIOS,
  AVAIL_MULTILINGUAL_SCENARIOS,
  PUBLIC_AVAIL_HANDLER_INTEGRATION_SCENARIOS,
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS,
} from './ai-flexible-availability.fixtures.js';
import {
  pickEarliestSlotAcrossWindows,
  scanWindowsForSlots,
} from './ai-flexible-availability.util.js';
import { applyBudgetFilterForAvailabilityCheck } from './ai-flexible-availability-check.logic.js';
import { buildDashboardFlexibleAvailabilityEvalParams } from './ai-flexible-availability.eval.util.js';
import {
  buildFlexibleAvailabilityEvalParams,
  decomposeFlexibleAvailabilityBudgetCompoundPrompt,
  isFlexibleAvailabilityBudgetCompoundPrompt,
} from './ai-flexible-availability-compound.util.js';
import {
  enrichDashboardCheckAvailabilityParams,
  resolveDashboardCheckAvailabilityWindows,
  shouldGroupDashboardAvailabilityByWindow,
} from './ai-dashboard-availability-windows.logic.js';
import {
  enrichBudgetFromPrompt,
  isBudgetGiftCardMisroute,
  resolveBudgetMisrouteAction,
  rescueBudgetServiceDiscoveryIntent,
  shouldExtractBudgetMaxPrice,
} from './ai-budget-service-discovery.util.js';
import {
  isServiceCatalogRankPrompt,
  isServiceCatalogRankSpecialistPrompt,
} from './ai-service-rank-discovery.util.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import {
  enrichAvailabilityWindowsFromPrompt,
  hasAvailabilityOrPattern,
  parseAvailabilityWindowsFromPrompt,
} from './ai-flexible-availability.util.js';
import {
  resolvePublicAvailabilityDateKeys,
  resolvePublicAvailabilityWindows,
} from './ai-orchestration.helpers.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-assistant.service.js';

describe('ai flexible availability classifier wiring (avail-1.2)', () => {
  it('includes availabilityWindows rules and param in public and customer schemas', () => {
    const publicSchema = buildPublicClassifierSchema();
    const customerSchema = buildCustomerClassifierSchema();
    const sampleRule = FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES.slice(0, 80);

    expect(publicSchema).toContain('"availabilityWindows"');
    expect(customerSchema).toContain('"availabilityWindows"');
    expect(publicSchema).toContain(sampleRule);
    expect(customerSchema).toContain(sampleRule);
    expect(publicSchema).toContain(
      'I want a haircut tomorrow evening or Friday afternoon',
    );
    expect(customerSchema).toContain(
      'I want a haircut tomorrow evening or Friday afternoon',
    );
    expect(publicSchema).toContain('Monday and Friday afternoon');
    expect(customerSchema).toContain('Monday and Friday afternoon');
    expect(publicSchema).toContain('AND vs OR');
    expect(customerSchema).toContain('AND vs OR');
  });

  it('documents OR window semantics in classifier rules', () => {
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'availabilityWindows',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'check_availability',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'bookingFirstAvailable=true',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain('maxPrice');
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'NOT gift card balance as maxPrice',
    );
  });

  it('maps canonical OR prompts to availabilityWindows examples', () => {
    for (const scenario of AVAILABILITY_WINDOW_PARSE_SCENARIOS) {
      expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(scenario.prompt);
    }
  });

  it('embeds SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS canonical rows in schemas', () => {
    const publicSchema = buildPublicClassifierSchema();
    const canonical = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (scenario) => scenario.id === 'avail-or-tomorrow-friday-en',
    );
    expect(canonical).toBeDefined();
    expect(publicSchema).toContain(canonical!.prompt);
    expect(SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.length).toBeGreaterThanOrEqual(
      20,
    );
  });
});

describe('ai flexible availability post-LLM enrichment (avail-1.3)', () => {
  it.each(AVAILABILITY_WINDOW_ENRICHMENT_SCENARIOS)(
    'enrichAvailabilityWindowsFromPrompt $id',
    ({ prompt, params, expectedParams }) => {
      expect(enrichAvailabilityWindowsFromPrompt(params, prompt)).toEqual(
        expectedParams,
      );
    },
  );

  it('enrichPublicAssistantParamsFromPrompt splits OR windows on check_availability', () => {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      'I want a haircut tomorrow evening or Friday afternoon',
      {
        serviceCategory: 'haircut',
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
      [{ id: 'h1', name: 'Haircut' }],
      'check_availability',
    );
    expect(enriched.availabilityWindows).toEqual([
      { date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
    expect(enriched.timeOfDay).toBeUndefined();
    expect(enriched.date).toBeUndefined();
  });

  it('enrichPublicAssistantParamsFromPrompt keeps AND weekdays on check_availability', () => {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      'Monday and Friday afternoon for color',
      {
        serviceCategory: 'color',
        weekdays: ['monday', 'friday'],
        timeOfDay: 'afternoon',
      },
      [{ id: 'c1', name: 'Color' }],
      'check_availability',
    );
    expect(enriched.availabilityWindows).toBeUndefined();
    expect(enriched.weekdays).toEqual(['monday', 'friday']);
    expect(enriched.timeOfDay).toBe('afternoon');
  });
});

function flexibleScenario(id: string) {
  const row = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
    (entry) => entry.id === id,
  );
  if (!row) throw new Error(`missing scenario ${id}`);
  return row;
}

describe('ai flexible availability single window (avail-single-*-en)', () => {
  it('avail-single-tomorrow-evening-en enriches via discovery + eval pipeline', () => {
    const scenario = flexibleScenario('avail-single-tomorrow-evening-en');
    expect(enrichDiscoveryParamsFromPrompt({}, scenario.prompt)).toMatchObject(
      scenario.expectedParams ?? {},
    );
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'public',
        'check_availability',
      ),
    ).toMatchObject(scenario.expectedParams ?? {});
    expect(
      enrichPublicAssistantParamsFromPrompt(
        scenario.prompt,
        {},
        [{ id: 'm1', name: 'Massage' }],
        'check_availability',
      ),
    ).toMatchObject({
      serviceName: 'Massage',
      date: 'tomorrow',
      timeOfDay: 'evening',
      allProviders: true,
    });
  });

  it('avail-single-friday-afternoon-en enriches weekday afternoon window', () => {
    const scenario = flexibleScenario('avail-single-friday-afternoon-en');
    expect(enrichDiscoveryParamsFromPrompt({}, scenario.prompt)).toMatchObject(
      scenario.expectedParams ?? {},
    );
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'public',
        'check_availability',
      ),
    ).toMatchObject(scenario.expectedParams ?? {});
    expect(
      enrichPublicAssistantParamsFromPrompt(
        scenario.prompt,
        {},
        [{ id: 'f1', name: 'Facial' }],
        'check_availability',
      ),
    ).toMatchObject({
      serviceName: 'Facial',
      weekdays: ['friday'],
      timeOfDay: 'afternoon',
      allProviders: true,
    });
  });
});

describe('ai flexible availability budget OR handlers (avail-budget-no-match / pick-service)', () => {
  it.each(
    FLEXIBLE_AVAILABILITY_BUDGET_SCENARIOS.filter((row) =>
      [
        'avail-budget-no-match-or-en',
        'avail-budget-pick-service-first-en',
      ].includes(row.id),
    ),
  )(
    '$id catalog filter for OR availability check',
    ({ catalog, maxPrice, expectedServiceIds, expectNoMatch }) => {
      const result = applyBudgetFilterForAvailabilityCheck(catalog, maxPrice);
      expect(result.services.map((service) => service.id)).toEqual(
        expectedServiceIds,
      );
      if (expectNoMatch) {
        expect(result.noMatchSummary).toContain('Closest options');
        return;
      }
      expect(result.services.length).toBeGreaterThanOrEqual(2);
    },
  );

  it('avail-budget-no-match-or-en enriches OR windows + maxPrice from empty params', () => {
    const scenario = flexibleScenario('avail-budget-no-match-or-en');
    expect(enrichDiscoveryParamsFromPrompt({}, scenario.prompt)).toMatchObject(
      scenario.expectedParams ?? {},
    );
  });

  it('avail-budget-pick-service-first-en eval params carry budget + OR windows', () => {
    const scenario = flexibleScenario('avail-budget-pick-service-first-en');
    expect(enrichDiscoveryParamsFromPrompt({}, scenario.prompt)).toMatchObject(
      scenario.expectedParams ?? {},
    );
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'public',
        'check_availability',
      ),
    ).toMatchObject(scenario.expectedParams ?? {});
  });
});

describe('ai flexible availability section D handler outcomes', () => {
  it('avail-earliest-across-windows scanWindowsForSlots picks tomorrow over Saturday', async () => {
    const scenario = PUBLIC_AVAIL_HANDLER_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'avail-earliest-across-windows',
    )!;
    const pickFixture = FLEXIBLE_AVAILABILITY_NEAREST_PICK_SCENARIOS.find(
      (row) => row.id === 'avail-earliest-across-windows',
    )!;
    const windows = resolvePublicAvailabilityWindows(
      scenario.params,
      undefined,
      'UTC',
      { defaultScanDays: 14, referenceTodayDateKey: scenario.todayDateKey },
    );

    const picked = await scanWindowsForSlots(
      windows,
      async (window, windowIndex) => {
        for (const dateKey of window.dateKeys) {
          const slots = scenario.slotsByKey[`e1:${dateKey}`] ?? [];
          if (slots.length > 0) {
            return slots[0];
          }
        }
        void windowIndex;
        return null;
      },
    );

    expect(picked?.slot.startTime).toBe(scenario.expectedBestNavigateStartTime);
    expect(picked?.windowIndex).toBe(pickFixture.expectedWindowIndex);
    expect(
      pickEarliestSlotAcrossWindows(
        pickFixture.candidates.map((candidate) => ({
          slot: { startTime: candidate.startTime },
          windowIndex: candidate.windowIndex,
          timeOfDay: candidate.timeOfDay,
          dateKeys: ['2026-06-11'],
        })),
      )?.windowIndex,
    ).toBe(0);
  });

  it('avail-earliest-across-windows enriches bookingFirstAvailable + OR windows', () => {
    const scenario = flexibleScenario('avail-earliest-across-windows');
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'public',
        'book_appointment',
      ),
    ).toMatchObject(scenario.expectedParams ?? {});
  });
});

describe('ai flexible availability section F multilingual OR (avail-or-hy/ru/translit)', () => {
  it.each(AVAIL_MULTILINGUAL_SCENARIOS)(
    '$id enrichDiscoveryParamsFromPrompt splits OR windows',
    (scenario) => {
      expect(
        enrichDiscoveryParamsFromPrompt({}, scenario.prompt),
      ).toMatchObject(scenario.expectedParams ?? {});
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'public',
          'check_availability',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );
});

describe('ai flexible availability rank + budget + OR (avail-rank-budget-or-en)', () => {
  it('avail-rank-budget-or-en enriches serviceRank, maxPrice, and OR windows', () => {
    const scenario = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (entry) => entry.id === 'avail-rank-budget-or-en',
    )!;
    expect(enrichDiscoveryParamsFromPrompt({}, scenario.prompt)).toMatchObject(
      scenario.expectedParams ?? {},
    );
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'public',
        'check_availability',
      ),
    ).toMatchObject(scenario.expectedParams ?? {});
  });
});

describe('ai flexible availability list-budget-then-or compound (avail-list-budget-then-or-en)', () => {
  it('avail-list-budget-then-or-en decomposes list_services then check_availability', () => {
    const scenario = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (entry) => entry.id === 'avail-list-budget-then-or-en',
    )!;
    const steps = decomposeFlexibleAvailabilityBudgetCompoundPrompt(
      scenario.prompt,
      'public',
    );
    expect(steps.map((step) => step.action)).toEqual(
      scenario.publicCompoundSteps,
    );
    expect(steps[0]?.params).toMatchObject({
      serviceCategory: 'haircut',
      maxPrice: 50,
    });
    expect(steps[0]?.params.availabilityWindows).toBeUndefined();
    expect(steps[1]?.params.availabilityWindows).toEqual([
      { date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
  });
});

describe('ai flexible availability section G disambiguation', () => {
  it('avail-not-gift-card-en routes gift card checkout — not maxPrice or OR windows', () => {
    const scenario = flexibleScenario('avail-not-gift-card-en');
    expect(isBudgetGiftCardMisroute(scenario.prompt)).toBe(true);
    expect(shouldExtractBudgetMaxPrice(scenario.prompt)).toBe(false);
    expect(resolveBudgetMisrouteAction(scenario.prompt)).toBe(
      'apply_gift_card_code',
    );
    expect(hasAvailabilityOrPattern(scenario.prompt)).toBe(false);
    expect(parseAvailabilityWindowsFromPrompt(scenario.prompt)).toBeNull();
    const enriched = enrichDiscoveryParamsFromPrompt({}, scenario.prompt);
    expect(enriched.maxPrice).toBeUndefined();
    expect(enriched.availabilityWindows).toBeUndefined();
    expect(enriched.date).toBeUndefined();
    expect(enriched.weekdays).toBeUndefined();
    expect(
      enrichBudgetFromPrompt({ maxPrice: 50 }, scenario.prompt).maxPrice,
    ).toBeUndefined();
    expect(isFlexibleAvailabilityBudgetCompoundPrompt(scenario.prompt)).toBe(
      false,
    );
    expect(
      rescueBudgetServiceDiscoveryIntent(
        scenario.prompt,
        'check_availability',
        'customer',
      ),
    ).toEqual({
      action: 'apply_gift_card_code',
      rescueReason: 'apply_gift_card_code',
    });
  });

  it('avail-not-recommend-en keeps availability OR — not recommend_specialists', () => {
    const scenario = flexibleScenario('avail-not-recommend-en');
    expect(isServiceCatalogRankPrompt(scenario.prompt)).toBe(false);
    expect(isServiceCatalogRankSpecialistPrompt(scenario.prompt)).toBe(false);
    expect(hasAvailabilityOrPattern(scenario.prompt)).toBe(true);
    expect(enrichDiscoveryParamsFromPrompt({}, scenario.prompt)).toMatchObject(
      scenario.expectedParams ?? {},
    );
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'public',
        'check_availability',
      ),
    ).toMatchObject(scenario.expectedParams ?? {});
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'customer',
        'check_providers_for_service',
      ),
    ).toMatchObject(scenario.expectedParams ?? {});
  });

  it.each(
    AVAIL_DISAMBIGUATION_SCENARIOS.filter(
      (row) => row.id === 'avail-not-single-timeofday-en',
    ),
  )('$id enriches via discovery pipeline', (scenario) => {
    expect(enrichDiscoveryParamsFromPrompt({}, scenario.prompt)).toMatchObject(
      scenario.expectedParams ?? {},
    );
  });
});

describe('ai flexible availability section H specific times & per-window providers', () => {
  it.each(AVAIL_SECTION_H_SPECIFIC_PROVIDER_SCENARIOS)(
    '$id parses OR windows from prompt',
    (scenario) => {
      expect(parseAvailabilityWindowsFromPrompt(scenario.prompt)).toEqual(
        scenario.expectedParams?.availabilityWindows,
      );
      expect(hasAvailabilityOrPattern(scenario.prompt)).toBe(true);
    },
  );

  it.each(AVAIL_SECTION_H_SPECIFIC_PROVIDER_SCENARIOS)(
    '$id enriches via discovery pipeline',
    (scenario) => {
      expect(
        enrichDiscoveryParamsFromPrompt({}, scenario.prompt),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );

  it.each(AVAIL_SECTION_H_SPECIFIC_PROVIDER_SCENARIOS)(
    '$id matches eval params on public and customer surfaces',
    (scenario) => {
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'public',
          'check_availability',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'customer',
          'check_providers_for_service',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );
});

describe('ai flexible availability section H dashboard OR parity', () => {
  it.each(AVAIL_SECTION_H_DASHBOARD_PARITY_SCENARIOS)(
    '$id enriches dashboard params with OR windows and allProviders',
    (scenario) => {
      expect(
        enrichDashboardCheckAvailabilityParams({}, scenario.prompt),
      ).toMatchObject(scenario.expectedParams ?? {});
      expect(
        enrichDiscoveryParamsFromPrompt({}, scenario.prompt),
      ).toMatchObject(scenario.expectedParams ?? {});
      expect(
        buildDashboardFlexibleAvailabilityEvalParams(scenario.prompt),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );

  it.each(AVAIL_SECTION_H_DASHBOARD_PARITY_SCENARIOS)(
    '$id resolves grouped dashboard availability windows',
    (scenario) => {
      const enriched = enrichDashboardCheckAvailabilityParams(
        {},
        scenario.prompt,
      );
      const windows = resolveDashboardCheckAvailabilityWindows(
        enriched,
        scenario.prompt,
        'UTC',
      );
      expect(windows.length).toBeGreaterThanOrEqual(2);
      expect(shouldGroupDashboardAvailabilityByWindow(windows, enriched)).toBe(
        true,
      );
    },
  );
});

describe('ai flexible availability section I after-work & lunch OR', () => {
  it.each(AVAIL_SECTION_I_AFTER_WORK_LUNCH_SCENARIOS)(
    '$id parses OR windows from prompt',
    (scenario) => {
      expect(parseAvailabilityWindowsFromPrompt(scenario.prompt)).toEqual(
        scenario.expectedParams?.availabilityWindows,
      );
      expect(hasAvailabilityOrPattern(scenario.prompt)).toBe(true);
    },
  );

  it.each(AVAIL_SECTION_I_AFTER_WORK_LUNCH_SCENARIOS)(
    '$id enriches via discovery pipeline',
    (scenario) => {
      expect(
        enrichDiscoveryParamsFromPrompt({}, scenario.prompt),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );

  it.each(AVAIL_SECTION_I_AFTER_WORK_LUNCH_SCENARIOS)(
    '$id matches eval params on public and customer surfaces',
    (scenario) => {
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'public',
          'check_availability',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'customer',
          'check_providers_for_service',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );
});

describe('ai flexible availability section J ASAP & chip OR', () => {
  it.each(AVAIL_SECTION_J_ASAP_CHIP_SCENARIOS)(
    '$id parses OR windows from prompt',
    (scenario) => {
      expect(parseAvailabilityWindowsFromPrompt(scenario.prompt)).toEqual(
        scenario.expectedParams?.availabilityWindows,
      );
      expect(hasAvailabilityOrPattern(scenario.prompt)).toBe(true);
    },
  );

  it.each(AVAIL_SECTION_J_ASAP_CHIP_SCENARIOS)(
    '$id enriches via discovery pipeline',
    (scenario) => {
      const { bookingFirstAvailable: _bookingFirstAvailable, ...expected } =
        scenario.expectedParams ?? {};
      expect(
        enrichDiscoveryParamsFromPrompt({}, scenario.prompt),
      ).toMatchObject(expected);
    },
  );

  it('avail-voice-asap-or-en sets bookingFirstAvailable on book eval surfaces', () => {
    const scenario = AVAIL_SECTION_J_ASAP_CHIP_SCENARIOS.find(
      (entry) => entry.id === 'avail-voice-asap-or-en',
    )!;
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'public',
        'book_appointment',
      ),
    ).toMatchObject(scenario.expectedParams ?? {});
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'customer',
        'book_nearest_slot',
      ).bookingFirstAvailable,
    ).toBe(true);
  });

  it('avail-voice-chip-en matches customer eval params', () => {
    const scenario = AVAIL_SECTION_J_ASAP_CHIP_SCENARIOS.find(
      (entry) => entry.id === 'avail-voice-chip-en',
    )!;
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'customer',
        'check_providers_for_service',
      ),
    ).toMatchObject(scenario.expectedParams ?? {});
  });
});

describe('ai flexible availability section J imperative OR', () => {
  it.each(AVAIL_SECTION_J_IMPERATIVE_SCENARIOS)(
    '$id parses and enriches PM/AM OR windows',
    (scenario) => {
      expect(parseAvailabilityWindowsFromPrompt(scenario.prompt)).toEqual(
        scenario.expectedParams?.availabilityWindows,
      );
      expect(
        enrichDiscoveryParamsFromPrompt({}, scenario.prompt),
      ).toMatchObject(scenario.expectedParams ?? {});
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'public',
          'check_availability',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'customer',
          'check_providers_for_service',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );
});

describe('ai flexible availability section K session add window', () => {
  it.each(AVAIL_SECTION_K_ADD_WINDOW_SCENARIOS)(
    '$id appends follow-up OR window across session turns',
    (scenario) => {
      const [turn1Prompt, turn2Prompt] = scenario.sessionTurns ?? [];
      expect(turn1Prompt).toBeTruthy();
      expect(turn2Prompt).toBeTruthy();

      const turn1 = enrichDiscoveryParamsFromPrompt({}, turn1Prompt);
      const merged = enrichDiscoveryParamsFromPrompt(turn1, turn2Prompt);
      expect(merged).toMatchObject(scenario.expectedParams ?? {});
    },
  );
});

describe('ai flexible availability section K session drop window', () => {
  it.each(AVAIL_SECTION_K_DROP_WINDOW_SCENARIOS)(
    '$id narrows session OR windows across session turns',
    (scenario) => {
      const [turn1Prompt, turn2Prompt] = scenario.sessionTurns ?? [];
      const turn1 = enrichDiscoveryParamsFromPrompt({}, turn1Prompt);
      const merged = enrichDiscoveryParamsFromPrompt(turn1, turn2Prompt);
      expect(merged).toMatchObject(scenario.expectedParams ?? {});
    },
  );
});

describe('ai flexible availability section L any provider OR', () => {
  it.each(AVAIL_SECTION_L_ANY_PROVIDER_SCENARIOS)(
    '$id parses, enriches allProviders, and matches eval params',
    (scenario) => {
      expect(parseAvailabilityWindowsFromPrompt(scenario.prompt)).toEqual(
        scenario.expectedParams?.availabilityWindows,
      );
      expect(
        enrichDiscoveryParamsFromPrompt({}, scenario.prompt),
      ).toMatchObject(scenario.expectedParams ?? {});
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'public',
          'check_availability',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'customer',
          'check_providers_for_service',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );
});

describe('ai flexible availability section L named fallback OR', () => {
  it.each(AVAIL_SECTION_L_NAMED_FALLBACK_SCENARIOS)(
    '$id parses per-window providers and omits top-level allProviders',
    (scenario) => {
      expect(parseAvailabilityWindowsFromPrompt(scenario.prompt)).toEqual(
        scenario.expectedParams?.availabilityWindows,
      );
      const enriched = enrichDiscoveryParamsFromPrompt({}, scenario.prompt);
      expect(enriched).toMatchObject(scenario.expectedParams ?? {});
      expect(enriched.allProviders).toBeUndefined();
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'public',
          'check_availability',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );
});

describe('ai flexible availability section L same provider OR', () => {
  it.each(AVAIL_SECTION_L_SAME_PROVIDER_SCENARIOS)(
    '$id parses OR windows, sets sameProviderAcrossWindows, and matches eval params',
    (scenario) => {
      expect(parseAvailabilityWindowsFromPrompt(scenario.prompt)).toEqual(
        scenario.expectedParams?.availabilityWindows,
      );
      const enriched = enrichDiscoveryParamsFromPrompt({}, scenario.prompt);
      expect(enriched).toMatchObject(scenario.expectedParams ?? {});
      expect(enriched.allProviders).toBeUndefined();
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'public',
          'check_availability',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
      expect(
        buildFlexibleAvailabilityEvalParams(
          scenario.prompt,
          'customer',
          'check_providers_for_service',
        ),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );

  it('avail-or-same-provider-en reuses session employeeName across OR windows', () => {
    const session = enrichDiscoveryParamsFromPrompt(
      { employeeName: 'Alice' },
      'Same person tomorrow or Friday afternoon for color',
    );
    expect(session).toMatchObject({
      employeeName: 'Alice',
      sameProviderAcrossWindows: true,
      serviceCategory: 'color',
      availabilityWindows: [
        { date: 'tomorrow' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    });
  });
});

describe('ai flexible availability section M budget no slots', () => {
  it.each(AVAIL_SECTION_M_BUDGET_NO_SLOTS_SCENARIOS)(
    '$id enriches budget + OR windows from handler-outcome prompt',
    (scenario) => {
      const fixture = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
        (entry) => entry.id === scenario.id,
      )!;
      expect(enrichDiscoveryParamsFromPrompt({}, fixture.prompt)).toMatchObject(
        fixture.expectedParams ?? {},
      );
    },
  );
});

describe('ai flexible availability section M neither window', () => {
  it.each(AVAIL_SECTION_M_NEITHER_WINDOW_SCENARIOS)(
    '$id parses and enriches OR windows for all-empty handler outcome',
    (scenario) => {
      expect(parseAvailabilityWindowsFromPrompt(scenario.prompt)).toEqual(
        scenario.expectedParams?.availabilityWindows,
      );
      expect(
        enrichDiscoveryParamsFromPrompt({}, scenario.prompt),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );
});

describe('ai flexible availability section M partial one window', () => {
  it.each(AVAIL_SECTION_M_PARTIAL_WINDOW_SCENARIOS)(
    '$id parses tomorrow evening + Saturday afternoon OR windows',
    (scenario) => {
      expect(parseAvailabilityWindowsFromPrompt(scenario.prompt)).toEqual(
        scenario.expectedParams?.availabilityWindows,
      );
      expect(
        enrichDiscoveryParamsFromPrompt({}, scenario.prompt),
      ).toMatchObject(scenario.expectedParams ?? {});
    },
  );
});

describe('ai flexible availability section K session after budget', () => {
  it.each(AVAIL_SECTION_K_AFTER_BUDGET_SCENARIOS)(
    '$id carries maxPrice and OR windows across session turns',
    (scenario) => {
      const [turn1Prompt, turn2Prompt] = scenario.sessionTurns ?? [];
      const turn1 = enrichDiscoveryParamsFromPrompt({}, turn1Prompt);
      const merged = enrichDiscoveryParamsFromPrompt(turn1, turn2Prompt);
      expect(merged).toMatchObject(scenario.expectedParams ?? {});
    },
  );
});

describe('ai flexible availability budget + OR (avail-budget-under-or-en)', () => {
  it('avail-budget-under-or-en enriches maxPrice and two OR windows', () => {
    const scenario = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (entry) => entry.id === 'avail-budget-under-or-en',
    )!;
    expect(enrichDiscoveryParamsFromPrompt({}, scenario.prompt)).toMatchObject(
      scenario.expectedParams ?? {},
    );
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'public',
        'check_availability',
      ),
    ).toMatchObject(scenario.expectedParams ?? {});
    expect(
      buildFlexibleAvailabilityEvalParams(
        scenario.prompt,
        'customer',
        'check_providers_for_service',
      ),
    ).toMatchObject(scenario.expectedParams ?? {});
  });
});

describe('ai flexible availability per-window date keys (avail-1.4)', () => {
  it('resolvePublicAvailabilityWindows pairs OR clauses after enrichment', () => {
    const params = enrichAvailabilityWindowsFromPrompt(
      {
        serviceCategory: 'haircut',
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
      'I want a haircut tomorrow evening or Friday afternoon',
    );

    const windows = resolvePublicAvailabilityWindows(params, undefined, 'UTC', {
      defaultScanDays: 14,
    });

    expect(windows).toHaveLength(2);
    expect(windows[0]).toMatchObject({
      timeOfDay: 'evening',
    });
    expect(windows[0]?.dateKeys).toHaveLength(1);
    expect(windows[1]).toMatchObject({
      timeOfDay: 'afternoon',
    });
    for (const dateKey of windows[1].dateKeys) {
      expect(new Date(`${dateKey}T12:00:00.000Z`).getUTCDay()).toBe(5);
    }
  });

  it('resolvePublicAvailabilityDateKeys returns deduped union across windows', () => {
    const params = enrichAvailabilityWindowsFromPrompt(
      { serviceCategory: 'haircut' },
      'I want a haircut tomorrow evening or Friday afternoon',
    );
    const windows = resolvePublicAvailabilityWindows(params, undefined, 'UTC', {
      defaultScanDays: 14,
    });
    const flattened = resolvePublicAvailabilityDateKeys(
      params,
      undefined,
      'UTC',
      {
        defaultScanDays: 14,
      },
    );

    expect(flattened).toEqual([
      ...new Set(windows.flatMap((window) => window.dateKeys)),
    ]);
  });
});
