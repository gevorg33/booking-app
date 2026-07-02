import type { DiscoverBookAndPayCompoundFixture } from './ai-discover-book-and-pay-compound.fixtures.js';

export const DISCOVER_BOOK_AND_PAY_MULTILINGUAL_SCENARIOS: readonly DiscoverBookAndPayCompoundFixture[] =
  [
    {
      id: 'discover-book-pay-hy-massage-60',
      prompt:
        'Book cheapest massage under $60 tomorrow and pay online — amragrel amenapo masaz',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-hy-facial-50',
      prompt:
        'Show facials under $50, check who is free tomorrow, book soonest slot, pay with card — vchar kartov',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-ru-massage-60',
      prompt:
        'Book cheapest massage under $60 tomorrow and pay online — zabroniruj samyj deshevyj massazh',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-ru-haircut-45',
      prompt:
        'Show haircut under $45, check who is free tomorrow, book nearest slot, pay with card — oplati kartoj',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-public-hy-massage',
      prompt:
        'Book massage under $60 tomorrow, check availability, book nearest, pay online — amragrel masaz',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
      ],
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-public-ru-facial',
      prompt:
        'Facial under $50 tomorrow, check availability, book soonest, pay online — oplati onlajn',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
      ],
      paymentAction: 'pay_online',
    },
  ];
