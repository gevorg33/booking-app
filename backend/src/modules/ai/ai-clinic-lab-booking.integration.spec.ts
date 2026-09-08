import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-assistant.service.js';
import { PROVIDER_MOBILE_CLASSIFIER_RULES } from './ai-provider-mobile.fixtures.js';
import {
  CONSUMER_LAB_BOOKING_RESCUE_SCENARIOS,
  DASHBOARD_LAB_BOOKING_RESCUE_SCENARIOS,
  PROVIDER_LAB_BOOKING_RESCUE_SCENARIOS,
} from './ai-clinic-lab-booking.fixtures.js';

describe('AiClinicLabBooking integration', () => {
  const rescueService = new AiIntentRescueService();

  it('wires dashboard classifier rules', () => {
    expect(buildCustomerClassifierSchema()).toContain(
      'list_my_lab_booking_requests',
    );
    expect(buildPublicClassifierSchema()).toContain('book_lab_collection');
    expect(PROVIDER_MOBILE_CLASSIFIER_RULES).toContain(
      'list_patient_pending_lab_requests',
    );
  });

  it.each(DASHBOARD_LAB_BOOKING_RESCUE_SCENARIOS)(
    'rescues dashboard prompt $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      // e2e-bug.523 — this block is named for the dashboard but never said so.
      // With surface omitted, 'Book lab collection for Maria tomorrow at 9am'
      // was taken by the *public* disambiguation path — book verb plus concrete
      // time — and returned book_appointment under rescueReason
      // 'public_timed_book', before the dashboard clinic-lab rescue ran.
      // `rescueDashboardClinicLabBookingIntent` answers this prompt correctly on
      // its own, so the intent was never in doubt; the request simply did not
      // say which surface was asking. These commands are dashboard-only by
      // design (see the e2e-bug.77 gate in the rescue service), so naming the
      // surface is what the scenario always meant.
      const rescued = rescueService.rescue({
        prompt,
        action: misclassifiedAction,
        params: {},
        surface: 'dashboard',
      });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescued).toBe(true);
    },
  );

  it.each(CONSUMER_LAB_BOOKING_RESCUE_SCENARIOS)(
    'rescues consumer prompt $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: misclassifiedAction,
        params: {},
      });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescued).toBe(true);
    },
  );

  it.each(PROVIDER_LAB_BOOKING_RESCUE_SCENARIOS)(
    'rescues provider prompt $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: misclassifiedAction,
        params: {},
      });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescued).toBe(true);
    },
  );
});
