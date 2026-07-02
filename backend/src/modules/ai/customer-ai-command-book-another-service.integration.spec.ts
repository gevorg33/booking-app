import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { BOOK_ANOTHER_SERVICE_PROMPTS } from './ai-book-another-service.fixtures.js';

describe('customer-ai-command book_another_service integration (ai-cmd-customer-4.3.6)', () => {
  it.each(
    BOOK_ANOTHER_SERVICE_PROMPTS.filter((row) => row.surface === 'customer'),
  )('rescues book_another_service for $id', ({ prompt }) => {
    const rescued = rescueSelfServiceBookingIntent(prompt, 'unknown');
    expect(rescued?.action).toBe('book_another_service');
  });
});
