import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FirebaseAdminService } from '../../common/firebase/firebase-admin.service.js';
import {
  buildConsumerNativeFcmMessage,
  type ConsumerTransactionalPushPayload,
} from './consumer-transactional-push.util.js';
import { resolveConsumerPushAndroidChannelId } from '../../common/utils/n99-push-channel.util.js';
import {
  classifyFcmDeliveryError,
  shouldInvalidatePushToken,
} from '../../common/utils/n99-push-deliverability.util.js';
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
 * Consumer transactional push dispatch (adopt-4.1.clinic + adopt-4.2 salon + n99-4.8).
 */
@Injectable()
export class ConsumerPushDispatchService {
  private readonly logger = new Logger(ConsumerPushDispatchService.name);

  constructor(
    private consumerPushTokens: ConsumerPushTokenService,
    private firebase: FirebaseAdminService,
  ) {}

  async sendTransactionalPush(
    payload: ConsumerTransactionalPushPayload,
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
    const channelId = resolveConsumerPushAndroidChannelId(payload.pushType);
    let sentCount = 0;

    for (const entry of tokens) {
      const deliveryId = randomUUID();
      try {
        await this.firebase.messaging().send({
          token: entry.token,
          notification: message.notification,
          data: {
            ...message.data,
            deliveryId,
          },
          android: {
            priority: 'high',
            notification: {
              channelId,
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
        });
        sentCount += 1;
        await this.consumerPushTokens.recordFcmAccepted(entry.id, deliveryId);
        this.logger.log(
          `Consumer FCM push sent (${payload.pushType}) to ${entry.platform} device ${entry.id}`,
        );
      } catch (err: unknown) {
        const code = (err as { code?: string }).code ?? 'unknown';
        const classification = classifyFcmDeliveryError(code);
        if (shouldInvalidatePushToken(classification)) {
          this.logger.warn(
            `Removing invalid consumer FCM token ${entry.id} for customer ${payload.customerId} (${classification.code})`,
          );
          await this.consumerPushTokens.deleteTokenById(entry.id);
        } else {
          await this.consumerPushTokens.recordDeliveryFailure(entry.id, classification.code);
          const errMessage = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Consumer FCM push failed for token ${entry.id} (${classification.provider}/${classification.code}): ${errMessage}`,
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

  /** @deprecated Use sendTransactionalPush — kept for clinic call sites. */
  async sendResultReady(
    payload: Extract<ConsumerTransactionalPushPayload, { pushType: 'result_ready' }>,
  ): Promise<ConsumerPushDispatchResult> {
    return this.sendTransactionalPush(payload);
  }

  /** @deprecated Use sendTransactionalPush — kept for clinic call sites. */
  async sendLabBookingRequest(
    payload: Extract<
      ConsumerTransactionalPushPayload,
      { pushType: 'lab_booking_request' }
    >,
  ): Promise<ConsumerPushDispatchResult> {
    return this.sendTransactionalPush(payload);
  }
}
