import {
  extractListMyUpcomingAppointmentsScopeFromPrompt,
  filterUpcomingBookingsForScope,
  isListMyUpcomingAppointmentsIntent,
  isListMyUpcomingAppointmentsPrompt,
  parseListMyUpcomingAppointmentsFromPrompt,
  rescueListMyUpcomingAppointmentsIntent,
} from './ai-list-my-upcoming-appointments.util.js';
import {
  LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS,
  LIST_MY_UPCOMING_APPOINTMENTS_RESCUE_SCENARIOS,
} from './ai-list-my-upcoming-appointments.fixtures.js';
import { LIST_MY_UPCOMING_APPOINTMENTS_MULTILINGUAL_SCENARIOS } from './ai-list-my-upcoming-appointments-multilingual.fixtures.js';
import { isListMyAppointmentsPrompt } from './ai-self-service-booking.util.js';

describe('ai-list-my-upcoming-appointments.util (ai-cmd-customer-4.4.1)', () => {
  it.each(LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS)(
    'detects prompt $id with scope $scope',
    ({ prompt, scope }) => {
      expect(isListMyUpcomingAppointmentsPrompt(prompt)).toBe(true);
      expect(parseListMyUpcomingAppointmentsFromPrompt(prompt)?.scope).toBe(
        scope,
      );
    },
  );

  it.each(LIST_MY_UPCOMING_APPOINTMENTS_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt, scope }) => {
      expect(isListMyUpcomingAppointmentsPrompt(prompt)).toBe(true);
      expect(parseListMyUpcomingAppointmentsFromPrompt(prompt)?.scope).toBe(
        scope,
      );
    },
  );

  it.each(LIST_MY_UPCOMING_APPOINTMENTS_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueListMyUpcomingAppointmentsIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'list_upcoming_appointments',
      });
    },
  );

  it('does not steal list_my_appointments for general list', () => {
    expect(isListMyUpcomingAppointmentsPrompt('List my appointments')).toBe(
      false,
    );
    expect(isListMyAppointmentsPrompt('List my appointments')).toBe(true);
  });

  it('does not steal confirm_my_booking_details for single booking time', () => {
    expect(
      isListMyUpcomingAppointmentsPrompt('What time is my appointment?'),
    ).toBe(false);
  });

  it('does not steal tour calendar or flexible booking prompts containing this week', () => {
    expect(
      isListMyUpcomingAppointmentsPrompt(
        'Why is a multi-day tour clipped at the week boundary on the calendar?',
      ),
    ).toBe(false);
    expect(
      isListMyUpcomingAppointmentsPrompt(
        'Grab the soonest available massage appointment this week',
      ),
    ).toBe(false);
    expect(
      isListMyUpcomingAppointmentsPrompt(
        'Put me in the earliest opening you have this week',
      ),
    ).toBe(false);
  });

  it('filters next appointment scope', () => {
    const bookings = [
      {
        startTime: '2026-07-20T10:00:00.000Z',
        status: 'confirmed',
      },
      {
        startTime: '2026-07-21T10:00:00.000Z',
        status: 'confirmed',
      },
    ];
    const filtered = filterUpcomingBookingsForScope(
      bookings,
      'next',
      "What's my next appointment?",
      'UTC',
      new Date('2026-07-01T00:00:00.000Z'),
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].startTime).toBe('2026-07-20T10:00:00.000Z');
  });

  it('recognizes intent constant', () => {
    expect(
      isListMyUpcomingAppointmentsIntent('list_my_upcoming_appointments'),
    ).toBe(true);
    expect(
      extractListMyUpcomingAppointmentsScopeFromPrompt(
        'Appointments this week',
      ),
    ).toBe('this_week');
  });
});
