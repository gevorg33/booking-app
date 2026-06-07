import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventType } from '../../../events/event-types.js';
import type { OperationalEvent } from '../../../events/store/event-store.entity.js';
import {
  Booking,
  BookingStatus,
} from '../../booking/entities/booking.entity.js';
import { shouldSkipAutoLabOrderForBookingMetadata } from '../../../common/utils/clinic-lab-booking-request.util.js';
import { ClinicTestOrderBookingRequestService } from '../order/clinic-test-order-booking-request.service.js';
import { ClinicTestOrderService } from '../order/clinic-test-order.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ClinicLabBookingListener {
  private readonly logger = new Logger(ClinicLabBookingListener.name);

  constructor(
    private readonly clinicTestOrderService: ClinicTestOrderService,
    private readonly clinicTestOrderBookingRequestService: ClinicTestOrderBookingRequestService,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  private async handleBookingLabSideEffects(bookingId: string): Promise<void> {
    try {
      await this.clinicTestOrderBookingRequestService.fulfillBookingRequestForBooking(
        bookingId,
      );
    } catch (err) {
      this.logger.warn(
        `Lab booking request fulfillment failed for booking ${bookingId}`,
        err instanceof Error ? err.message : err,
      );
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (
      shouldSkipAutoLabOrderForBookingMetadata(
        booking?.metadata as Record<string, unknown> | undefined,
      )
    ) {
      return;
    }

    try {
      await this.clinicTestOrderService.maybeCreateOrderForBooking(bookingId);
    } catch (err) {
      this.logger.warn(
        `Lab order auto-create failed for booking ${bookingId}`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  private async tryCreateLabOrder(event: OperationalEvent): Promise<void> {
    const status = event.payload?.status as string | undefined;
    if (status && status !== BookingStatus.CONFIRMED) return;
    await this.handleBookingLabSideEffects(event.aggregateId);
  }

  @OnEvent(EventType.BOOKING_CREATED)
  async handleBookingCreated(event: OperationalEvent): Promise<void> {
    await this.handleBookingLabSideEffects(event.aggregateId);
  }

  @OnEvent(EventType.BOOKING_UPDATED)
  async handleBookingUpdated(event: OperationalEvent): Promise<void> {
    if (event.payload?.status !== BookingStatus.CONFIRMED) return;
    await this.tryCreateLabOrder(event);
  }
}
