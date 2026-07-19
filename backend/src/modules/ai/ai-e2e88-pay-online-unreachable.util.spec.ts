import { isConfirmMyBookingDetailsPrompt } from './ai-confirm-my-booking-details.util.js';
import { isMyAppointmentsPrompt } from './ai-customer-crm.util.js';
import { isListMyUpcomingAppointmentsPrompt } from './ai-list-my-upcoming-appointments.util.js';
import {
  isExplicitPayOnlinePrompt,
  rescuePayOnlineCheckoutIntent,
} from './ai-pay-online-checkout.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { E2E88_PAY_ONLINE_PROMPTS } from './ai-e2e88-pay-online-unreachable.fixtures.js';

describe('e2e-bug.88 pay_online must not be stolen by booking-read rescues', () => {
  it.each(E2E88_PAY_ONLINE_PROMPTS)(
    '$id: detectors prefer pay_online over $stolenBy',
    ({ prompt, expectedAction }) => {
      expect(isExplicitPayOnlinePrompt(prompt)).toBe(true);
      expect(isConfirmMyBookingDetailsPrompt(prompt)).toBe(false);
      expect(isListMyUpcomingAppointmentsPrompt(prompt)).toBe(false);
      expect(isMyAppointmentsPrompt(prompt)).toBe(false);
      expect(rescuePayOnlineCheckoutIntent(prompt, 'unknown')?.action).toBe(
        expectedAction,
      );
      expect(rescuePaymentsIntent(prompt, 'unknown')?.action).toBe(
        expectedAction,
      );
      expect(
        rescuePaymentsIntent(prompt, 'confirm_my_booking_details')?.action,
      ).toBe(expectedAction);
      expect(
        rescuePaymentsIntent(prompt, 'list_my_upcoming_appointments')?.action,
      ).toBe(expectedAction);
      expect(rescuePaymentsIntent(prompt, 'my_appointments')?.action).toBe(
        expectedAction,
      );
    },
  );

  it('normal booking-detail reads still match confirm_my_booking_details', () => {
    expect(isConfirmMyBookingDetailsPrompt('What time is my appointment?')).toBe(
      true,
    );
    expect(
      isListMyUpcomingAppointmentsPrompt('Show my upcoming appointments'),
    ).toBe(true);
    expect(isMyAppointmentsPrompt('List my appointments')).toBe(true);
  });
});
