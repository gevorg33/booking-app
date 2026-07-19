import {
  E2E130_GIFT_CARD_PURCHASE_SCENARIOS,
  E2E130_MULTI_SERVICE_STILL_MATCH,
} from './ai-e2e130-gift-card-purchase-vs-multi.fixtures.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  isBudgetGiftCardMisroute,
  resolveBudgetMisrouteAction,
  rescueBudgetServiceDiscoveryIntent,
} from './ai-budget-service-discovery.util.js';
import {
  isBuyGiftCardPrompt,
  rescuePaymentsIntent,
} from './ai-payments.util.js';
import {
  extractServiceNamesFromPrompt,
  isMultiServiceAvailabilityDiscoveryPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';

describe('e2e-bug.130 gift-card purchase vs multi-service / budget', () => {
  const rescue = new AiIntentRescueService();

  it.each(E2E130_GIFT_CARD_PURCHASE_SCENARIOS.map((s) => [s.id, s]))(
    'detectors keep %s on buy_gift_card',
    (_id, row) => {
      expect(isBuyGiftCardPrompt(row.prompt)).toBe(true);
      expect(isMultiServiceAvailabilityDiscoveryPrompt(row.prompt)).toBe(
        false,
      );
      expect(
        extractServiceNamesFromPrompt(row.prompt).some((n) =>
          /gift\s*card|check\s*out/i.test(n),
        ),
      ).toBe(false);
      expect(isBudgetGiftCardMisroute(row.prompt)).toBe(true);
      expect(resolveBudgetMisrouteAction(row.prompt)).toBe('buy_gift_card');
      expect(
        rescuePaymentsIntent(row.prompt, 'check_multi_service_availability')
          ?.action,
      ).toBe('buy_gift_card');
      expect(
        rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action,
      ).not.toBe('check_multi_service_availability');
    },
  );

  it.each(E2E130_GIFT_CARD_PURCHASE_SCENARIOS.map((s) => [s.id, s]))(
    'AiIntentRescueService remaps wrong actions for %s',
    (_id, row) => {
      for (const fromAction of row.misclassifiedActions) {
        const result = rescue.rescue({
          prompt: row.prompt,
          action: fromAction,
          params: {},
          surface: row.surface,
        });
        expect(result?.action).toBe(row.expectedAction);
        expect(result?.action).not.toBe('check_multi_service_availability');
        expect(result?.action).not.toBe('list_services');
        expect(result?.action).not.toBe('apply_gift_card_code');
        if (row.amount != null) {
          expect(result?.params?.amount).toBe(row.amount);
        }
        expect(result?.params?.paymentMethod).toBeUndefined();
      }
    },
  );

  it('budget discovery remaps buy+$amount away from list_services', () => {
    const prompt = 'I want to buy a $30 gift card and check out now';
    expect(
      rescueBudgetServiceDiscoveryIntent(prompt, 'unknown', 'customer'),
    ).toEqual({
      action: 'buy_gift_card',
      rescueReason: 'buy_gift_card',
    });
    expect(
      rescueBudgetServiceDiscoveryIntent(
        prompt,
        'check_multi_service_availability',
        'customer',
      ),
    ).toEqual({
      action: 'buy_gift_card',
      rescueReason: 'buy_gift_card',
    });
  });

  it.each(E2E130_MULTI_SERVICE_STILL_MATCH.map((s) => [s.id, s]))(
    'multi-service discovery still matches %s',
    (_id, row) => {
      expect(isMultiServiceAvailabilityDiscoveryPrompt(row.prompt)).toBe(true);
      expect(
        rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action,
      ).toBe(row.expectedAction);
    },
  );
});
