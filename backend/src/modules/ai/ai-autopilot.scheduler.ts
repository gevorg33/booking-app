import { Injectable, Logger } from '@nestjs/common';
import { SchedulerLockService } from '../../common/scheduler-lock/scheduler-lock.service.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiSettingsService } from './ai-settings.service.js';
import { AiCommandService } from './ai-command.service.js';

/** Simple cron matcher: minute hour dom month dow (UTC) */
function cronMatches(expr: string, date: Date): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [min, hour, dom, month, dow] = parts;
  const checks = [
    [date.getUTCMinutes(), min],
    [date.getUTCHours(), hour],
    [date.getUTCDate(), dom],
    [date.getUTCMonth() + 1, month],
    [date.getUTCDay(), dow],
  ] as const;

  return checks.every(([value, field]) => {
    if (field === '*') return true;
    if (field.includes('-')) {
      const [a, b] = field.split('-').map(Number);
      return value >= a && value <= b;
    }
    if (field.includes(',')) {
      return field.split(',').map(Number).includes(value);
    }
    return Number(field) === value;
  });
}

@Injectable()
export class AiAutopilotScheduler {
  private readonly logger = new Logger(AiAutopilotScheduler.name);

  constructor(
    private aiSettings: AiSettingsService,
    private aiCommand: AiCommandService,

    private readonly schedulerLock: SchedulerLockService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runScheduledRulesScheduled(): Promise<void> {
    // e2e-bug.497 — the cron entry point; `runScheduledRules` stays callable directly
    // (and is what the specs drive) so the lock wraps scheduling, not the work.
    await this.schedulerLock.runExclusively(
      'ai-autopilot.runScheduledRules',
      () => this.runScheduledRules(),
    );
  }

  async runScheduledRules(): Promise<void> {
    const now = new Date();
    const businesses = await this.aiSettings.listAutopilotBusinesses();

    for (const { businessId, settings } of businesses) {
      for (const rule of settings.autopilot.rules) {
        if (!rule.enabled || !rule.cron) continue;
        if (!cronMatches(rule.cron, now)) continue;

        const lastRun = rule.lastRunAt ? new Date(rule.lastRunAt) : null;
        if (lastRun && now.getTime() - lastRun.getTime() < 55 * 60 * 1000) {
          continue;
        }

        try {
          this.logger.log(`Autopilot [${businessId}] rule "${rule.name}"`);
          await this.aiCommand.executeCommand(
            businessId,
            rule.prompt,
            undefined,
            {
              context: { source: 'autopilot', ruleId: rule.id },
            },
          );
          await this.aiSettings.markAutopilotRun(businessId, rule.id);
        } catch (err: any) {
          this.logger.warn(`Autopilot rule failed: ${err.message}`);
        }
      }
    }
  }
}
