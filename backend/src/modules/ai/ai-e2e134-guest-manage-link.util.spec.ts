import {
  E2E134_GUEST_MANAGE_LINK_CANCEL_SCENARIOS,
  E2E134_MY_APPOINTMENTS_MUST_NOT_MATCH,
  E2E134_MY_APPOINTMENTS_STILL_MATCH,
} from './ai-e2e134-guest-manage-link.fixtures.js';
import { isMyAppointmentsPrompt } from './ai-customer-crm.util.js';
import {
  extractManageLinkCredentialsFromPrompt,
  rescueManageBookingWithTokenIntent,
} from './ai-manage-booking-with-token.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('e2e-bug.134 guest manage-link cancel routing', () => {
  const rescue = new AiIntentRescueService();

  it.each(E2E134_GUEST_MANAGE_LINK_CANCEL_SCENARIOS.map((s) => [s.id, s]))(
    'rescueManageBookingWithTokenIntent %s',
    (_id, row) => {
      const creds = extractManageLinkCredentialsFromPrompt(row.prompt);
      expect(creds.bookingId).toBeTruthy();
      expect(creds.manageToken).toBeTruthy();
      expect(
        rescueManageBookingWithTokenIntent(row.prompt, row.misclassifiedAction)
          ?.action,
      ).toBe(row.expectedAction);
    },
  );

  it.each(E2E134_GUEST_MANAGE_LINK_CANCEL_SCENARIOS.map((s) => [s.id, s]))(
    'self-service rescue upgrades misclassified %s',
    (_id, row) => {
      expect(
        rescueSelfServiceBookingIntent(row.prompt, row.misclassifiedAction)
          ?.action,
      ).toBe(row.expectedAction);
    },
  );

  it.each(E2E134_GUEST_MANAGE_LINK_CANCEL_SCENARIOS.map((s) => [s.id, s]))(
    'AiIntentRescueService public/customer rescue %s (e2e-bug.134)',
    (_id, row) => {
      for (const fromAction of [
        row.misclassifiedAction,
        'cancel_my_booking',
        'my_appointments',
        'unknown',
      ] as const) {
        // No `fromAction === row.expectedAction` guard: every expected action is
        // a `*_with_token` / `explain_manage_booking_context` value, disjoint from
        // the four misclassifications above, so it could never have fired.
        const result = rescue.rescue({
          prompt: row.prompt,
          action: fromAction,
          params: {},
          surface: row.surface,
        });
        expect(result?.action).toBe(row.expectedAction);
        expect(result?.params).toMatchObject({
          bookingId: expect.any(String),
          manageToken: expect.any(String),
        });
      }
    },
  );

  it.each(E2E134_MY_APPOINTMENTS_MUST_NOT_MATCH.map((s) => [s.id, s.prompt]))(
    'isMyAppointmentsPrompt rejects mutate/manage-link %s',
    (_id, prompt) => {
      expect(isMyAppointmentsPrompt(prompt)).toBe(false);
    },
  );

  it.each(E2E134_MY_APPOINTMENTS_STILL_MATCH.map((s) => [s.id, s.prompt]))(
    'isMyAppointmentsPrompt still matches list phrasing %s',
    (_id, prompt) => {
      expect(isMyAppointmentsPrompt(prompt)).toBe(true);
    },
  );

  it('does not let CRM steal cancel_my_booking into my_appointments', () => {
    const prompt =
      'Please cancel my booking https://example.com/manage?bookingId=book-1&token=tok-1';
    const result = rescue.rescue({
      prompt,
      action: 'cancel_my_booking',
      params: {},
      surface: 'public',
    });
    expect(result?.action).toBe('cancel_booking_with_token');
    expect(result?.action).not.toBe('my_appointments');
  });
});
