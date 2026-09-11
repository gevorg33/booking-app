import { Injectable, Logger } from '@nestjs/common';
import { SchedulerLockService } from '../../common/scheduler-lock/scheduler-lock.service.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import { PushService } from './push.service.js';
import { ProviderMobileService } from './provider-mobile.service.js';
import {
  aggregateEodSummaries,
  buildEodPushPayload,
  type EodBookingRow,
} from './provider-end-of-day-summary.util.js';

@Injectable()
export class ProviderEndOfDayPushScheduler {
  private readonly logger = new Logger(ProviderEndOfDayPushScheduler.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(SchedulingPeriod)
    private periodRepo: Repository<SchedulingPeriod>,
    private pushService: PushService,
    private providerMobileService: ProviderMobileService,

    private readonly schedulerLock: SchedulerLockService,
  ) {}

  /** Runs hourly; sends end-of-day summary at 20:00 UTC for providers with bookings today. */
  @Cron(CronExpression.EVERY_HOUR)
  async sendEndOfDaySummariesScheduled(): Promise<void> {
    // e2e-bug.497 — the cron entry point; `sendEndOfDaySummaries` stays callable directly
    // (and is what the specs drive) so the lock wraps scheduling, not the work.
    await this.schedulerLock.runExclusively(
      'provider-end-of-day-push.sendEndOfDaySummaries',
      () => this.sendEndOfDaySummaries(),
    );
  }

  async sendEndOfDaySummaries(): Promise<void> {
    if (!this.pushService.isConfigured) return;

    const now = new Date();
    if (now.getUTCHours() !== 20) return;

    const dayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);

    const tomorrowStart = new Date(dayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart.getTime() + 86400000 - 1);

    const bookings = await this.bookingRepo.find({
      where: {
        startTime: Between(dayStart, dayEnd),
        status: Not(In([BookingStatus.CANCELLED])) as any,
      },
      relations: { employee: true },
    });

    const employeeIds = [
      ...new Set(bookings.map((b) => b.employeeId).filter(Boolean)),
    ];
    const gapsTomorrowByEmployee = new Map<string, number>();

    if (employeeIds.length > 0) {
      const tomorrowPeriods = await this.periodRepo.find({
        where: {
          employeeId: In(employeeIds),
          startTime: Between(tomorrowStart, tomorrowEnd),
        },
      });

      for (const employeeId of employeeIds) {
        const periods = tomorrowPeriods.filter(
          (p) => p.employeeId === employeeId,
        );
        const gaps = findScheduleGapsInWindow(
          tomorrowStart,
          '09:00',
          '19:00',
          periods,
        );
        if (gaps.length > 0)
          gapsTomorrowByEmployee.set(employeeId, gaps.length);
      }
    }

    const rows: EodBookingRow[] = bookings.map((b) => ({
      businessId: b.businessId,
      employeeId: b.employeeId,
      status: b.status,
      paymentStatus: b.paymentStatus,
    }));

    const summaries = aggregateEodSummaries(rows, gapsTomorrowByEmployee);

    for (const summary of summaries) {
      if (summary.appointmentCount === 0) continue;
      const userId = await this.providerMobileService.findEmployeeUserId(
        summary.employeeId,
      );
      if (!userId) continue;

      const payload = buildEodPushPayload(summary);
      const sent = await this.pushService.sendToUser(
        userId,
        summary.businessId,
        {
          title: payload.title,
          body: payload.body,
          url: payload.url,
          pushType: payload.pushType,
          aiPrompt: payload.aiPrompt,
        },
      );
      if (sent > 0) {
        this.logger.log(
          `EOD push sent to employee ${summary.employeeId} (${payload.body})`,
        );
      }
    }
  }
}
