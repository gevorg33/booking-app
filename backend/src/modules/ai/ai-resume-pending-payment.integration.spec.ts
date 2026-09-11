import { validateCommand } from './command-completion.validator.js';
import { handleResumePendingPaymentLogic } from './ai-resume-pending-payment.logic.js';
import {
  RESUME_PENDING_PAYMENT_PROMPTS,
  RESUME_PENDING_PAYMENT_RESCUE_SCENARIOS,
  RESUME_PENDING_PAYMENT_HANDLER_FIXTURES,
} from './ai-resume-pending-payment.fixtures.js';
import { rescueResumePendingPaymentIntent } from './ai-resume-pending-payment.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai resume pending payment integration (ai-cmd-customer-4.2.3)', () => {
  const draftRepo = { findOne: jest.fn() };

  const deps = { draftRepo };

  beforeEach(() => {
    jest.clearAllMocks();
    draftRepo.findOne.mockResolvedValue({
      id: 'draft-1',
      stripeSessionId: 'cs_test_resume',
      businessId: 'biz-1',
      status: 'pending',
      expiresAt: new Date(Date.now() + 60_000),
      amount: 25,
      currency: 'USD',
      payload: {
        serviceId: 'svc-haircut',
        startTime: '2026-06-25T14:00:00.000Z',
      },
    });
  });

  it.each(RESUME_PENDING_PAYMENT_PROMPTS)('validates $id', ({ prompt }) => {
    const validation = validateCommand(
      makeResolvedCommand({
        action: 'resume_pending_payment',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }),
    );
    expect(validation.issues).toEqual([]);
  });

  it('executes handler with device pending checkout', async () => {
    const pending = RESUME_PENDING_PAYMENT_HANDLER_FIXTURES[0].pending;
    const result = await handleResumePendingPaymentLogic(
      deps,
      'biz-1',
      {
        pendingCheckoutSessionId: pending.sessionId,
        pendingCheckoutServiceId: pending.serviceId,
        pendingCheckoutStartTime: pending.startTime,
        pendingCheckoutEmployeeId: pending.employeeId,
      },
      'Continue my payment',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('resume_pending_payment');
    expect(result.details?.navigate).toBeDefined();
  });

  it.each(RESUME_PENDING_PAYMENT_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueResumePendingPaymentIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'resume_pending_payment',
      });
    },
  );
});
