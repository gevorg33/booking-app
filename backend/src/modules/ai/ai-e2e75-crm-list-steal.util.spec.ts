import {
  E2E75_CLASSIFIED_MUST_SURVIVE,
  E2E75_DETECTOR_MUST_REJECT,
  E2E75_LIST_STILL_MATCHES,
} from './ai-e2e75-crm-list-steal.fixtures.js';
import { isProtectedFromCrmListSteal } from './ai-crm-list-steal-guard.util.js';
import {
  isMyAppointmentsPrompt,
  isMySubscriptionsPrompt,
  rescueCustomerCrmIntent,
} from './ai-customer-crm.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('e2e-bug.75 CRM list steal must not clobber self-service', () => {
  const rescue = new AiIntentRescueService();

  it('protects live victim actions from CRM list steal', () => {
    expect(isProtectedFromCrmListSteal('cancel_my_booking')).toBe(true);
    expect(isProtectedFromCrmListSteal('reschedule_my_booking')).toBe(true);
    expect(isProtectedFromCrmListSteal('cancel_my_subscription')).toBe(true);
    expect(isProtectedFromCrmListSteal('start_pre_visit_intake')).toBe(true);
    expect(isProtectedFromCrmListSteal('add_booking_to_calendar')).toBe(true);
    expect(isProtectedFromCrmListSteal('confirm_my_booking_details')).toBe(
      true,
    );
    expect(isProtectedFromCrmListSteal('unknown')).toBe(false);
  });

  it.each(E2E75_DETECTOR_MUST_REJECT)(
    '$id: list detector rejects mutate/intake phrasing',
    ({ prompt, kind }) => {
      if (kind === 'appointments') {
        expect(isMyAppointmentsPrompt(prompt)).toBe(false);
      } else {
        expect(isMySubscriptionsPrompt(prompt)).toBe(false);
      }
    },
  );

  it.each(E2E75_LIST_STILL_MATCHES)(
    '$id: genuine list phrasing still matches',
    ({ prompt, kind }) => {
      if (kind === 'appointments') {
        expect(isMyAppointmentsPrompt(prompt)).toBe(true);
      } else {
        expect(isMySubscriptionsPrompt(prompt)).toBe(true);
      }
    },
  );

  it.each(E2E75_CLASSIFIED_MUST_SURVIVE)(
    '$id: rescueCustomerCrmIntent does not clobber $classifiedAction',
    ({ prompt, classifiedAction }) => {
      const crm = rescueCustomerCrmIntent(prompt, classifiedAction);
      expect(crm).toBeNull();
    },
  );

  it.each(E2E75_CLASSIFIED_MUST_SURVIVE)(
    '$id: AiIntentRescueService keeps $classifiedAction (no CRM list steal)',
    ({ prompt, classifiedAction }) => {
      const result = rescue.rescue({
        prompt,
        action: classifiedAction,
        params: {},
        surface: 'customer',
      });
      if (result) {
        expect(result.action).not.toBe('my_appointments');
        expect(result.action).not.toBe('my_subscriptions');
      }
      // When rescue is a no-op, the classified action is what the pipeline keeps.
      if (!result || result.action === classifiedAction) {
        expect(classifiedAction).not.toBe('my_appointments');
        expect(classifiedAction).not.toBe('my_subscriptions');
      }
    },
  );

  it.each(E2E75_CLASSIFIED_MUST_SURVIVE)(
    '$id: unknown-action rescue never lands on CRM list for these prompts',
    ({ prompt, classifiedAction }) => {
      const result = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        surface: 'customer',
      });
      expect(result?.action).not.toBe('my_appointments');
      expect(result?.action).not.toBe('my_subscriptions');
      // Prefer the intended family when a deterministic rescue exists.
      if (
        classifiedAction === 'cancel_my_booking' ||
        classifiedAction === 'reschedule_my_booking' ||
        classifiedAction === 'cancel_my_subscription' ||
        classifiedAction === 'confirm_my_booking_details' ||
        classifiedAction === 'add_booking_to_calendar'
      ) {
        expect(result?.action).toBe(classifiedAction);
      }
    },
  );
});
