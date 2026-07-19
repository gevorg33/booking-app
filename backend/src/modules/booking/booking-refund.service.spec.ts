import { BookingRefundService } from './booking-refund.service.js';
import { PaymentStatus } from './entities/booking.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Booking } from './entities/booking.entity.js';

describe('BookingRefundService', () => {
  const bookingRepo = { save: jest.fn() };
  const stripeService = {
    isConfigured: true,
    client: {
      refunds: { create: jest.fn() },
    },
    connectRequestOptions: jest.fn(),
  };
  const stripeIntegrationService = { resolveConnectAccountId: jest.fn() };

  const service = new BookingRefundService(
    bookingRepo as any,
    stripeService as any,
    stripeIntegrationService as any,
  );

  const business = { id: 'biz-1', settings: {} } as Business;

  const makeBooking = (overrides: Partial<Booking> = {}) =>
    ({
      id: 'book-1',
      metadata: { stripePaymentIntentId: 'pi_1' },
      paymentStatus: PaymentStatus.PAID,
      ...overrides,
    }) as Booking;

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.save.mockImplementation(async (booking: Booking) => booking);
    stripeService.isConfigured = true;
    stripeIntegrationService.resolveConnectAccountId.mockReturnValue(
      'acct_1',
    );
    stripeService.connectRequestOptions.mockReturnValue({
      stripeAccount: 'acct_1',
    });
    stripeService.client.refunds.create.mockResolvedValue({ id: 're_1' });
  });

  it('returns already_refunded when stripeRefundId is set', async () => {
    const result = await service.refundBookingPayment(
      business,
      makeBooking({
        metadata: { stripePaymentIntentId: 'pi_1', stripeRefundId: 're_old' },
      }),
    );
    expect(result).toBe('already_refunded');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('returns skipped when no payment intent is stored', async () => {
    const result = await service.refundBookingPayment(
      business,
      makeBooking({ metadata: {} }),
    );
    expect(result).toBe('skipped');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('returns skipped when Stripe is not configured', async () => {
    stripeService.isConfigured = false;
    const result = await service.refundBookingPayment(
      business,
      makeBooking(),
    );
    expect(result).toBe('skipped');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('refunds via the stored payment intent and persists stripeRefundId + paymentStatus', async () => {
    const booking = makeBooking();
    const result = await service.refundBookingPayment(business, booking);
    expect(result).toBe('refunded');
    expect(stripeService.client.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1' },
      { stripeAccount: 'acct_1', idempotencyKey: 'booking-refund-pi-pi_1' },
    );
    expect(bookingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: PaymentStatus.REFUNDED,
        metadata: expect.objectContaining({ stripeRefundId: 're_1' }),
      }),
    );
  });

  it('prefers the connect account id already stored on the booking metadata', async () => {
    await service.refundBookingPayment(
      business,
      makeBooking({
        metadata: {
          stripePaymentIntentId: 'pi_1',
          stripeConnectAccountId: 'acct_stored',
        },
      }),
    );
    expect(stripeService.connectRequestOptions).toHaveBeenCalledWith(
      'acct_stored',
      business.settings,
    );
    expect(
      stripeIntegrationService.resolveConnectAccountId,
    ).not.toHaveBeenCalled();
  });

  it('falls back to resolving the connect account from business settings', async () => {
    await service.refundBookingPayment(
      business,
      makeBooking({ metadata: { stripePaymentIntentId: 'pi_1' } }),
    );
    expect(stripeIntegrationService.resolveConnectAccountId).toHaveBeenCalledWith(
      business.settings,
    );
  });

  it('uses platform account options when no connect account is configured', async () => {
    stripeIntegrationService.resolveConnectAccountId.mockReturnValue(null);
    stripeService.connectRequestOptions.mockReturnValue(undefined);
    await service.refundBookingPayment(
      business,
      makeBooking({ metadata: { stripePaymentIntentId: 'pi_1' } }),
    );
    expect(stripeService.client.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1' },
      { idempotencyKey: 'booking-refund-pi-pi_1' },
    );
  });

  it('uses payment-intent idempotency so multi-service sibling cancels share one refund (e2e-bug.35)', async () => {
    await service.refundBookingPayment(
      business,
      makeBooking({ id: 'book-line-a', metadata: { stripePaymentIntentId: 'pi_ms' } }),
    );
    await service.refundBookingPayment(
      business,
      makeBooking({ id: 'book-line-b', metadata: { stripePaymentIntentId: 'pi_ms' } }),
    );
    expect(stripeService.client.refunds.create).toHaveBeenNthCalledWith(
      1,
      { payment_intent: 'pi_ms' },
      expect.objectContaining({ idempotencyKey: 'booking-refund-pi-pi_ms' }),
    );
    expect(stripeService.client.refunds.create).toHaveBeenNthCalledWith(
      2,
      { payment_intent: 'pi_ms' },
      expect.objectContaining({ idempotencyKey: 'booking-refund-pi-pi_ms' }),
    );
  });

  it('returns failed when the refund API call throws', async () => {
    stripeService.client.refunds.create.mockRejectedValue(
      new Error('stripe down'),
    );
    const result = await service.refundBookingPayment(
      business,
      makeBooking(),
    );
    expect(result).toBe('failed');
    expect(bookingRepo.save).not.toHaveBeenCalled();
  });

  it('returns failed for non-Error rejections', async () => {
    stripeService.client.refunds.create.mockRejectedValue({
      code: 'card_error',
    });
    const result = await service.refundBookingPayment(
      business,
      makeBooking(),
    );
    expect(result).toBe('failed');
  });
});
