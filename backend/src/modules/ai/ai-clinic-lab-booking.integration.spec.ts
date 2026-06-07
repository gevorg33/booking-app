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
      const rescued = rescueService.rescue({
        prompt,
        action: misclassifiedAction,
        params: {},
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
