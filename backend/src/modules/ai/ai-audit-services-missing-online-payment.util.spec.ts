import { AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_PROMPTS } from './ai-audit-services-missing-online-payment.fixtures.js';
import {
  isAuditServicesMissingOnlinePaymentPrompt,
  rescueAuditServicesMissingOnlinePaymentIntent,
} from './ai-audit-services-missing-online-payment.util.js';
import { isExplainServiceOnlinePaymentSetupPrompt } from './ai-service-online-payment-setup.util.js';

describe('ai-audit-services-missing-online-payment.util', () => {
  it.each(AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_PROMPTS)(
    'detects audit prompt $id',
    ({ prompt }) => {
      expect(isAuditServicesMissingOnlinePaymentPrompt(prompt)).toBe(true);
    },
  );

  it('does not detect positive list-services payment filter prompts', () => {
    expect(
      isAuditServicesMissingOnlinePaymentPrompt(
        'List services that require online payment',
      ),
    ).toBe(false);
  });

  it('does not detect explain prepayment setup', () => {
    expect(
      isAuditServicesMissingOnlinePaymentPrompt(
        'Which services require prepayment on public booking?',
      ),
    ).toBe(false);
    expect(
      isExplainServiceOnlinePaymentSetupPrompt(
        'Which services require prepayment on public booking?',
      ),
    ).toBe(true);
  });

  it('does not detect configure online payment mutate', () => {
    expect(
      isAuditServicesMissingOnlinePaymentPrompt(
        'Accept online payment on public booking for all services',
      ),
    ).toBe(false);
  });

  it('rescues unknown action to audit_services_missing_online_payment', () => {
    expect(
      rescueAuditServicesMissingOnlinePaymentIntent(
        "Which services still don't accept online payment?",
        'unknown',
      ),
    ).toEqual({
      action: 'audit_services_missing_online_payment',
      rescueReason: 'audit_services_missing_online_payment',
    });
  });
});
