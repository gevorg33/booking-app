import { rescueConsumerClinicLabBookingIntent } from './ai-clinic-lab-booking.util.js';
import { BOOK_LAB_FROM_ORDER_PROMPTS } from './ai-book-lab-from-order.fixtures.js';
import { BOOK_LAB_FROM_ORDER_MULTILINGUAL_SCENARIOS } from './ai-book-lab-from-order-multilingual.fixtures.js';

describe('customer-ai-command book_lab_from_order integration (ai-cmd-customer-4.14.4)', () => {
  it.each(
    [
      ...BOOK_LAB_FROM_ORDER_PROMPTS,
      ...BOOK_LAB_FROM_ORDER_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues book_lab_from_order for $0', (_id, prompt) => {
    expect(
      rescueConsumerClinicLabBookingIntent(prompt, 'unknown')?.action,
    ).toBe('book_lab_from_order');
  });
});
