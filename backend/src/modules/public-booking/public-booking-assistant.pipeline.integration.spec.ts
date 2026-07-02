import { BUDGET_SERVICE_DISCOVERY_PUBLIC_PROMPTS } from '../ai/ai-budget-service-discovery.fixtures.js';
import { CHECKOUT_CURRENCY_CLASSIFIER_RULES } from '../ai/ai-checkout-currency.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CLASSIFIER_RULES } from '../ai/ai-explain-payment-options-for-service.util.js';
import { CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES } from '../ai/ai-multi-service-customer-public.util.js';
import { CUSTOMER_PUBLIC_PROMO_CODE_HELP_CLASSIFIER_RULES } from '../ai/ai-promo-code-help-customer-public.util.js';
import {
  CUSTOMER_PUBLIC_TOUR_CLASSIFIER_RULES,
  TOUR_CUSTOMER_PUBLIC_PROMPTS,
} from '../ai/ai-tour-customer-public.util.js';
import { CUSTOMER_PUBLIC_CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES } from '../ai/ai-checkout-recommendations-customer-public.util.js';
import { CHECKOUT_RECOMMENDATIONS_CUSTOMER_PUBLIC_PROMPTS } from '../ai/ai-checkout-recommendations-customer-public.util.js';
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
      businessContextBlock:
        'Business: Salon\nServices: Haircut — 30 min, 40 USD',
      classify,
    });

    expect(classify).toHaveBeenCalled();
    expect(result.action).toBe('list_services');
    expect(result.params?.maxPrice).toBe(
      budgetScenario.expectedParams?.maxPrice,
    );
  });

  it('rescues explain_checkout_currency from unknown on booking-page currency questions', async () => {
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

  it('rescues explain_payment_options_for_service from unknown for catalog-context pay-online question', async () => {
    const understand = buildPublicUnderstandMock();
    const classify = jest.fn().mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'unclear',
    });

    const result = await understand.understand({
      businessId: 'biz-public',
      effectivePrompt: 'Do I pay online for this service?',
      confidence: { low: 0.65, high: 0.82 },
      locale: 'en',
      businessContextBlock:
        'Business: Salon\nServices: Massage — 60 min, 80 USD',
      classify,
    });

    expect(result.action).toBe('explain_payment_options_for_service');
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CLASSIFIER_RULES,
    ).toContain('session serviceId/serviceName');
  });

  it('rescues check_multi_service_availability from unknown for spa-day phrasing', async () => {
    const understand = buildPublicUnderstandMock();
    const classify = jest.fn().mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'unclear',
    });

    const result = await understand.understand({
      businessId: 'biz-public',
      effectivePrompt: 'Massage and facial same afternoon — find a time',
      confidence: { low: 0.65, high: 0.82 },
      locale: 'en',
      businessContextBlock:
        'Business: Spa\nServices: Massage — 60 min, 80 USD; Facial — 45 min, 60 USD',
      classify,
    });

    expect(result.action).toBe('check_multi_service_availability');
    expect(CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES).toContain(
      'book_multi_service',
    );
  });

  it('rescues promo_code_help from unknown for checkout discount confusion', async () => {
    const understand = buildPublicUnderstandMock();
    const classify = jest.fn().mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'unclear',
    });

    const result = await understand.understand({
      businessId: 'biz-public',
      effectivePrompt: "Why didn't my discount apply?",
      confidence: { low: 0.65, high: 0.82 },
      locale: 'en',
      businessContextBlock: 'Business: Salon',
      classify,
    });

    expect(result.action).toBe('promo_code_help');
    expect(CUSTOMER_PUBLIC_PROMO_CODE_HELP_CLASSIFIER_RULES).toContain(
      'promo_code_help',
    );
  });

  const tourDaySlotsScenario = TOUR_CUSTOMER_PUBLIC_PROMPTS.find(
    (entry) => entry.id === 'public-why-one-time-per-day',
  )!;

  it('rescues explain_tour_day_slots from unknown for one-departure-per-day questions', async () => {
    const understand = buildPublicUnderstandMock();
    const classify = jest.fn().mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'unclear',
    });

    const result = await understand.understand({
      businessId: 'biz-public',
      effectivePrompt: tourDaySlotsScenario.prompt,
      confidence: { low: 0.65, high: 0.82 },
      locale: 'en',
      businessContextBlock:
        'Business: Trek Co\nServices: 3-Day Mountain Trek — tour, 3 days, 120 USD per person',
      classify,
    });

    expect(result.action).toBe('explain_tour_day_slots');
    expect(CUSTOMER_PUBLIC_TOUR_CLASSIFIER_RULES).toContain(
      'explain_tour_day_slots',
    );
  });

  it('rescues explain_tour_booking from unknown for per-person pricing questions', async () => {
    const understand = buildPublicUnderstandMock();
    const classify = jest.fn().mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'unclear',
    });

    const result = await understand.understand({
      businessId: 'biz-public',
      effectivePrompt: 'Is the Mountain Trek priced per person?',
      confidence: { low: 0.65, high: 0.82 },
      locale: 'en',
      businessContextBlock:
        'Business: Trek Co\nServices: Mountain Trek — tour, 1 day, 80 USD per person',
      classify,
    });

    expect(result.action).toBe('explain_tour_booking');
  });

  it('rescues diagnose_tour_capacity from unknown for checkout seat rejection', async () => {
    const understand = buildPublicUnderstandMock();
    const classify = jest.fn().mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'unclear',
    });

    const result = await understand.understand({
      businessId: 'biz-public',
      effectivePrompt: 'Checkout says not enough seats for Wine Country',
      confidence: { low: 0.65, high: 0.82 },
      locale: 'en',
      businessContextBlock:
        'Business: Wine Co\nServices: Wine Country — tour, 1 day, 95 USD per person',
      classify,
    });

    expect(result.action).toBe('diagnose_tour_capacity');
    expect(CUSTOMER_PUBLIC_TOUR_CLASSIFIER_RULES).toContain(
      'diagnose_tour_capacity',
    );
  });

  const checkoutRecommendationsScenario =
    CHECKOUT_RECOMMENDATIONS_CUSTOMER_PUBLIC_PROMPTS.find(
      (entry) => entry.id === 'public-you-might-also-like',
    )!;

  it('rescues explain_checkout_recommendations from unknown for success-screen product cards', async () => {
    const understand = buildPublicUnderstandMock();
    const classify = jest.fn().mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'unclear',
    });

    const result = await understand.understand({
      businessId: 'biz-public',
      effectivePrompt: checkoutRecommendationsScenario.prompt,
      confidence: { low: 0.65, high: 0.82 },
      locale: 'en',
      businessContextBlock:
        'Business: Salon\nServices: Haircut — 30 min, 40 USD',
      classify,
    });

    expect(result.action).toBe('explain_checkout_recommendations');
    expect(CUSTOMER_PUBLIC_CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES).toContain(
      'explain_checkout_recommendations',
    );
  });
});
