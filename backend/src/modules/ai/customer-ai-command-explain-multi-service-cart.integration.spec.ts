import {
  EXPLAIN_MULTI_SERVICE_CART_PROMPTS,
  EXPLAIN_MULTI_SERVICE_CART_RESCUE_SCENARIOS,
} from './ai-explain-multi-service-cart.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS } from './ai-explain-multi-service-cart-multilingual.fixtures.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';

describe('customer-ai-command explain_multi_service_cart integration (ai-cmd-customer-4.6.1)', () => {
  it.each(
    EXPLAIN_MULTI_SERVICE_CART_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues explain_multi_service_cart for $id', (_id, row) => {
    expect(rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_multi_service_cart',
    );
  });

  it.each(
    EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues multilingual explain_multi_service_cart for $id', (_id, row) => {
    expect(rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_multi_service_cart',
    );
  });

  it.each(
    EXPLAIN_MULTI_SERVICE_CART_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues misclassified explain_multi_service_cart for $id', (_id, row) => {
    expect(
      rescueSelfServiceBookingIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('explain_multi_service_cart');
  });
});
