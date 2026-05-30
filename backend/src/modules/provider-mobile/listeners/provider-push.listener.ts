import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventType } from '../../../events/event-types.js';
import type { OperationalEvent } from '../../../events/store/event-store.entity.js';
import { PushService } from '../push.service.js';
import { ProviderMobileService } from '../provider-mobile.service.js';
import { ProviderPushActionService } from '../provider-push-action.service.js';
import { Booking } from '../../booking/entities/booking.entity.js';

@Injectable()
export class ProviderPushListener {
  private readonly logger = new Logger(ProviderPushListener.name);

  constructor(
    private pushService: PushService,
    private providerMobileService: ProviderMobileService,
    private pushActionService: ProviderPushActionService,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  @OnEvent(EventType.BOOKING_CREATED, { async: true })
  async handleNewBooking(event: OperationalEvent): Promise<void> {
    await this.notifyForBooking(event, 'created', 'New appointment', (ctx) =>
      `${ctx.customerName} — ${ctx.serviceName} at ${ctx.when}`,
    );
  }

  @OnEvent(EventType.BOOKING_CANCELLED, { async: true })
  async handleCancelledBooking(event: OperationalEvent): Promise<void> {
    await this.notifyForBooking(event, 'cancelled', 'Appointment cancelled', (ctx) =>
      `${ctx.customerName} — ${ctx.serviceName} at ${ctx.when}`,
    );
  }

  @OnEvent(EventType.BOOKING_RESCHEDULED, { async: true })
  async handleRescheduledBooking(event: OperationalEvent): Promise<void> {
    await this.notifyForBooking(event, 'rescheduled', 'Appointment rescheduled', (ctx) =>
      `${ctx.customerName} — ${ctx.serviceName} now at ${ctx.when}`,
    );
  }

  private async notifyForBooking(
    event: OperationalEvent,
    kind: 'created' | 'cancelled' | 'rescheduled',
    title: string,
    bodyFn: (ctx: {
      customerName: string;
      serviceName: string;
      providerName: string;
      when: string;
    }) => string,
  ): Promise<void> {
    if (!this.pushService.isConfigured || !event.businessId) return;

    try {
      const booking = await this.bookingRepo.findOne({
        where: { id: event.aggregateId },
        relations: { employee: true, service: true, customer: true },
      });

      const employeeId =
        booking?.employeeId ||
        (typeof event.payload?.employeeId === 'string' ? event.payload.employeeId : undefined);
      if (!employeeId) return;

      const startTime =
        booking?.startTime ??
        (event.payload?.startTime ? new Date(String(event.payload.startTime)) : new Date());
      const when = startTime.toISOString().slice(0, 16).replace('T', ' ');
      const customerName = booking?.customer?.name ?? 'A customer';
      const serviceName = booking?.service?.name ?? 'Appointment';
      const providerName = booking?.employee?.name ?? 'Provider';
      const body = bodyFn({ customerName, serviceName, providerName, when });
      const url = `/provider/today?bookingId=${event.aggregateId}`;

      const notified = new Set<string>();

      const providerUserId = await this.providerMobileService.findEmployeeUserId(employeeId);
      if (providerUserId) {
        const sent =
          kind === 'created'
            ? await this.pushActionService.notifyBookingActions(
                providerUserId,
                event.businessId,
                event.aggregateId,
                title,
                body,
              )
            : await this.pushService.sendToUser(providerUserId, event.businessId, {
                title,
                body,
                url,
                bookingId: event.aggregateId,
              });
        if (sent > 0) {
          notified.add(providerUserId);
          this.logger.log(`Provider push (${kind}) for booking ${event.aggregateId} (${sent} device(s))`);
        }
      }

      const managerUserIds = await this.providerMobileService.findMobileManagerUserIds(event.businessId);
      for (const managerUserId of managerUserIds) {
        if (notified.has(managerUserId)) continue;
        const managerBody =
          kind === 'created'
            ? `${providerName}: ${body}`
            : `${providerName}: ${customerName} — ${serviceName} at ${when}`;
        const sent = await this.pushService.sendToUser(managerUserId, event.businessId, {
          title: kind === 'created' ? 'New booking' : title,
          body: managerBody,
          url,
          bookingId: event.aggregateId,
        });
        if (sent > 0) notified.add(managerUserId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Provider push (${kind}) for booking ${event.aggregateId} failed: ${message}`);
    }
  }
}
