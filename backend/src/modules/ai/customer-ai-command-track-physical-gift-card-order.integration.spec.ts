import {
  TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS,
  TRACK_PHYSICAL_GIFT_CARD_ORDER_RESCUE_SCENARIOS,
  rescueTrackPhysicalGiftCardOrderIntent,
} from './ai-track-physical-gift-card-order.util.js';
import { TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS } from './ai-track-physical-gift-card-order-multilingual.fixtures.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';

describe('customer-ai-command track_physical_gift_card_order integration (ai-cmd-customer-4.6.4)', () => {
  it.each(
    TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues track_physical_gift_card_order for $id', (_id, row) => {
    expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
      'track_physical_gift_card_order',
    );
    expect(
      rescueTrackPhysicalGiftCardOrderIntent(row.prompt, 'unknown')?.action,
    ).toBe('track_physical_gift_card_order');
  });

  it.each(
    TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'rescues multilingual track_physical_gift_card_order for $id',
    (_id, row) => {
      expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
        'track_physical_gift_card_order',
      );
    },
  );

  it.each(
    TRACK_PHYSICAL_GIFT_CARD_ORDER_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'rescues misclassified track_physical_gift_card_order for $id',
    (_id, row) => {
      expect(
        rescueTrackPhysicalGiftCardOrderIntent(
          row.prompt,
          row.misclassifiedAction,
        )?.action,
      ).toBe('track_physical_gift_card_order');
    },
  );
});
