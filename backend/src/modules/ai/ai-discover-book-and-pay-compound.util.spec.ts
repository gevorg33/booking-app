import {
  DISCOVER_BOOK_AND_PAY_COMPOUND_PROMPTS,
  DISCOVER_BOOK_AND_PAY_CUSTOMER_PROMPTS,
  DISCOVER_BOOK_AND_PAY_NEGATIVE_PROMPTS,
  DISCOVER_BOOK_AND_PAY_PUBLIC_PROMPTS,
  DISCOVER_BOOK_AND_PAY_RESCUE_SCENARIOS,
} from './ai-discover-book-and-pay-compound.fixtures.js';
import { DISCOVER_BOOK_AND_PAY_MULTILINGUAL_SCENARIOS } from './ai-discover-book-and-pay-compound-multilingual.fixtures.js';
import {
  buildDiscoverBookAndPayCompoundParams,
  decomposeCustomerDiscoverBookAndPayCompoundPrompt,
  decomposeDiscoverBookAndPayCompoundPrompt,
  decomposePublicDiscoverBookAndPayCompoundPrompt,
  hasDiscoverBookAndPayPaymentCue,
  isDiscoverBookAndPayCompoundPrompt,
  resolveDiscoverBookAndPayPaymentAction,
  rescueDiscoverBookAndPayCompoundIntent,
} from './ai-discover-book-and-pay-compound.util.js';
import { isBudgetServiceDiscoveryCompoundPrompt } from './ai-budget-service-discovery-compound.util.js';

describe('ai-discover-book-and-pay-compound.util (ai-cmd-customer-4.8.1)', () => {
  it.each(DISCOVER_BOOK_AND_PAY_CUSTOMER_PROMPTS)(
    'isDiscoverBookAndPayCompoundPrompt customer $id',
    ({ prompt }) => {
      expect(isDiscoverBookAndPayCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(DISCOVER_BOOK_AND_PAY_PUBLIC_PROMPTS)(
    'isDiscoverBookAndPayCompoundPrompt public $id',
    ({ prompt }) => {
      expect(isDiscoverBookAndPayCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(DISCOVER_BOOK_AND_PAY_COMPOUND_PROMPTS)(
    'decomposeDiscoverBookAndPayCompoundPrompt $id',
    ({ prompt, surface, orderedActions, expectedParams, paymentAction }) => {
      const steps = decomposeDiscoverBookAndPayCompoundPrompt(prompt, surface);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(4);
      if (expectedParams?.maxPrice) {
        expect(steps[0].params.maxPrice).toBe(expectedParams.maxPrice);
      }
      if (expectedParams?.serviceCategory) {
        expect(steps[0].params.serviceCategory).toBe(
          expectedParams.serviceCategory,
        );
      }
      if (paymentAction) {
        expect(steps[3].action).toBe(paymentAction);
      }
      expect(steps[2].params.bookingFirstAvailable).toBe(true);
    },
  );

  it.each(DISCOVER_BOOK_AND_PAY_MULTILINGUAL_SCENARIOS)(
    'decomposeDiscoverBookAndPayCompoundPrompt multilingual $id',
    ({ prompt, surface, orderedActions }) => {
      const steps = decomposeDiscoverBookAndPayCompoundPrompt(prompt, surface);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(DISCOVER_BOOK_AND_PAY_RESCUE_SCENARIOS)(
    'rescueDiscoverBookAndPayCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueDiscoverBookAndPayCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'discover_book_and_pay_compound',
      });
    },
  );

  it.each(DISCOVER_BOOK_AND_PAY_NEGATIVE_PROMPTS)(
    'does not match negative prompt $id',
    ({ prompt }) => {
      expect(isDiscoverBookAndPayCompoundPrompt(prompt)).toBe(false);
      expect(decomposeCustomerDiscoverBookAndPayCompoundPrompt(prompt)).toEqual(
        [],
      );
      expect(decomposePublicDiscoverBookAndPayCompoundPrompt(prompt)).toEqual(
        [],
      );
    },
  );

  it('budget compound without payment stays on budget service discovery', () => {
    const prompt = 'Book a haircut under $50 tomorrow, nearest slot';
    expect(hasDiscoverBookAndPayPaymentCue(prompt)).toBe(false);
    expect(isDiscoverBookAndPayCompoundPrompt(prompt)).toBe(false);
    expect(isBudgetServiceDiscoveryCompoundPrompt(prompt)).toBe(true);
  });

  it('resolveDiscoverBookAndPayPaymentAction prefers choose_payment_method', () => {
    expect(
      resolveDiscoverBookAndPayPaymentAction(
        'Book massage under $70, check who is free, book soonest, choose payment method',
      ),
    ).toBe('choose_payment_method');
    expect(
      resolveDiscoverBookAndPayPaymentAction(
        'Book cheapest massage under $60 tomorrow and pay online',
      ),
    ).toBe('pay_online');
  });

  it('buildDiscoverBookAndPayCompoundParams extracts budget and providers', () => {
    const params = buildDiscoverBookAndPayCompoundParams(
      'Book cheapest massage under $60 tomorrow and pay online',
      'customer',
    );
    expect(params.maxPrice).toBe(60);
    expect(params.allProviders).toBe(true);
    expect(params.bookingFirstAvailable).toBe(true);
  });

  it('rescueDiscoverBookAndPayCompoundIntent returns null for non-compound', () => {
    expect(
      rescueDiscoverBookAndPayCompoundIntent(
        'Book a haircut under $50 tomorrow, nearest slot',
        'list_services',
      ),
    ).toBeNull();
  });

  it('detects heuristic discover book and pay without fixture id', () => {
    const prompt =
      'Filter affordable color under $55, check availability tomorrow, book soonest, pay with card';
    expect(isDiscoverBookAndPayCompoundPrompt(prompt)).toBe(true);
    const steps = decomposeCustomerDiscoverBookAndPayCompoundPrompt(prompt);
    expect(steps.map((step) => step.action)).toEqual([
      'list_services',
      'check_providers_for_service',
      'book_nearest_slot',
      'pay_online',
    ]);
  });

  it('hasDiscoverBookAndPayPaymentCue accepts card checkout phrasing', () => {
    expect(
      hasDiscoverBookAndPayPaymentCue(
        'Show options under $40, book nearest, proceed to secure checkout',
      ),
    ).toBe(true);
  });
});
