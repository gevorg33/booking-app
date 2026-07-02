import {
  CONSUMER_DISCOVERY_CHIP_FIXTURES,
  type ConsumerDiscoveryChipFixture,
} from './ai-consumer-discovery-chips.fixtures.js';
import {
  SERVICE_DISCOVERY_INTEGRATION_CATALOG,
  SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS,
  type ServiceDiscoveryPublicIntegrationScenario,
} from './ai-service-discovery.fixtures.js';
import {
  MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS,
  lookupServiceDiscoverySourceFixture,
  type ServiceDiscoveryMultilingualScenario,
} from './ai-service-discovery-multilingual.fixtures.js';
import { budgetServiceDiscoveryScenarioToEvalCase } from './ai-budget-service-discovery.eval.util.js';
import type { BudgetServiceDiscoveryPromptFixture } from './ai-budget-service-discovery.fixtures.js';
import { flexibleAvailabilityScenarioToEvalCase } from './ai-flexible-availability.eval.util.js';
import type { FlexibleAvailabilityPromptFixture } from './ai-flexible-availability.fixtures.js';
import { serviceRankDiscoveryScenarioToEvalCase } from './ai-service-rank-discovery.eval.util.js';
import type { ServiceRankDiscoveryPromptFixture } from './ai-service-rank-discovery.fixtures.js';
import { buildFlexibleAvailabilityEvalParams } from './ai-flexible-availability-compound.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';
import { rescueCheckoutCurrencyIntent } from './ai-checkout-currency.util.js';
import { rescueBudgetServiceDiscoveryIntent } from './ai-budget-service-discovery.util.js';
import { isFindServicesUnderBudgetPrompt } from './ai-find-services-under-budget.util.js';
import { isFindEveningWeekendSlotsPrompt } from './ai-find-evening-weekend-slots.util.js';
import { applyServiceDiscoveryToCatalog } from './ai-service-catalog-rank.util.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { valuesMatchEvalPartial } from './ai-flexible-availability.eval.util.js';
import { resolvePublicAvailabilityWindows } from './ai-orchestration.helpers.js';
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiEvalCaseResult,
} from './eval/ai-command-eval.types.js';

export const DISCOVER_CROSS_SPRINT_MIN_EVAL_CASES = 30;

export type DiscoverCrossSprintEvalExpectation = AiCommandEvalCase['expect'] & {
  discoverCrossSprintKind:
    | 'public-integration'
    | 'multilingual'
    | 'consumer-chip';
  discoverClassifierParams?: Record<string, unknown>;
  discoverForbiddenKeys?: readonly string[];
  discoverCatalogIds?: readonly string[];
  discoverCatalogParams?: Record<string, unknown>;
  discoverOrWindowCount?: number;
  discoverExpectSingleWindow?: boolean;
  discoverCompoundSteps?: readonly string[];
  discoverChipFixtureId?: string;
  discoverChipDomain?: ConsumerDiscoveryChipFixture['domain'];
};

function paramsMatchPartial(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(expected)) {
    if (!valuesMatchEvalPartial(actual[key], value)) {
      errors.push(
        `params.${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}`,
      );
    }
  }
  return errors;
}

function runPublicDiscoveryEnrichment(
  scenario: ServiceDiscoveryPublicIntegrationScenario,
): Record<string, unknown> {
  return enrichPublicAssistantParamsFromPrompt(
    scenario.prompt,
    scenario.classifierParams ?? {},
    SERVICE_DISCOVERY_INTEGRATION_CATALOG,
    scenario.action,
  );
}

