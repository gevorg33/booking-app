import {
  E2E252_CUSTOMER_OUTBOUND_NEGATIVE,
  E2E252_OWNER_RESCHEDULE_ALERT_SCENARIOS,
} from './ai-e2e252-owner-reschedule-alert.fixtures.js';
import { isRescheduleExistingAppointmentPrompt } from './ai-find-soonest-appointment.util.js';
import {
  extractBusinessEmailOnCustomerChangeToggleFromPrompt,
  isToggleBusinessEmailOnCustomerChangePrompt,
  rescuePushNotificationsIntent,
} from './ai-push-notifications.util.js';

describe('e2e-bug.252 owner alert — a customer reschedules', () => {
  it('is not stolen by isRescheduleExistingAppointmentPrompt', () => {
    expect(
      isRescheduleExistingAppointmentPrompt(
        'Alert me whenever customers reschedule their appointment',
      ),
    ).toBe(false);
    expect(
      isRescheduleExistingAppointmentPrompt(
        'Alert me every time a customer reschedules their appointment',
      ),
    ).toBe(false);
  });

  it.each(
    E2E252_OWNER_RESCHEDULE_ALERT_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects toggle for %s', (_id, row) => {
    expect(isToggleBusinessEmailOnCustomerChangePrompt(row.prompt)).toBe(
      row.expectToggle,
    );
    if (row.expectToggle) {
      expect(
        rescuePushNotificationsIntent(row.prompt, 'create_booking')?.action,
      ).toBe('toggle_business_email_on_customer_change');
      expect(
        rescuePushNotificationsIntent(row.prompt, 'react_agent')?.action,
      ).toBe('toggle_business_email_on_customer_change');
      expect(rescuePushNotificationsIntent(row.prompt, 'unknown')?.action).toBe(
        'toggle_business_email_on_customer_change',
      );
      if (typeof row.enabled === 'boolean') {
        expect(
          extractBusinessEmailOnCustomerChangeToggleFromPrompt(row.prompt),
        ).toBe(row.enabled);
      }
    }
  });

  it.each(E2E252_CUSTOMER_OUTBOUND_NEGATIVE.map((p) => [p] as const))(
    'does not steal customer-outbound: %s',
    (prompt) => {
      expect(isToggleBusinessEmailOnCustomerChangePrompt(prompt)).toBe(false);
    },
  );
});
