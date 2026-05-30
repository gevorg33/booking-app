import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { PushService } from './push.service.js';
import { ProviderMobileService } from './provider-mobile.service.js';

@Injectable()
export class ProviderEndOfDayPushScheduler {
  private readonly logger = new Logger(ProviderEndOfDayPushScheduler.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private pushService: PushService,
    private providerMobileService: ProviderMobileService,
  ) {}

  /** Runs hourly; sends end-of-day summary at 20:00 UTC for providers with bookings today. */
  @Cron(CronExpression.EVERY_HOUR)
  async sendEndOfDaySummaries(): Promise<void> {
    if (!this.pushService.isConfigured) return;

    const now = new Date();
    if (now.getUTCHours() !== 20) return;

    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);

    const bookings = await this.bookingRepo.find({
      where: {
        startTime: Between(dayStart, dayEnd) as any,
        status: Not(In([BookingStatus.CANCELLED])) as any,
      },
      relations: { employee: true },
    });

    const byBusinessEmployee = new Map<string, number>();
    for (const b of bookings) {
      const key = `${b.businessId}:${b.employeeId}`;
      byBusinessEmployee.set(key, (byBusinessEmployee.get(key) || 0) + 1);
    }

    for (const [key, count] of byBusinessEmployee) {
      const [businessId, employeeId] = key.split(':');
      const userId = await this.providerMobileService.findEmployeeUserId(employeeId);
      if (!userId) continue;

      const sent = await this.pushService.sendToUser(userId, businessId, {
        title: 'Today\'s summary',
        body: `You had ${count} appointment${count === 1 ? '' : 's'} today. Tap to review.`,
        url: '/provider/today',
      });
      if (sent > 0) {
        this.logger.log(`EOD push sent to employee ${employeeId} (${count} bookings)`);
      }
    }
  }
}
