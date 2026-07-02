import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import { handleExplainDepositForfeitureLogic } from './ai-explain-deposit-forfeiture.logic.js';

describe('ai-explain-deposit-forfeiture.logic (ai-cmd-customer-4.20.2)', () => {
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

  it('returns deposit forfeiture action with prepayment details', async () => {
    const result = await handleExplainDepositForfeitureLogic(
      deps() as any,
      'biz-1',
      { sessionCustomerId: 'cust-1', bookingId: 'book-1' },
      'Do I lose my deposit if I cancel?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_deposit_forfeiture');
    expect(result.summary).toMatch(/deposit|prepayment|Refunds|forfeit/i);
    expect(
      (result.details as { focusDepositForfeiture?: boolean })
        .focusDepositForfeiture,
    ).toBe(true);
    expect((result.details as { prepaymentMode?: string }).prepaymentMode).toBe(
      'deposit',
    );
  });

  it('includes general deposit guidance without booking context', async () => {
    const result = await handleExplainDepositForfeitureLogic(
      deps() as any,
      'biz-1',
      {},
      'Can I cancel for free?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_deposit_forfeiture');
    expect(result.summary).toMatch(/50% deposit prepayment|forfeit/i);
  });

  it('returns failure when business is missing', async () => {
    const result = await handleExplainDepositForfeitureLogic(
      {
        businessRepo: { findOne: jest.fn(async () => null) },
        bookingRepo: { findOne: jest.fn() },
      } as any,
      'biz-1',
      {},
      'Do I lose my deposit if I cancel?',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('explain_deposit_forfeiture');
  });

  it('defaults prepayment mode when business has no deposit settings', async () => {
    const result = await handleExplainDepositForfeitureLogic(
      {
        businessRepo: {
          findOne: jest.fn(async () => ({
            id: 'biz-1',
            settings: { publicBooking: {} },
          })),
        },
        bookingRepo: { findOne: jest.fn(async () => null) },
      } as any,
      'biz-1',
      {},
      'Is the 50% refundable?',
    );
    expect(result.success).toBe(true);
    expect((result.details as { prepaymentMode?: string }).prepaymentMode).toBe(
      'none',
    );
    expect(
      (result.details as { defaultDepositPercent?: number | null })
        .defaultDepositPercent,
    ).toBe(null);
  });
});
