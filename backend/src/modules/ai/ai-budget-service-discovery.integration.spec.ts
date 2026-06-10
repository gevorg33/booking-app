import {
  BUDGET_DISAMBIGUATION_SCENARIOS,
  BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES,
  BUDGET_SERVICE_DISCOVERY_CUSTOMER_PROMPTS,
  BUDGET_SERVICE_DISCOVERY_PUBLIC_PROMPTS,
  BUDGET_SESSION_SCENARIOS,
  SIMILAR_BUDGET_SERVICE_PROMPTS,
} from './ai-budget-service-discovery.fixtures.js';
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-assistant.service.js';
import {
  budgetScenarioAppliesToSurface,
  enrichBudgetFromPrompt,
  extractMaxPriceFromBudgetPrompt,
  rescueBudgetServiceDiscoveryIntent,
  resolveBudgetCompoundSteps,
  resolveBudgetMisrouteAction,
  resolveBudgetMisrouteActionForSurface,
} from './ai-budget-service-discovery.util.js';

describe('ai budget service discovery classifier wiring (budget-1.2 / budget-1.9)', () => {
  it('includes budget rules and maxPrice in public, customer, and dashboard schemas', () => {
    const publicSchema = buildPublicClassifierSchema();
    const customerSchema = buildCustomerClassifierSchema();
    const sampleRule = BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES.slice(0, 80);

    expect(publicSchema).toContain('"maxPrice"');
    expect(customerSchema).toContain('"maxPrice"');
    expect(publicSchema).toContain(sampleRule);
    expect(customerSchema).toContain(sampleRule);
    expect(publicSchema).toContain('I need a haircut, I have $50');
    expect(customerSchema).toContain('I need a haircut, I have $50');
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain('maxPrice');
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain('list_services');
  });
});

describe('ai budget service discovery post-LLM rescue (budget-1.3)', () => {
  it('enriches public assistant params with maxPrice after classify', () => {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      'What massages can I get for under 80 dollars?',
      {},
      [{ id: 'm1', name: 'Swedish massage' }],
      'list_services',
    );
    expect(enriched.maxPrice).toBe(80);
  });

  it('rescues unknown budget prompts to list_services on public path', () => {
    expect(
      rescueBudgetServiceDiscoveryIntent('What can I book with $30?', 'unknown'),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'budget_list_services',
    });
  });
});

describe('ai budget disambiguation integration (budget-1.8)', () => {
  it.each(BUDGET_DISAMBIGUATION_SCENARIOS.filter(
    (scenario) => scenario.surface !== 'customer',
  ))(
    'public enrichPublicAssistantParamsFromPrompt strips maxPrice for $id',
    ({ prompt }) => {
      const enriched = enrichPublicAssistantParamsFromPrompt(
        prompt,
        { maxPrice: 100 },
        [{ id: 's1', name: 'Haircut' }],
        'list_services',
      );
      expect(enriched.maxPrice).toBeUndefined();
    },
  );

  it.each(BUDGET_DISAMBIGUATION_SCENARIOS)(
    'customer enrichBudgetFromPrompt strips maxPrice for $id',
    ({ prompt }) => {
      expect(
        enrichBudgetFromPrompt({ maxPrice: 100 }, prompt).maxPrice,
      ).toBeUndefined();
    },
  );

  it('rescues public package prompts to booking_help', () => {
    const prompt = 'Any spa packages under $100?';
    expect(resolveBudgetMisrouteActionForSurface(prompt, 'public')).toBe(
      'booking_help',
    );
    expect(
      rescueBudgetServiceDiscoveryIntent(prompt, 'list_services', 'public'),
    ).toEqual({
      action: 'booking_help',
      rescueReason: 'discover_packages',
    });
  });

  it('rescues customer package prompts to discover_packages', () => {
    const prompt = 'Any spa packages under $100?';
    expect(
      rescueBudgetServiceDiscoveryIntent(prompt, 'list_services', 'customer'),
    ).toEqual({
      action: 'discover_packages',
      rescueReason: 'discover_packages',
    });
  });
});

describe('ai budget service discovery integration — public surface (budget-1.10)', () => {
  it.each(BUDGET_SERVICE_DISCOVERY_PUBLIC_PROMPTS.filter(
    (scenario) => !scenario.skipMaxPrice && scenario.expectedParams?.maxPrice != null,
  ))(
    'extracts maxPrice for public scenario $id',
    ({ prompt, expectedParams }) => {
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(
        expectedParams!.maxPrice,
      );
    },
  );

  it.each(
    SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
      (scenario) => scenario.publicCompoundSteps?.length,
    ),
  )('maps public compound steps for $id', (scenario) => {
    expect(budgetScenarioAppliesToSurface(scenario, 'public')).toBe(true);
    expect(resolveBudgetCompoundSteps(scenario, 'public')).toEqual(
      scenario.publicCompoundSteps,
    );
    expect(resolveBudgetCompoundSteps(scenario, 'public')).toContain(
      'book_appointment',
    );
    const decomposition = decomposeDeterministicForSurface(
      'public',
      scenario.prompt,
    );
    expect(decomposition?.steps.map((step) => step.action)).toEqual(
      scenario.publicCompoundSteps,
    );
  });

  it('rescues public misroutes away from list_services', () => {
    const prompt = 'Any spa packages under $100?';
    expect(resolveBudgetMisrouteAction(prompt)).toBe('discover_packages');
    expect(resolveBudgetMisrouteActionForSurface(prompt, 'public')).toBe(
      'booking_help',
    );
    expect(
      rescueBudgetServiceDiscoveryIntent(prompt, 'list_services', 'public'),
    ).toEqual({
      action: 'booking_help',
      rescueReason: 'discover_packages',
    });
  });
});

describe('ai budget service discovery integration — customer surface (budget-1.10)', () => {
  it.each(BUDGET_SERVICE_DISCOVERY_CUSTOMER_PROMPTS.filter(
    (scenario) => scenario.surface === 'customer',
  ))('includes customer-only voice/mobile scenario $id', ({ id, surface }) => {
    expect(surface).toBe('customer');
    expect(budgetScenarioAppliesToSurface({ surface }, 'customer')).toBe(true);
    expect(budgetScenarioAppliesToSurface({ surface }, 'public')).toBe(false);
  });

  it.each(
    SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
      (scenario) => scenario.customerCompoundSteps?.length,
    ),
  )('maps customer compound steps for $id', (scenario) => {
    expect(budgetScenarioAppliesToSurface(scenario, 'customer')).toBe(true);
    expect(resolveBudgetCompoundSteps(scenario, 'customer')).toEqual(
      scenario.customerCompoundSteps,
    );
    expect(resolveBudgetCompoundSteps(scenario, 'customer')).toContain(
      'book_nearest_slot',
    );
    const decomposition = decomposeDeterministicForSurface(
      'customer',
      scenario.prompt,
    );
    expect(decomposition?.steps.map((step) => step.action)).toEqual(
      scenario.customerCompoundSteps,
    );
  });

  it.each(BUDGET_SESSION_SCENARIOS)(
    'merges session maxPrice overrides for $id on customer surface',
    ({ turns }) => {
      let params: Record<string, unknown> = { maxPrice: 50 };
      for (const turn of turns) {
        params = enrichBudgetFromPrompt(params, turn.prompt);
        if (turn.expectedParams?.maxPrice != null) {
          expect(params.maxPrice).toBe(turn.expectedParams.maxPrice);
        }
      }
    },
  );
});
