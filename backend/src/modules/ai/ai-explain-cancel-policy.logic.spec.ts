import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import { handleExplainCancelPolicyLogic } from './ai-explain-cancel-policy.logic.js';

describe('ai-explain-cancel-policy.logic (ai-cmd-customer-4.4.4)', () => {
  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: {
          publicBooking: {
            customerSelfService: {
              allowCancel: true,
              allowReschedule: true,
              minimumNoticeHours: 24,
              maxReschedulesPerBooking: 3,
              allowProviderChangeOnReschedule: false,
            },
            defaultServicePrepaymentMode: 'deposit',
            defaultServiceDepositPercent: 50,
          },
        },
      })),
    },
    bookingRepo: {
      findOne: jest.fn(async () => ({
        id: 'book-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: 'confirmed',
        paymentStatus: PaymentStatus.PAID,
        startTime: new Date('2030-01-15T14:00:00.000Z'),
        metadata: {},
        service: {
          name: 'Massage',
          price: 80,
          prepaymentMode: PrepaymentMode.DEPOSIT,
          depositAmount: null,
        },
      })),
    },
  });

  it('returns enriched policy summary for booking context', async () => {
    const result = await handleExplainCancelPolicyLogic(
      deps() as any,
      'biz-1',
      { sessionCustomerId: 'cust-1', bookingId: 'book-1' },
      'How much notice do I need to cancel?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_cancel_policy');
    expect(result.summary).toMatch(/Minimum notice: 24 hours/);
    expect(
      (result.details as { focusDepositForfeiture?: boolean })
        .focusDepositForfeiture,
    ).toBe(false);
  });

  it('includes general deposit guidance on policy-only prompts when salon uses deposits', async () => {
    const result = await handleExplainCancelPolicyLogic(
      deps() as any,
      'biz-1',
      {},
      'Explain the cancellation policy',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/Minimum notice: 24 hours/);
    expect(result.summary).toMatch(/50% deposit prepayment|forfeit/i);
  });

  it('returns failure when business is missing', async () => {
    const result = await handleExplainCancelPolicyLogic(
      {
        businessRepo: { findOne: jest.fn(async () => null) },
        bookingRepo: { findOne: jest.fn() },
      } as any,
      'biz-1',
      {},
      'Explain cancellation policy',
    );
    expect(result.success).toBe(false);
  });
});
