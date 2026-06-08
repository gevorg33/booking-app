import {
  CUSTOMER_PUBLIC_SELF_SERVICE_SCENARIOS,
  CUSTOMER_SELF_SERVICE_CLASSIFIER_RULES,
  PUBLIC_SELF_SERVICE_CLASSIFIER_RULES,
} from './ai-customer-public-self-service.fixtures.js';
import {
  isPublicAccountCrmIntent,
  isPublicPaymentsIntent,
  isPublicSelfServiceHandlerAction,
  rescueCustomerPublicSelfServiceIntent,
} from './ai-customer-public-self-service.util.js';

describe('ai-customer-public-self-service.util (parity-2.3)', () => {
  it('exports classifier rule blocks', () => {
    expect(CUSTOMER_SELF_SERVICE_CLASSIFIER_RULES).toContain('cancel_my_booking');
    expect(PUBLIC_SELF_SERVICE_CLASSIFIER_RULES).toContain('booking_help');
  });

  it.each(CUSTOMER_PUBLIC_SELF_SERVICE_SCENARIOS)(
    'rescueCustomerPublicSelfServiceIntent $id',
    ({ prompt, surface, expectedAction }) => {
      const rescued = rescueCustomerPublicSelfServiceIntent(
        prompt,
        'unknown',
        surface,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it('maps public cancel/reschedule prompts to booking_help', () => {
    expect(
      rescueCustomerPublicSelfServiceIntent(
        'Cancel my booking please',
        'unknown',
        'public',
      )?.action,
    ).toBe('booking_help');
    expect(
      rescueCustomerPublicSelfServiceIntent(
        'Help me manage and cancel my visit',
        'unknown',
        'public',
      )?.action,
    ).toBe('booking_help');
  });

  it('does not rescue admin CRM intents on public surface', () => {
    expect(
      rescueCustomerPublicSelfServiceIntent(
        'Tag Anna as VIP',
        'unknown',
        'public',
      ),
    ).toBeNull();
  });

  it('lists public handler actions', () => {
    expect(isPublicSelfServiceHandlerAction('buy_gift_card')).toBe(true);
    expect(isPublicSelfServiceHandlerAction('create_booking')).toBe(false);
    expect(isPublicAccountCrmIntent('my_profile')).toBe(true);
    expect(isPublicPaymentsIntent('buy_gift_card')).toBe(true);
  });
});