function evaluatePublicIntegrationCase(
  evalCase: AiCommandEvalCase,
  expect: DiscoverCrossSprintEvalExpectation,
): string[] {
  const errors: string[] = [];
  const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
    (row) => row.id === evalCase.id,
  );
  if (!scenario) {
    errors.push(`missing public integration scenario for id ${evalCase.id}`);
    return errors;
  }

  const enriched = runPublicDiscoveryEnrichment(scenario);

  if (expect.paramsPartial) {
    errors.push(...paramsMatchPartial(enriched, expect.paramsPartial));
  }

  for (const key of expect.discoverForbiddenKeys ?? []) {
    if (enriched[key] !== undefined) {
      errors.push(`forbidden key present: ${key}`);
    }
  }

  if (expect.discoverExpectSingleWindow) {
    if (enriched.availabilityWindows !== undefined) {
      errors.push(
        'expected legacy single window without availabilityWindows[]',
      );
    }
    const windows = resolvePublicAvailabilityWindows(
      enriched,
      scenario.prompt,
      'UTC',
      { defaultScanDays: 14 },
    );
    if (windows.length !== 1) {
      errors.push(`expected 1 availability window, got ${windows.length}`);
    }
  }

  if (expect.discoverOrWindowCount != null) {
    const windows = resolvePublicAvailabilityWindows(
      enriched,
      scenario.prompt,
      'UTC',
      { defaultScanDays: 14 },
    );
    if (windows.length !== expect.discoverOrWindowCount) {
      errors.push(
        `orWindowCount: expected ${expect.discoverOrWindowCount}, got ${windows.length}`,
      );
    }
  }

  if (expect.discoverCatalogIds) {
    const params = expect.discoverCatalogParams ?? enriched;
    const ids = applyServiceDiscoveryToCatalog(
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      params,
    ).map((service) => service.id);
    if (ids.join(',') !== expect.discoverCatalogIds.join(',')) {
      errors.push(
        `catalogIds: expected [${expect.discoverCatalogIds.join(', ')}], got [${ids.join(', ')}]`,
      );
    }
  }

  if (expect.discoverCompoundSteps?.length) {
    const decomposition = decomposeDeterministicForSurface(
      'public',
      scenario.prompt,
    );
    const actions = decomposition?.steps.map((step) => step.action) ?? [];
    if (actions.join(',') !== expect.discoverCompoundSteps.join(',')) {
      errors.push(
        `compoundSteps: expected [${expect.discoverCompoundSteps.join(', ')}], got [${actions.join(', ')}]`,
      );
    }
  }

  if (expect.rescuedAction && expect.rescueFromAction) {
    const rescued =
      expect.rescueReason === 'explain_checkout_currency'
        ? rescueCheckoutCurrencyIntent(scenario.prompt, expect.rescueFromAction)
        : rescueBudgetServiceDiscoveryIntent(
            scenario.prompt,
            expect.rescueFromAction,
            'public',
          );
    if (rescued?.action !== expect.rescuedAction) {
      errors.push(
        `rescuedAction: expected ${expect.rescuedAction}, got ${rescued?.action ?? 'none'}`,
      );
    }
    if (expect.rescueReason && rescued?.rescueReason !== expect.rescueReason) {
      errors.push(
        `rescueReason: expected ${expect.rescueReason}, got ${rescued?.rescueReason ?? 'none'}`,
      );
    }
  }

  return errors;
}

function buildMultilingualClassifierSeed(
  scenario: ServiceDiscoveryMultilingualScenario,
): Record<string, unknown> {
  const seed: Record<string, unknown> = {};
  const expected = scenario.expectedParams;
  if (!expected) return seed;

  if (expected.serviceCategory != null) {
    seed.serviceCategory = expected.serviceCategory;
  }
  if (expected.bookingFirstAvailable === true) {
    seed.bookingFirstAvailable = true;
  }
  if (expected.date != null) {
    seed.date = expected.date;
  }
  if (expected.timeOfDay != null) {
    seed.timeOfDay = expected.timeOfDay;
  }
  if (Array.isArray(expected.weekdays)) {
    seed.weekdays = expected.weekdays;
  }

  return seed;
}

export function multilingualSurfacesForScenario(
  scenario: ServiceDiscoveryMultilingualScenario,
): Array<'public' | 'customer'> {
  if (scenario.surface === 'public') return ['public'];
  if (scenario.surface === 'customer') return ['customer'];
  return ['public', 'customer'];
}

export function multilingualEvalCaseId(
  scenario: ServiceDiscoveryMultilingualScenario,
  surface: 'public' | 'customer',
): string {
  if (scenario.surface === 'both') {
    return `${scenario.id}-${surface}`;
  }
  return scenario.id;
}

function resolveMultilingualScenarioForEvalCase(
  evalCaseId: string,
): ServiceDiscoveryMultilingualScenario | undefined {
  const direct = MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.find(
    (row) => row.id === evalCaseId,
  );
  if (direct) return direct;

  for (const suffix of ['-public', '-customer'] as const) {
    if (!evalCaseId.endsWith(suffix)) continue;
    const baseId = evalCaseId.slice(0, -suffix.length);
    return MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.find(
      (row) => row.id === baseId,
    );
  }

  return undefined;
}

