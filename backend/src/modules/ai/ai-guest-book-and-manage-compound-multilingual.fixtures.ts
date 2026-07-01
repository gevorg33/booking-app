import type { GuestBookAndManageCompoundFixture } from './ai-guest-book-and-manage-compound.fixtures.js';

export const GUEST_BOOK_AND_MANAGE_MULTILINGUAL_SCENARIOS: readonly GuestBookAndManageCompoundFixture[] =
  [
    {
      id: 'guest-book-manage-hy-email',
      prompt:
        'Book as guest and email me the manage link — hachax amragrel ev uxarkel karavarman hghum@',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-book-manage-hy-no-account',
      prompt:
        'Book without an account and send manage link — amragrel aranc hashvi ev uxarkel hghum@',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-book-manage-ru-email',
      prompt:
        'Book as guest and email me the manage link — zabronir kak gost i otprav ssylku na upravlenie',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-book-manage-ru-no-account',
      prompt:
        'Book haircut without account and send booking link — strizhka bez akkaunta i ssylka na zapis',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        serviceName: 'haircut',
        guestLookup: true,
        delivery: 'email',
      },
    },
  ];
