import { handleResumePendingPaymentLogic } from './ai-resume-pending-payment.logic.js';
import {
  RESUME_PENDING_PAYMENT_HANDLER_FIXTURES,
  RESUME_PENDING_PAYMENT_PROMPTS,
} from './ai-resume-pending-payment.fixtures.js';

describe('ai-resume-pending-payment.logic', () => {
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
        employeeId: 'emp-1',
      },
    });
  });

  it('navigates back to checkout when pending payment is on device', async () => {
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
    expect(result.details).toMatchObject({
      navigate: {
        path: 'checkout',
        query: expect.objectContaining({
          session_id: pending.sessionId,
          serviceId: pending.serviceId,
        }),
      },
    });
  });

  it.each(RESUME_PENDING_PAYMENT_PROMPTS)(
    'recognizes fixture prompt $id',
    async ({ prompt }) => {
      const result = await handleResumePendingPaymentLogic(
        deps,
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true, missing: expect.any(Array) });
    },
  );

  it('returns clarify when no saved checkout exists', async () => {
    const result = await handleResumePendingPaymentLogic(
      deps,
      'biz-1',
      {},
      'Continue my payment',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('No saved checkout payment');
    expect(result.details).toMatchObject({ clarify: true });
  });

  it('fails when draft already completed', async () => {
    draftRepo.findOne.mockResolvedValue({
      id: 'draft-1',
      stripeSessionId: 'cs_test_resume',
      businessId: 'biz-1',
      status: 'completed',
      expiresAt: new Date(Date.now() + 60_000),
      amount: 25,
      currency: 'USD',
      payload: {},
    });

    const pending = RESUME_PENDING_PAYMENT_HANDLER_FIXTURES[0].pending;
    const result = await handleResumePendingPaymentLogic(
      deps,
      'biz-1',
      {
        pendingCheckoutSessionId: pending.sessionId,
        pendingCheckoutServiceId: pending.serviceId,
        pendingCheckoutStartTime: pending.startTime,
      },
      'Continue my payment',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('already completed');
  });

  it('fails when draft expired', async () => {
    draftRepo.findOne.mockResolvedValue({
      id: 'draft-1',
      stripeSessionId: 'cs_test_resume',
      businessId: 'biz-1',
      status: 'pending',
      expiresAt: new Date(Date.now() - 60_000),
      amount: 25,
      currency: 'USD',
      payload: {},
    });

    const pending = RESUME_PENDING_PAYMENT_HANDLER_FIXTURES[0].pending;
    const result = await handleResumePendingPaymentLogic(
      deps,
      'biz-1',
      {
        pendingCheckoutSessionId: pending.sessionId,
        pendingCheckoutServiceId: pending.serviceId,
        pendingCheckoutStartTime: pending.startTime,
      },
      'Continue my payment',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('expired');
  });

  it('returns clarify when prompt does not match', async () => {
    const result = await handleResumePendingPaymentLogic(
      deps,
      'biz-1',
      {},
      'Walk me through booking step by step',
    );

    expect(result.success).toBe(false);
    expect(result.details).toMatchObject({ clarify: true });
  });
});
