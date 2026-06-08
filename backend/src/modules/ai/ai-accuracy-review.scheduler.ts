import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiAccuracyReviewService } from './ai-accuracy-review.service.js';
import { AiEvalHarvestService } from './ai-eval-harvest.service.js';
import { AiAliasSuggestionService } from './ai-alias-suggestion.service.js';

/** acc-6.1 — weekly accuracy review + acc-6.7 escalation triage queue seed + acc-6.3 alias harvest. */
@Injectable()
export class AiAccuracyReviewScheduler {
  private readonly logger = new Logger(AiAccuracyReviewScheduler.name);

  constructor(
    private readonly reviewService: AiAccuracyReviewService,
    private readonly harvestService: AiEvalHarvestService,
    private readonly aliasSuggestionService: AiAliasSuggestionService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async runWeeklyAccuracyReview(): Promise<void> {
    try {
      const published = await this.reviewService.publishWeeklyReviewsForAllBusinesses();
      const harvested = await this.harvestService.harvestAllBusinesses(7);
      const aliasSuggestions = await this.aliasSuggestionService.harvestAllBusinesses(30);
      this.logger.log(
        `Weekly accuracy program complete (${published} review(s), ${harvested} harvested prompt(s), ${aliasSuggestions} alias suggestion(s))`,
      );
    } catch (error) {
      this.logger.error(
        'Weekly accuracy review failed',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
