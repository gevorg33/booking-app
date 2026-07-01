import type { CancelAndRebookCompoundFixture } from './ai-cancel-and-rebook-compound.fixtures.js';

export const CANCEL_AND_REBOOK_MULTILINGUAL_SCENARIOS: readonly CancelAndRebookCompoundFixture[] =
  [
    {
      id: 'cancel-rebook-hy-friday',
      prompt:
        'Cancel Friday and book the next available slot — chegharkel urbat ev amragrel amenaprox slot@',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-hy-tomorrow',
      prompt:
        "Cancel tomorrow's massage and book soonest — vagh@ masaz@ chegharkel ev amragrel",
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-ru-friday',
      prompt:
        'Cancel Friday and book nearest slot — otmeni pyatnicu i zabroniruj blizhajshij slot',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
    {
      id: 'cancel-rebook-ru-appointment',
      prompt:
        'Cancel my appointment and book next available — otmeni moyu zapis i zabroniruj sleduyushchij slot',
      surface: 'customer',
      orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
      expectedParams: { bookingFirstAvailable: true },
    },
  ];
