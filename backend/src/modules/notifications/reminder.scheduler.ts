import { Injectable, Logger } from '@nestjs/common';
import { SchedulerLockService } from '../../common/scheduler-lock/scheduler-lock.service.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service.js';

@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);

  constructor(
    private notificationsService: NotificationsService,
    private readonly schedulerLock: SchedulerLockService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleRemindersScheduled(): Promise<void> {
    // e2e-bug.497 — the cron entry point; `handleReminders` stays callable directly
    // (and is what the specs drive) so the lock wraps scheduling, not the work.
    await this.schedulerLock.runExclusively('reminder.handleReminders', () =>
      this.handleReminders(),
    );
  }

  async handleReminders(): Promise<void> {
    try {
      const sent = await this.notificationsService.processDueReminders();
      if (sent > 0) {
        this.logger.log(`Sent ${sent} appointment reminder(s)`);
      }
    } catch (err) {
      this.logger.error(
        'Reminder job failed',
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
