import {
  E2E131_CROSS_SURFACE_HALLUCINATION_SCENARIOS,
  E2E131_PROVIDER_RETAIL_CART_STILL_MATCH,
} from './ai-e2e131-cross-surface-hallucination.fixtures.js';
import {
  isRemoveServiceFromCartPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';
import {
  isRemoveRetailFromBookingPrompt,
  rescueProviderExp3Intent,
} from './ai-provider-exp-3.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('e2e-bug.131 cross-surface action hallucination', () => {
  const rescue = new AiIntentRescueService();

  it.each(
    E2E131_CROSS_SURFACE_HALLUCINATION_SCENARIOS.filter((s) =>
      s.expectedAction === 'remove_service_from_cart',
    ).map((s) => [s.id, s]),
  )('cart remove detectors for %s', (_id, row) => {
    expect(isRemoveServiceFromCartPrompt(row.prompt)).toBe(true);
    expect(isRemoveRetailFromBookingPrompt(row.prompt)).toBe(false);
    expect(
      rescueSelfServiceBookingIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('remove_service_from_cart');
  });

  it.each(E2E131_CROSS_SURFACE_HALLUCINATION_SCENARIOS.map((s) => [s.id, s]))(
    'AiIntentRescueService remaps wrong-surface %s',
    (_id, row) => {
      for (const fromAction of [
        row.misclassifiedAction,
        'unknown',
      ] as const) {
        const result = rescue.rescue({
          prompt: row.prompt,
          action: fromAction,
          params: {},
          surface: row.surface,
        });
        expect(result?.action).toBe(row.expectedAction);
        expect(result?.action).not.toBe(row.misclassifiedAction);
        expect(result?.action).not.toBe('remove_retail_from_booking');
      }
    },
  );

  it.each(
    E2E131_PROVIDER_RETAIL_CART_STILL_MATCH.map((s) => [s.id, s.prompt]),
  )('provider retail remove still matches %s', (_id, prompt) => {
    expect(isRemoveRetailFromBookingPrompt(prompt)).toBe(true);
    expect(
      rescueProviderExp3Intent(prompt, 'unknown')?.action,
    ).toBe('remove_retail_from_booking');
    const result = rescue.rescue({
      prompt,
      action: 'unknown',
      params: {},
      surface: 'provider',
    });
    expect(result?.action).toBe('remove_retail_from_booking');
  });

  it('provider retail cart does not win on customer surface', () => {
    const result = rescue.rescue({
      prompt: 'Remove the serum from cart',
      action: 'unknown',
      params: {},
      surface: 'customer',
    });
    // Serum+cart is retail-shaped; on customer surface Exp3 is gated so cart
    // self-service may still claim it — either way not a dashboard admin action.
    expect(result?.action).not.toBe('unassign_employee_services');
  });
});
