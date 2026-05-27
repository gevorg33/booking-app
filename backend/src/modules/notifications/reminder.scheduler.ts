import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service.js';

@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);

  constructor(private notificationsService: NotificationsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleReminders(): Promise<void> {
    try {
      const sent = await this.notificationsService.processDueReminders();
      if (sent > 0) {
        this.logger.log(`Sent ${sent} appointment reminder(s)`);
      }
    } catch (err) {
      this.logger.error('Reminder job failed', err instanceof Error ? err.stack : err);
    }
  }
}
