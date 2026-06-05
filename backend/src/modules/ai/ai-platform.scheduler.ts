import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiPlatformService } from './ai-platform.service.js';

/** ai-e7 — periodic scan for stuck human-in-the-loop tasks. */
@Injectable()
export class AiPlatformScheduler {
  private readonly logger = new Logger(AiPlatformScheduler.name);

  constructor(
    private platform: AiPlatformService,
    private aiSettings: AiSettingsService,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async escalateStuckHitlTasks(): Promise<void> {
    const businesses = await this.businessRepo.find({
      where: { isActive: true },
      select: { id: true },
      take: 200,
    });

    for (const { id: businessId } of businesses) {
      try {
        const settings = await this.aiSettings.getSettings(businessId);
        const stuck = await this.platform.scanStuckTasks(businessId, settings);
        for (const item of stuck) {
          await this.platform.escalateStuckTask(
            businessId,
            item.taskId,
            item.intent,
            item.stuckMinutes,
          );
          this.logger.log(
            `HITL escalation [${businessId}] task=${item.taskId} intent=${item.intent} stuck=${item.stuckMinutes}m`,
          );
        }
      } catch (err) {
        this.logger.warn(
          `HITL scan failed for ${businessId}: ${(err as Error).message}`,
        );
      }
    }
  }
}
