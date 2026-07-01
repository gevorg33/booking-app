import { CONSUMER_DISCOVERY_CHIP_FIXTURES } from './ai-consumer-discovery-chips.fixtures.js';

export type FindServicesUnderBudgetPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'find_services_under_budget';
  expectedParams?: Record<string, unknown>;
  rescueReason: 'budget_discover_chip';
};

export const CUSTOMER_PUBLIC_FIND_SERVICES_UNDER_BUDGET_CLASSIFIER_RULES = `- find_services_under_budget: READ — customer app or public booking web: one-tap budget discover chip and focused catalog browse under a spending ceiling. Triggers: assistant discover chip "Services under $50" (assistantDiscoverChipUnder50), "Anything under $50?", "Options under $80", "What can I get under $60?", "Show services under $40", "Haircut under $45". Set maxPrice (inclusive ceiling in tenant currency). Optional serviceCategory when they narrow by type. Handler sorts matches by price ascending and navigates to services. NOT list_services (general catalog/menu without budget ceiling), NOT recommend_specialists (rated specialists), NOT discover_packages (bundles), NOT check_availability|book_appointment (availability/book compounds), NOT explain_service_price (one service card price).`;

const BUDGET_CHIP_PROMPT = CONSUMER_DISCOVERY_CHIP_FIXTURES.find(
  (chip) => chip.domain === 'budget',
)!.prompt;

const FIND_UNDER_BUDGET_EN_PROMPTS = [
  {
    id: 'discover-chip-under-50',
    prompt: BUDGET_CHIP_PROMPT,
    expectedParams: { maxPrice: 50 },
  },
  {
    id: 'anything-under-50',
    prompt: 'Anything under $50?',
    expectedParams: { maxPrice: 50 },
  },
  {
    id: 'what-under-80',
    prompt: 'What can I get under $80?',
    expectedParams: { maxPrice: 80 },
  },
  {
    id: 'options-under-50',
    prompt: 'Options under $50 please',
    expectedParams: { maxPrice: 50 },
  },
  {
    id: 'show-under-40',
    prompt: 'Show me services under $40',
    expectedParams: { maxPrice: 40 },
  },
  {
    id: 'under-60-options',
    prompt: 'Anything under $60?',
    expectedParams: { maxPrice: 60 },
  },
  {
    id: 'available-under-50',
    prompt: "What's available under $50?",
    expectedParams: { maxPrice: 50 },
  },
  {
    id: 'affordable-under-50',
    prompt: 'Affordable options under $50',
    expectedParams: { maxPrice: 50 },
  },
  {
    id: 'haircut-under-45',
    prompt: 'Haircut under $45',
    expectedParams: { maxPrice: 45 },
  },
  {
    id: 'facials-under-40-eur',
    prompt: 'Facials under €40 please',
    expectedParams: { maxPrice: 40 },
  },
] as const;

function buildFindServicesUnderBudgetPrompts(): FindServicesUnderBudgetPromptFixture[] {
  const rows: FindServicesUnderBudgetPromptFixture[] = [];
  for (const entry of FIND_UNDER_BUDGET_EN_PROMPTS) {
    for (const surface of ['customer', 'public'] as const) {
      rows.push({
        id: `${entry.id}-${surface}`,
        prompt: entry.prompt,
        surface,
        expectedAction: 'find_services_under_budget',
        expectedParams: entry.expectedParams,
        rescueReason: 'budget_discover_chip',
      });
    }
  }
  return rows;
}

export const FIND_SERVICES_UNDER_BUDGET_PROMPTS: readonly FindServicesUnderBudgetPromptFixture[] =
  buildFindServicesUnderBudgetPrompts();

export const FIND_SERVICES_UNDER_BUDGET_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-budget-chip',
    prompt: BUDGET_CHIP_PROMPT,
    misclassifiedAction: 'unknown',
    expectedAction: 'find_services_under_budget' as const,
  },
  {
    id: 'list-services-to-budget-chip',
    prompt: BUDGET_CHIP_PROMPT,
    misclassifiedAction: 'list_services',
    expectedAction: 'find_services_under_budget' as const,
  },
  {
    id: 'booking-help-to-budget-chip',
    prompt: 'Anything under $50?',
    misclassifiedAction: 'booking_help',
    expectedAction: 'find_services_under_budget' as const,
  },
  {
    id: 'recommend-to-budget-under',
    prompt: 'Options under $50 please',
    misclassifiedAction: 'recommend_specialists',
    expectedAction: 'find_services_under_budget' as const,
  },
] as const;
