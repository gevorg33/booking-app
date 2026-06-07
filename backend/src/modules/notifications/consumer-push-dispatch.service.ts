import { Injectable, Logger } from '@nestjs/common';
import { FirebaseAdminService } from '../../common/firebase/firebase-admin.service.js';
import {
  buildConsumerNativeFcmMessage,
  type ConsumerLabBookingRequestPushPayload,
  type ConsumerResultReadyPushPayload,
} from './consumer-transactional-push.util.js';
import { ConsumerPushTokenService } from './consumer-push-token.service.js';

export const CONSUMER_PUSH_SKIP_REASON = 'consumer_push_tokens_not_available';
export const CONSUMER_PUSH_FIREBASE_SKIP_REASON = 'firebase_not_configured';

export interface ConsumerPushDispatchResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  sentCount?: number;
}

/**
 * Consumer transactional push dispatch (adopt-4.1.clinic).
 * Delivers clinic result-ready + lab-booking-request pushes via FCM when tokens exist.
 */
@Injectable()
export class ConsumerPushDispatchService {
  private readonly logger = new Logger(ConsumerPushDispatchService.name);

  constructor(
    private consumerPushTokens: ConsumerPushTokenService,
    private firebase: FirebaseAdminService,
  ) {}

  async sendResultReady(
    payload: ConsumerResultReadyPushPayload,
  ): Promise<ConsumerPushDispatchResult> {
    return this.dispatchTransactionalPush(payload);
  }

  async sendLabBookingRequest(
    payload: ConsumerLabBookingRequestPushPayload,
  ): Promise<ConsumerPushDispatchResult> {
    return this.dispatchTransactionalPush(payload);
  }

  private async dispatchTransactionalPush(
    payload: ConsumerResultReadyPushPayload | ConsumerLabBookingRequestPushPayload,
  ): Promise<ConsumerPushDispatchResult> {
    const tokens = await this.consumerPushTokens.listTokensForCustomer(
      payload.customerId,
      payload.businessId,
    );
    if (tokens.length === 0) {
      return {
        ok: false,
        skipped: true,
        reason: CONSUMER_PUSH_SKIP_REASON,
      };
    }

    if (!this.firebase.isReady) {
      this.logger.log(
        `Consumer push skipped for ${tokens.length} device(s) — set FIREBASE_SERVICE_ACCOUNT_PATH`,
      );
      return {
        ok: false,
        skipped: true,
        reason: CONSUMER_PUSH_FIREBASE_SKIP_REASON,
      };
    }

    const message = buildConsumerNativeFcmMessage(payload);
    let sentCount = 0;

    for (const entry of tokens) {
      try {
        await this.firebase.messaging().send({
          token: entry.token,
          notification: message.notification,
          data: message.data,
          android: {
            priority: 'high',
            notification: {
              channelId: 'clinic_alerts',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
        });
        sentCount += 1;
        this.logger.log(
          `Consumer FCM push sent (${payload.pushType}) to ${entry.platform} device ${entry.id}`,
        );
      } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          this.logger.warn(
            `Removing invalid consumer FCM token ${entry.id} for customer ${payload.customerId}`,
          );
          await this.consumerPushTokens.deleteTokenById(entry.id);
        } else {
          const errMessage = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Consumer FCM push failed for token ${entry.id}: ${errMessage}`,
          );
        }
      }
    }

    if (sentCount === 0) {
      return {
        ok: false,
        skipped: true,
        reason: CONSUMER_PUSH_SKIP_REASON,
        sentCount: 0,
      };
    }

    return { ok: true, sentCount };
  }
}