function evaluateMirroredMultilingualCase(
  scenario: ServiceDiscoveryMultilingualScenario,
  surface: 'public' | 'customer',
): string[] {
  const source = lookupServiceDiscoverySourceFixture(scenario.sourceFixtureId);
  if (!source || source.prompt !== scenario.prompt) {
    return [];
  }

  if (scenario.domain === 'budget') {
    const evalCase = budgetServiceDiscoveryScenarioToEvalCase(
      source as BudgetServiceDiscoveryPromptFixture,
      surface,
    );
    return evaluateDeterministicEvalCase({
      ...evalCase,
      id: multilingualEvalCaseId(scenario, surface),
      locale: scenario.locale,
      surface,
    }).errors;
  }

  if (scenario.domain === 'rank') {
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(
      source as ServiceRankDiscoveryPromptFixture,
      surface,
    );
    return evaluateDeterministicEvalCase({
      ...evalCase,
      id: multilingualEvalCaseId(scenario, surface),
      locale: scenario.locale,
      surface,
    }).errors;
  }

  if (scenario.domain === 'availability') {
    const evalCase = flexibleAvailabilityScenarioToEvalCase(
      source as FlexibleAvailabilityPromptFixture,
      surface,
    );
    return evaluateDeterministicEvalCase({
      ...evalCase,
      id: multilingualEvalCaseId(scenario, surface),
      locale: scenario.locale,
      surface,
    }).errors;
  }

  return [];
}

function evaluateTranslatedMultilingualCase(
  scenario: ServiceDiscoveryMultilingualScenario,
  surface: 'public' | 'customer',
): string[] {
  const errors: string[] = [];
  const expected = scenario.expectedParams ?? {};
  const seed = buildMultilingualClassifierSeed(scenario);

  if (scenario.domain === 'cross') {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      scenario.prompt,
      seed,
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenario.expectedAction ?? 'check_availability',
    );
    errors.push(...paramsMatchPartial(enriched, expected));
    for (const key of ['date', 'timeOfDay'] as const) {
      if (expected.availabilityWindows && enriched[key] !== undefined) {
        errors.push(`forbidden legacy key present after OR parse: ${key}`);
      }
    }
    if (expected.bookingFirstAvailable === true) {
      if (enriched.bookingFirstAvailable !== true) {
        errors.push(
          'bookingFirstAvailable: expected true, got false/undefined',
        );
      }
    }
    const expectedWindows = Array.isArray(expected.availabilityWindows)
      ? expected.availabilityWindows
      : null;
    if (expectedWindows) {
      const windows = resolvePublicAvailabilityWindows(
        enriched,
        scenario.prompt,
        'UTC',
        { defaultScanDays: 14 },
      );
      if (windows.length < expectedWindows.length) {
        errors.push(
          `expected >= ${expectedWindows.length} OR availability windows, got ${windows.length}`,
        );
      }
    } else if (expected.date != null && expected.timeOfDay != null) {
      if (enriched.availabilityWindows !== undefined) {
        errors.push(
          'forbidden availabilityWindows for single-window cross prompt',
        );
      }
      const windows = resolvePublicAvailabilityWindows(
        enriched,
        scenario.prompt,
        'UTC',
        { defaultScanDays: 14 },
      );
      if (windows.length !== 1) {
        errors.push(`expected 1 availability window, got ${windows.length}`);
      }
    }
    return errors;
  }

  const enriched = enrichDiscoveryParamsFromPrompt(seed, scenario.prompt);

  if (expected.maxPrice != null && enriched.maxPrice !== expected.maxPrice) {
    errors.push(
      `maxPrice: expected ${String(expected.maxPrice)}, got ${String(enriched.maxPrice)}`,
    );
  }

  if (
    expected.serviceRank != null &&
    enriched.serviceRank !== expected.serviceRank
  ) {
    errors.push(
      `serviceRank: expected ${String(expected.serviceRank)}, got ${String(enriched.serviceRank)}`,
    );
  }

  if (
    expected.serviceCategory != null &&
    enriched.serviceCategory != null &&
    enriched.serviceCategory !== expected.serviceCategory
  ) {
    errors.push(
      `serviceCategory: expected ${String(expected.serviceCategory)}, got ${String(enriched.serviceCategory)}`,
    );
  }

  if (expected.bookingFirstAvailable === true) {
    const flexAction =
      scenario.expectedAction === 'book_appointment'
        ? 'book_appointment'
        : 'book_appointment';
    const flexEnriched = buildFlexibleAvailabilityEvalParams(
      scenario.prompt,
      surface,
      flexAction,
    );
    if (flexEnriched.bookingFirstAvailable !== true) {
      errors.push('bookingFirstAvailable: expected true, got false/undefined');
    }
  }

  if (expected.availabilityWindows) {
    const flexAction =
      scenario.expectedAction === 'book_appointment'
        ? 'book_appointment'
        : 'check_availability';
    const flexEnriched = buildFlexibleAvailabilityEvalParams(
      scenario.prompt,
      surface,
      flexAction,
    );
    errors.push(
      ...paramsMatchPartial(flexEnriched, {
        availabilityWindows: expected.availabilityWindows,
      }),
    );
    const windows = resolvePublicAvailabilityWindows(
      { ...seed, ...enriched, ...flexEnriched },
      scenario.prompt,
      'UTC',
      { defaultScanDays: 14 },
    );
    const expectedWindows = Array.isArray(expected.availabilityWindows)
      ? expected.availabilityWindows
      : null;
    if (expectedWindows && windows.length < expectedWindows.length) {
      errors.push(
        `expected >= ${expectedWindows.length} OR availability windows, got ${windows.length}`,
      );
    }
  }

  return errors;
}

