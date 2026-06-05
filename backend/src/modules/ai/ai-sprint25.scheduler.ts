import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiSprint25Service } from './ai-sprint25.service.js';

/** ai-e7 — periodic scan for stuck human-in-the-loop tasks. */
@Injectable()
export class AiSprint25Scheduler {
  private readonly logger = new Logger(AiSprint25Scheduler.name);

  constructor(
    private sprint25: AiSprint25Service,
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
        const stuck = await this.sprint25.scanStuckTasks(businessId, settings);
        for (const item of stuck) {
          await this.sprint25.escalateStuckTask(
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
        this.logger.warn(`HITL scan failed for ${businessId}: ${(err as Error).message}`);
      }
    }
  }
}
