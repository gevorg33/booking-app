import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Booking, PaymentStatus } from './entities/booking.entity.js';
import { StripeService } from '../billing/stripe.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';

export type BookingRefundStatus =
  | 'refunded'
  | 'already_refunded'
  | 'skipped'
  | 'failed';

@Injectable()
export class BookingRefundService {
  private readonly logger = new Logger(BookingRefundService.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private stripeService: StripeService,
    private stripeIntegrationService: StripeIntegrationService,
  ) {}

  async refundBookingPayment(
    business: Business,
    booking: Booking,
  ): Promise<BookingRefundStatus> {
    const metadata = (booking.metadata ?? {}) as Record<string, any>;
    if (metadata.stripeRefundId) return 'already_refunded';

    const paymentIntentId = metadata.stripePaymentIntentId as
      | string
      | undefined;
    if (!paymentIntentId || !this.stripeService.isConfigured) return 'skipped';

    try {
      const connectAccountId =
        (metadata.stripeConnectAccountId as string | undefined) ??
        this.stripeIntegrationService.resolveConnectAccountId(
          business.settings,
        );
      const connectOpts = connectAccountId
        ? this.stripeService.connectRequestOptions(
            connectAccountId,
            business.settings,
          )
        : undefined;
      // e2e-bug.165 / e2e-bug.35 — concurrent cancel surfaces and multi-service
      // sibling cascade must not create two Stripe refunds for the same PI.
      // Key by payment intent (not booking id) so every line sharing one charge
      // collapses to a single refund.
      const opts = {
        ...(connectOpts ?? {}),
        idempotencyKey: `booking-refund-pi-${paymentIntentId}`,
      };

      const refund = await this.stripeService.client.refunds.create(
        { payment_intent: paymentIntentId },
        opts,
      );

      booking.metadata = { ...metadata, stripeRefundId: refund.id };
      booking.paymentStatus = PaymentStatus.REFUNDED;
      await this.bookingRepo.save(booking);
      return 'refunded';
    } catch (err) {
      this.logger.warn(
        `Booking refund failed for ${booking.id}: ${err instanceof Error ? err.message : err}`,
      );
      return 'failed';
    }
  }
}
