import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventType } from '../../../events/event-types.js';
import type { OperationalEvent } from '../../../events/store/event-store.entity.js';
import { PushService } from '../push.service.js';
import { ProviderMobileService } from '../provider-mobile.service.js';
import { Booking } from '../../booking/entities/booking.entity.js';

@Injectable()
export class ProviderPushListener {
  private readonly logger = new Logger(ProviderPushListener.name);

  constructor(
    private pushService: PushService,
    private providerMobileService: ProviderMobileService,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  @OnEvent(EventType.BOOKING_CREATED, { async: true })
  async handleNewBooking(event: OperationalEvent): Promise<void> {
    if (!this.pushService.isConfigured || !event.businessId) return;

    try {
      const employeeId =
        typeof event.payload?.employeeId === 'string' ? event.payload.employeeId : undefined;

      const booking = await this.bookingRepo.findOne({
        where: { id: event.aggregateId },
        relations: { employee: true, service: true, customer: true },
      });
      if (!booking?.employeeId && !employeeId) return;

      const resolvedEmployeeId = booking?.employeeId ?? employeeId!;
      const startTime =
        booking?.startTime ??
        (event.payload?.startTime ? new Date(String(event.payload.startTime)) : new Date());
      const when = startTime.toISOString().slice(0, 16).replace('T', ' ');
      const customerName = booking?.customer?.name ?? 'A customer';
      const serviceName = booking?.service?.name ?? 'Appointment';
      const providerName = booking?.employee?.name ?? 'Provider';

      const notified = new Set<string>();

      const providerUserId = await this.providerMobileService.findEmployeeUserId(resolvedEmployeeId);
      if (providerUserId) {
        const sent = await this.pushService.sendToUser(providerUserId, event.businessId, {
          title: 'New appointment',
          body: `${customerName} — ${serviceName} at ${when}`,
          url: '/provider/today',
        });
        if (sent > 0) {
          notified.add(providerUserId);
          this.logger.log(`Provider push sent for booking ${event.aggregateId} (${sent} device(s))`);
        }
      } else {
        this.logger.warn(
          `No linked user for employee ${resolvedEmployeeId} — skipping provider push for booking ${event.aggregateId}`,
        );
      }

      const managerUserIds = await this.providerMobileService.findMobileManagerUserIds(event.businessId);
      for (const managerUserId of managerUserIds) {
        if (notified.has(managerUserId)) continue;

        const sent = await this.pushService.sendToUser(managerUserId, event.businessId, {
          title: 'New booking',
          body: `${providerName}: ${customerName} — ${serviceName} at ${when}`,
          url: '/provider/today',
        });
        if (sent > 0) {
          notified.add(managerUserId);
          this.logger.log(
            `Manager push sent for booking ${event.aggregateId} to user ${managerUserId} (${sent} device(s))`,
          );
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Provider push for booking ${event.aggregateId} failed: ${message}`);
    }
  }
}
