import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventStoreService } from '../../../events/store/event-store.service.js';
import { EventType } from '../../../events/event-types.js';
import { OperationalEvent } from '../../../events/store/event-store.entity.js';

/** Propagate availability calendar refresh after reschedule or cancel. */
@Injectable()
export class BookingLifecycleListener {
  private readonly logger = new Logger(BookingLifecycleListener.name);

  constructor(private eventStore: EventStoreService) {}

  @OnEvent(EventType.BOOKING_RESCHEDULED)
  async onRescheduled(event: OperationalEvent): Promise<void> {
    await this.emitAvailabilityUpdated(event, 'appointment_rescheduled');
  }

  @OnEvent(EventType.BOOKING_CANCELLED)
  async onCancelled(event: OperationalEvent): Promise<void> {
    await this.emitAvailabilityUpdated(event, 'appointment_cancelled');
  }

  private async emitAvailabilityUpdated(
    event: OperationalEvent,
    reason: string,
  ): Promise<void> {
    this.logger.log(
      `Booking ${event.aggregateId} — ${reason}, refreshing availability`,
    );

    await this.eventStore.publish({
      eventType: EventType.AVAILABILITY_UPDATED,
      aggregateType: 'availability',
      aggregateId: event.businessId || event.aggregateId,
      businessId: event.businessId,
      payload: {
        reason,
        bookingId: event.aggregateId,
        employeeId: event.payload?.employeeId,
        startTime: event.payload?.startTime ?? event.payload?.newStartTime,
        endTime: event.payload?.endTime,
      },
      correlationId: event.correlationId,
      causationId: event.id,
    });
  }
}
