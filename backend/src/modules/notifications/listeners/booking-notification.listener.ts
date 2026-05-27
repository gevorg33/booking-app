import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventType } from '../../../events/event-types.js';
import { OperationalEvent } from '../../../events/store/event-store.entity.js';
import { NotificationsService } from '../notifications.service.js';

@Injectable()
export class BookingNotificationListener {
  private readonly logger = new Logger(BookingNotificationListener.name);

  constructor(private notificationsService: NotificationsService) {}

  @OnEvent(EventType.BOOKING_CREATED)
  async handleBookingCreated(event: OperationalEvent): Promise<void> {
    try {
      await this.notificationsService.sendBookingConfirmation(event.aggregateId);
    } catch (err) {
      this.logger.warn(
        `Confirmation notification failed for booking ${event.aggregateId}`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}
