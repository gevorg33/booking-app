import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiEvalHarvestService } from './ai-eval-harvest.service.js';

/** acc-2.1 — weekly production prompt harvest into eval labeling queue. */
@Injectable()
export class AiEvalHarvestScheduler {
  private readonly logger = new Logger(AiEvalHarvestScheduler.name);

  constructor(private readonly harvestService: AiEvalHarvestService) {}

  @Cron(CronExpression.EVERY_WEEK)
  async harvestProductionPrompts(): Promise<void> {
    try {
      const inserted = await this.harvestService.harvestAllBusinesses(7);
      this.logger.log(`Weekly eval harvest complete (${inserted} new item(s))`);
    } catch (error) {
      this.logger.error(
        'Weekly eval harvest failed',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
