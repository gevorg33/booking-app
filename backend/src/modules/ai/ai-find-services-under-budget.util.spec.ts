import {
  FIND_SERVICES_UNDER_BUDGET_PROMPTS,
  FIND_SERVICES_UNDER_BUDGET_RESCUE_SCENARIOS,
} from './ai-find-services-under-budget.fixtures.js';
import { FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_SCENARIOS } from './ai-find-services-under-budget-multilingual.fixtures.js';
import { CONSUMER_DISCOVERY_CHIP_FIXTURES } from './ai-consumer-discovery-chips.fixtures.js';
import {
  isFindServicesUnderBudgetIntent,
  isFindServicesUnderBudgetPrompt,
  parseFindServicesUnderBudgetFromPrompt,
  rescueFindServicesUnderBudgetIntent,
} from './ai-find-services-under-budget.util.js';
import { isExplainDepositForfeiturePrompt } from './ai-explain-deposit-forfeiture.util.js';

describe('ai-find-services-under-budget.util (ai-cmd-customer-4.20.3)', () => {
  it.each(FIND_SERVICES_UNDER_BUDGET_PROMPTS)(
    'detects prompt $id',
    ({ prompt, expectedParams }) => {
      expect(isFindServicesUnderBudgetPrompt(prompt)).toBe(true);
      expect(parseFindServicesUnderBudgetFromPrompt(prompt)).toMatchObject({
        maxPrice: expectedParams?.maxPrice,
      });
    },
  );

  it.each(FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isFindServicesUnderBudgetPrompt(prompt)).toBe(true);
    },
  );

  it.each(FIND_SERVICES_UNDER_BUDGET_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueFindServicesUnderBudgetIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'budget_discover_chip',
      });
    },
  );

  it('wires budget discover chip prompt from consumer fixtures', () => {
    const chip = CONSUMER_DISCOVERY_CHIP_FIXTURES.find(
      (row) => row.id === 'discover-chip-under-50-en',
    )!;
    expect(isFindServicesUnderBudgetPrompt(chip.prompt)).toBe(true);
    expect(parseFindServicesUnderBudgetFromPrompt(chip.prompt)).toEqual({
      maxPrice: 50,
    });
  });

  it('does not steal general catalog browse or rank-only prompts', () => {
    expect(isFindServicesUnderBudgetPrompt('What services do you offer?')).toBe(
      false,
    );
    expect(isFindServicesUnderBudgetPrompt('Premium services')).toBe(false);
    expect(
      isFindServicesUnderBudgetPrompt('Explain the cancellation policy'),
    ).toBe(false);
    expect(
      isExplainDepositForfeiturePrompt('Do I lose my deposit if I cancel?'),
    ).toBe(true);
  });

  it('does not steal budget book compounds', () => {
    expect(
      isFindServicesUnderBudgetPrompt(
        'Book a haircut under $50 tomorrow, nearest slot',
      ),
    ).toBe(false);
  });

  it('returns null rescue when already classified correctly', () => {
    expect(
      rescueFindServicesUnderBudgetIntent(
        'Services under $50',
        'find_services_under_budget',
      ),
    ).toBeNull();
  });

  it('recognizes find_services_under_budget intent', () => {
    expect(isFindServicesUnderBudgetIntent('find_services_under_budget')).toBe(
      true,
    );
    expect(isFindServicesUnderBudgetIntent('list_services')).toBe(false);
  });

  it('detects heuristic budget chip phrasing without exact fixture match', () => {
    expect(isFindServicesUnderBudgetPrompt('Anything under $60?')).toBe(true);
  });

  it('rejects rank-only premium browse without budget ceiling', () => {
    expect(isFindServicesUnderBudgetPrompt('Premium services')).toBe(false);
  });

  it('rejects specialist-rank prompts even with a budget ceiling', () => {
    expect(
      isFindServicesUnderBudgetPrompt('Best rated stylist under $50'),
    ).toBe(false);
  });
});
