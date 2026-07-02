import { rescueListMyUpcomingAppointmentsIntent } from './ai-list-my-upcoming-appointments.util.js';
import { LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS } from './ai-list-my-upcoming-appointments.fixtures.js';

describe('customer-ai-command list_my_upcoming_appointments integration (ai-cmd-customer-4.4.1)', () => {
  it.each(LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS)(
    'rescues list_my_upcoming_appointments for $id',
    ({ prompt }) => {
      expect(
        rescueListMyUpcomingAppointmentsIntent(prompt, 'unknown')?.action,
      ).toBe('list_my_upcoming_appointments');
    },
  );
});
