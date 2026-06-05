import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventStoreService } from '../../../events/store/event-store.service.js';
import { EventType } from '../../../events/event-types.js';
import { OperationalEvent } from '../../../events/store/event-store.entity.js';

/**
 * Mirrors clinic-app's publishAppointmentsCreated pattern:
 * when a booking is created, emit appointment.created so availability,
 * calendars, and operational state can react immediately.
 */
@Injectable()
export class BookingCreatedListener {
  private readonly logger = new Logger(BookingCreatedListener.name);

  constructor(private eventStore: EventStoreService) {}

  @OnEvent(EventType.BOOKING_CREATED)
  async handleBookingCreated(event: OperationalEvent): Promise<void> {
    this.logger.log(
      `Booking created ${event.aggregateId} — propagating appointment.created`,
    );

    await this.eventStore.publish({
      eventType: EventType.APPOINTMENT_CREATED,
      aggregateType: 'booking',
      aggregateId: event.aggregateId,
      businessId: event.businessId,
      payload: {
        bookingId: event.aggregateId,
        employeeId: event.payload?.employeeId,
        serviceId: event.payload?.serviceId,
        startTime: event.payload?.startTime,
        endTime: event.payload?.endTime,
        lockedSlotsCount: event.payload?.lockedSlotsCount,
        sourceEventId: event.id,
      },
      correlationId: event.correlationId,
      causationId: event.id,
      userId: event.userId,
    });

    await this.eventStore.publish({
      eventType: EventType.AVAILABILITY_UPDATED,
      aggregateType: 'availability',
      aggregateId: event.businessId || event.aggregateId,
      businessId: event.businessId,
      payload: {
        reason: 'appointment_created',
        employeeId: event.payload?.employeeId,
        startTime: event.payload?.startTime,
        endTime: event.payload?.endTime,
      },
      correlationId: event.correlationId,
      causationId: event.id,
    });
  }
}
