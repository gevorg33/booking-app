import { REBOOK_LAST_APPOINTMENT_PROMPTS } from './ai-rebook-last-appointment.fixtures.js';
import { rescueRebookLastAppointmentIntent } from './ai-rebook-last-appointment.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

describe('customer-ai-command rebook_last_appointment integration (ai-cmd-customer-4.4.8)', () => {
  it.each(REBOOK_LAST_APPOINTMENT_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues rebook_last_appointment for $id',
    (_id, row) => {
      expect(
        rescueRebookLastAppointmentIntent(row.prompt, 'book_appointment')
          ?.action,
      ).toBe('rebook_last_appointment');
      expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
        'rebook_last_appointment',
      );
    },
  );
});