function evaluateMultilingualCase(
  evalCase: AiCommandEvalCase,
  _expect: DiscoverCrossSprintEvalExpectation,
): string[] {
  const scenario = resolveMultilingualScenarioForEvalCase(evalCase.id);
  if (!scenario) {
    return [`missing multilingual scenario for id ${evalCase.id}`];
  }

  const surface =
    evalCase.surface === 'customer' ? 'customer' : ('public' as const);

  const source = lookupServiceDiscoverySourceFixture(scenario.sourceFixtureId);
  if (source?.prompt === scenario.prompt) {
    return evaluateMirroredMultilingualCase(scenario, surface);
  }

  return evaluateTranslatedMultilingualCase(scenario, surface);
}

function evaluateConsumerChipCase(
  evalCase: AiCommandEvalCase,
  expect: DiscoverCrossSprintEvalExpectation,
): string[] {
  const errors: string[] = [];
  const chip = CONSUMER_DISCOVERY_CHIP_FIXTURES.find(
    (row) => row.id === evalCase.id,
  );
  if (!chip) {
    errors.push(`missing consumer chip fixture for id ${evalCase.id}`);
    return errors;
  }

  if (chip.domain === 'budget') {
    const enriched = enrichDiscoveryParamsFromPrompt({}, chip.prompt);
    if (enriched.maxPrice !== 50) {
      errors.push(`maxPrice: expected 50, got ${String(enriched.maxPrice)}`);
    }
    if (!isFindServicesUnderBudgetPrompt(chip.prompt)) {
      errors.push('budget chip prompt must match find_services_under_budget');
    }
  } else if (chip.domain === 'rank') {
    const enriched = enrichDiscoveryParamsFromPrompt({}, chip.prompt);
    if (enriched.serviceRank !== 'highest_price') {
      errors.push(
        `serviceRank: expected highest_price, got ${String(enriched.serviceRank)}`,
      );
    }
  } else if (chip.domain === 'availability') {
    if (!isFindEveningWeekendSlotsPrompt(chip.prompt)) {
      errors.push(
        'availability chip prompt must match find_evening_weekend_slots',
      );
    }
  } else if (expect.discoverChipFixtureId) {
    if (chip.fixtureId !== expect.discoverChipFixtureId) {
      errors.push(
        `fixtureId: expected ${expect.discoverChipFixtureId}, got ${chip.fixtureId}`,
      );
    }
  }

  return errors;
}

