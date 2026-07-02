import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConsumerPushTokenService } from './consumer-push-token.service.js';

/** n99-4.8 — detect FCM accepts without client delivery acks. */
@Injectable()
export class ConsumerPushDeliverabilityScheduler {
  private readonly logger = new Logger(
    ConsumerPushDeliverabilityScheduler.name,
  );

  constructor(private consumerPushTokens: ConsumerPushTokenService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scanSilentDeliveryFailures(): Promise<void> {
    const count = await this.consumerPushTokens.scanSilentDeliveryFailures();
    if (count > 0) {
      this.logger.warn(
        `Recorded ${count} consumer push silent delivery failure(s)`,
      );
    }
  }
}
