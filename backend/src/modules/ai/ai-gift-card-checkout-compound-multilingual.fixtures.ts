import type { GiftCardCheckoutCompoundFixture } from './ai-gift-card-checkout-compound.fixtures.js';

export const GIFT_CARD_CHECKOUT_MULTILINGUAL_SCENARIOS: readonly GiftCardCheckoutCompoundFixture[] =
  [
    {
      id: 'gift-checkout-hy-use-code',
      prompt:
        'Use gift card GCM-HY1234 and book nearest haircut — ogtagorcel gift card ev amragrel amenaprox',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-HY1234',
        serviceName: 'haircut',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-hy-check-balance',
      prompt:
        'Check gift card GCM-HY5678 balance and book soonest massage — stugel balance ev amragrel',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-HY5678',
        serviceName: 'massage',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-ru-use-code',
      prompt:
        'Use gift card GCM-RU1234 and book nearest facial — ispolzuj podarochnuyu kartu i zabroniruj blizhajshij slot',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-RU1234',
        serviceName: 'facial',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-ru-check-balance',
      prompt:
        'Check gift card GCM-RU9876 balance and book nearest slot — prover balans i zabroniruj blizhajshij slot',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-RU9876',
        bookingFirstAvailable: true,
      },
    },
  ];