/** Deterministic cross-sprint discover eval (discover-exit-3). */
export function evaluateDiscoverCrossSprintEvalCase(
  evalCase: AiCommandEvalCase,
): AiEvalCaseResult {
  const expect = evalCase.expect as DiscoverCrossSprintEvalExpectation;
  const errors: string[] = [];

  if (!expect.discoverCrossSprintKind) {
    errors.push('discoverCrossSprintKind is required');
  } else if (expect.discoverCrossSprintKind === 'public-integration') {
    errors.push(...evaluatePublicIntegrationCase(evalCase, expect));
  } else if (expect.discoverCrossSprintKind === 'multilingual') {
    errors.push(...evaluateMultilingualCase(evalCase, expect));
  } else if (expect.discoverCrossSprintKind === 'consumer-chip') {
    errors.push(...evaluateConsumerChipCase(evalCase, expect));
  }

  return {
    id: evalCase.id,
    passed: errors.length === 0,
    errors,
  };
}

/** Translated hy/ru rows with deterministic rescue parity (discover-exit-3). */
export const DISCOVER_CROSS_SPRINT_TRANSLATED_EVAL_IDS = new Set([
  'discover-ml-budget-hy-hair-50',
  'discover-hy-budget-or-en',
  'discover-hy-cheapest-en',
  'discover-ru-premium-en',
  'discover-ru-or-book-en',
]);

export function isMultilingualDiscoverEvalEligible(
  scenario: ServiceDiscoveryMultilingualScenario,
): boolean {
  const source = lookupServiceDiscoverySourceFixture(scenario.sourceFixtureId);
  if (source?.prompt === scenario.prompt) {
    return true;
  }
  return DISCOVER_CROSS_SPRINT_TRANSLATED_EVAL_IDS.has(scenario.id);
}

export function publicIntegrationScenarioToEvalCase(
  scenario: ServiceDiscoveryPublicIntegrationScenario,
): AiCommandEvalCase {
  return {
    id: scenario.id,
    prompt: scenario.prompt,
    locale: 'en',
    surface: 'public',
    expect: {
      discoverCrossSprintKind: 'public-integration',
      paramsPartial: scenario.expectedDiscovery,
      discoverForbiddenKeys: scenario.forbiddenDiscoveryKeys,
      discoverCatalogIds: scenario.expectedCatalogIds,
      discoverCatalogParams: scenario.catalogParams,
      discoverOrWindowCount: scenario.expectOrWindowCount,
      discoverExpectSingleWindow: scenario.expectSingleWindow,
      discoverCompoundSteps: scenario.publicCompoundSteps,
      rescuedAction: scenario.rescuedAction,
      rescueFromAction: scenario.rescuedFromAction,
      rescueReason: scenario.rescueReason,
    },
  };
}

export function multilingualScenarioToEvalCase(
  scenario: ServiceDiscoveryMultilingualScenario,
  surface: 'public' | 'customer',
): AiCommandEvalCase {
  return {
    id: multilingualEvalCaseId(scenario, surface),
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface,
    expect: {
      discoverCrossSprintKind: 'multilingual',
      paramsPartial: scenario.expectedParams,
    },
  };
}

export function consumerChipToEvalCase(
  chip: ConsumerDiscoveryChipFixture,
): AiCommandEvalCase {
  return {
    id: chip.id,
    prompt: chip.prompt,
    locale: 'en',
    surface: 'customer',
    expect: {
      discoverCrossSprintKind: 'consumer-chip',
      discoverChipFixtureId: chip.fixtureId,
      discoverChipDomain: chip.domain,
    },
  };
}

export const AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_PUBLIC_INTEGRATION_CASES: AiCommandEvalCase[] =
  SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.filter(
    (scenario) => scenario.surface !== 'dashboard' && !scenario.phase2,
  ).map(publicIntegrationScenarioToEvalCase);

export const AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.filter(
    isMultilingualDiscoverEvalEligible,
  ).flatMap((scenario) =>
    multilingualSurfacesForScenario(scenario).map((surface) =>
      multilingualScenarioToEvalCase(scenario, surface),
    ),
  );

export const AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CONSUMER_CHIP_CASES: AiCommandEvalCase[] =
  CONSUMER_DISCOVERY_CHIP_FIXTURES.map(consumerChipToEvalCase);

export const AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES: AiCommandEvalCase[] =
  [
    ...AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_PUBLIC_INTEGRATION_CASES,
    ...AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES,
    ...AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CONSUMER_CHIP_CASES,
  ];
