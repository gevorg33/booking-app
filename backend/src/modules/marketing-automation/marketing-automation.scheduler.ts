import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MarketingAutomationService } from './marketing-automation.service.js';

@Injectable()
export class MarketingAutomationScheduler {
  private readonly logger = new Logger(MarketingAutomationScheduler.name);

  constructor(private marketingAutomationService: MarketingAutomationService) {}

  /** Daily at 10:00 UTC — re-engage inactive customers who opted in. */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handleReEngagement(): Promise<void> {
    try {
      const sent = await this.marketingAutomationService.processAllBusinesses();
      if (sent > 0) {
        this.logger.log(`Sent ${sent} re-engagement message(s)`);
      }
    } catch (err) {
      this.logger.error(
        'Marketing automation job failed',
        err instanceof Error ? err.stack : err,
      );
    }
  }

  /** Daily at 10:30 UTC — cadence-based rebooking nudges (adopt-4.4). */
  @Cron('30 10 * * *')
  async handleRebookingNudges(): Promise<void> {
    try {
      const sent =
        await this.marketingAutomationService.processAllRebookingNudges();
      if (sent > 0) {
        this.logger.log(`Sent ${sent} rebooking nudge(s)`);
      }
    } catch (err) {
      this.logger.error(
        'Rebooking nudge job failed',
        err instanceof Error ? err.stack : err,
      );
    }
  }

  /** Hourly — activation concierge nudges at 24h / 72h (n99-3.5). */
  @Cron(CronExpression.EVERY_HOUR)
  async handleActivationConcierge(): Promise<void> {
    try {
      const sent =
        await this.marketingAutomationService.processAllActivationConciergeNudges();
      if (sent > 0) {
        this.logger.log(`Sent ${sent} activation concierge nudge(s)`);
      }
    } catch (err) {
      this.logger.error(
        'Activation concierge job failed',
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
