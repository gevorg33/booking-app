import { Injectable, Logger } from '@nestjs/common';
import { SchedulerLockService } from '../../common/scheduler-lock/scheduler-lock.service.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConsumerPushTokenService } from './consumer-push-token.service.js';

/** n99-4.8 — detect FCM accepts without client delivery acks. */
@Injectable()
export class ConsumerPushDeliverabilityScheduler {
  private readonly logger = new Logger(
    ConsumerPushDeliverabilityScheduler.name,
  );

  constructor(
    private consumerPushTokens: ConsumerPushTokenService,
    private readonly schedulerLock: SchedulerLockService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scanSilentDeliveryFailuresScheduled(): Promise<void> {
    // e2e-bug.497 — the cron entry point; `scanSilentDeliveryFailures` stays callable directly
    // (and is what the specs drive) so the lock wraps scheduling, not the work.
    await this.schedulerLock.runExclusively(
      'consumer-push-deliverability.scanSilentDeliveryFailures',
      () => this.scanSilentDeliveryFailures(),
    );
  }

  async scanSilentDeliveryFailures(): Promise<void> {
    const count = await this.consumerPushTokens.scanSilentDeliveryFailures();
    if (count > 0) {
      this.logger.warn(
        `Recorded ${count} consumer push silent delivery failure(s)`,
      );
    }
  }
}
