import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { EventType } from '../../../events/event-types.js';
import { OperationalEvent } from '../../../events/store/event-store.entity.js';
import { Booking } from '../../booking/entities/booking.entity.js';
import { NotificationsService } from '../notifications.service.js';

@Injectable()
export class BookingNotificationListener {
  private readonly logger = new Logger(BookingNotificationListener.name);

  constructor(
    private notificationsService: NotificationsService,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  @OnEvent(EventType.BOOKING_CREATED)
  async handleBookingCreated(event: OperationalEvent): Promise<void> {
    try {
      const booking = await this.bookingRepo.findOne({
        where: { id: event.aggregateId },
        select: {
          id: true,
          packagePurchaseId: true,
          multiServiceGroupId: true,
        },
      });
      if (booking?.packagePurchaseId || booking?.multiServiceGroupId) {
        return;
      }
      await this.notificationsService.sendBookingConfirmation(
        event.aggregateId,
      );
    } catch (err) {
      this.logger.warn(
        `Confirmation notification failed for booking ${event.aggregateId}`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  @OnEvent(EventType.BOOKING_RESCHEDULED)
  async handleBookingRescheduled(event: OperationalEvent): Promise<void> {
    try {
      const booking = await this.bookingRepo.findOne({
        where: { id: event.aggregateId },
        select: {
          id: true,
          packagePurchaseId: true,
          multiServiceGroupId: true,
        },
      });
      if (booking?.packagePurchaseId || booking?.multiServiceGroupId) {
        return;
      }
      await this.notificationsService.sendBookingRescheduleToCustomer(
        event.aggregateId,
        {
          previousStartTime:
            typeof event.payload?.oldStartTime === 'string'
              ? event.payload.oldStartTime
              : undefined,
          newStartTime:
            typeof event.payload?.newStartTime === 'string'
              ? event.payload.newStartTime
              : undefined,
        },
      );
    } catch (err) {
      this.logger.warn(
        `Reschedule push failed for booking ${event.aggregateId}`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}
