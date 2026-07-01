import {
  CUSTOMER_RESUME_PENDING_PAYMENT_CLASSIFIER_RULES,
  isResumePendingPaymentPrompt,
  parsePendingCheckoutPaymentFromParams,
  parseResumePendingPaymentFromPrompt,
  rescueResumePendingPaymentIntent,
  buildResumePendingPaymentNavigate,
} from './ai-resume-pending-payment.util.js';
import {
  RESUME_PENDING_PAYMENT_PROMPTS,
  RESUME_PENDING_PAYMENT_RESCUE_SCENARIOS,
} from './ai-resume-pending-payment.fixtures.js';
import { RESUME_PENDING_PAYMENT_MULTILINGUAL_SCENARIOS } from './ai-resume-pending-payment-multilingual.fixtures.js';

describe('ai-resume-pending-payment.util', () => {
  it('exports classifier rules for resume_pending_payment', () => {
    expect(CUSTOMER_RESUME_PENDING_PAYMENT_CLASSIFIER_RULES).toContain(
      'resume_pending_payment',
    );
  });

  it.each(RESUME_PENDING_PAYMENT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects resume pending payment prompt for $id',
    (_id, row) => {
      expect(isResumePendingPaymentPrompt(row.prompt)).toBe(true);
      expect(parseResumePendingPaymentFromPrompt(row.prompt)).toEqual({
        pending: null,
      });
      expect(rescueResumePendingPaymentIntent(row.prompt, 'unknown')).toEqual({
        action: 'resume_pending_payment',
        rescueReason: 'resume_pending_payment',
      });
    },
  );

  it.each(
    RESUME_PENDING_PAYMENT_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'detects multilingual resume pending payment prompt for $id',
    (_id, row) => {
      expect(isResumePendingPaymentPrompt(row.prompt)).toBe(true);
      expect(
        rescueResumePendingPaymentIntent(row.prompt, 'unknown')?.action,
      ).toBe('resume_pending_payment');
    },
  );

  it.each(
    RESUME_PENDING_PAYMENT_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues $id from misclassified action', (_id, row) => {
    expect(
      rescueResumePendingPaymentIntent(row.prompt, row.misclassifiedAction),
    ).toEqual({
      action: row.expectedAction,
      rescueReason: 'resume_pending_payment',
    });
  });

  it('parses pending checkout payment from flat session params', () => {
    expect(
      parsePendingCheckoutPaymentFromParams({
        pendingCheckoutSessionId: 'cs_test',
        pendingCheckoutServiceId: 'svc-1',
        pendingCheckoutStartTime: '2026-06-25T14:00:00.000Z',
        pendingCheckoutEmployeeId: 'emp-1',
      }),
    ).toEqual({
      sessionId: 'cs_test',
      serviceId: 'svc-1',
      startTime: '2026-06-25T14:00:00.000Z',
      employeeId: 'emp-1',
    });
  });

  it('parses pending checkout payment from nested object', () => {
    expect(
      parsePendingCheckoutPaymentFromParams({
        pendingCheckoutPayment: {
          sessionId: 'cs_nested',
          serviceId: 'svc-2',
          startTime: '2026-06-26T10:00:00.000Z',
        },
      }),
    ).toEqual({
      sessionId: 'cs_nested',
      serviceId: 'svc-2',
      startTime: '2026-06-26T10:00:00.000Z',
      employeeId: undefined,
    });
  });

  it('builds checkout navigate with session_id', () => {
    expect(
      buildResumePendingPaymentNavigate({
        sessionId: 'cs_test',
        serviceId: 'svc-1',
        startTime: '2026-06-25T14:00:00.000Z',
        employeeId: 'emp-1',
      }),
    ).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-1',
        startTime: '2026-06-25T14:00:00.000Z',
        session_id: 'cs_test',
        resumePayment: '1',
        employeeId: 'emp-1',
      },
    });
  });

  it('does not treat explicit pay online as resume pending payment', () => {
    expect(isResumePendingPaymentPrompt('Pay online with card')).toBe(false);
    expect(isResumePendingPaymentPrompt('Continue to payment')).toBe(false);
  });

  it('does not treat booking help as resume pending payment', () => {
    expect(isResumePendingPaymentPrompt('Walk me through booking')).toBe(false);
  });

  it('returns null rescue when already classified correctly', () => {
    expect(
      rescueResumePendingPaymentIntent(
        'Continue my payment',
        'resume_pending_payment',
      ),
    ).toBeNull();
  });
});
