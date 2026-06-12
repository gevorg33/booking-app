import { BUDGET_SERVICE_DISCOVERY_PUBLIC_PROMPTS } from '../ai/ai-budget-service-discovery.fixtures.js';
import { CHECKOUT_CURRENCY_CLASSIFIER_RULES } from '../ai/ai-checkout-currency.fixtures.js';
import {
  buildPublicUnderstandMock,
  resetPublicUnderstandingHarness,
} from './public-booking-assistant.integration.harness.js';

describe('public booking assistant pipeline integration (pipe-1.12.4)', () => {
  afterEach(async () => {
    await resetPublicUnderstandingHarness();
  });

  const budgetScenario = BUDGET_SERVICE_DISCOVERY_PUBLIC_PROMPTS.find(
    (entry) => entry.id === 'budget-hair-50-en',
  )!;

  it('rescues budget list_services from unknown via real understand pipeline', async () => {
    const understand = buildPublicUnderstandMock();
    const classify = jest.fn().mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'unclear',
      confidence: 0.2,
    });

    const result = await understand.understand({
      businessId: 'biz-public',
      effectivePrompt: budgetScenario.prompt,
      confidence: { low: 0.65, high: 0.82 },
      locale: 'en',
      businessContextBlock: 'Business: Salon\nServices: Haircut — 30 min, 40 USD',
      classify,
    });

    expect(classify).toHaveBeenCalled();
    expect(result.action).toBe('list_services');
    expect(result.params?.maxPrice).toBe(budgetScenario.expectedParams?.maxPrice);
  });

  it('rescues explain_checkout_currency from unknown on booking-page tax questions', async () => {
    const understand = buildPublicUnderstandMock();
    const classify = jest.fn().mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'unclear',
    });

    const result = await understand.understand({
      businessId: 'biz-public',
      effectivePrompt: 'Why do prices show euros on the booking page?',
      confidence: { low: 0.65, high: 0.82 },
      locale: 'en',
      businessContextBlock: 'Business: Salon',
      classify,
    });

    expect(result.action).toBe('explain_checkout_currency');
    expect(CHECKOUT_CURRENCY_CLASSIFIER_RULES).toContain(
      'explain_checkout_currency',
    );
  });
});
