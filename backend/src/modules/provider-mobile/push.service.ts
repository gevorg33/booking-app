import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { FirebaseAdminService } from '../../common/firebase/firebase-admin.service.js';
import { PushSubscription } from './entities/push-subscription.entity.js';
import { NativePushToken } from './entities/native-push-token.entity.js';
import { SubscribePushDto, RegisterNativePushDto } from './dto/provider-mobile.dto.js';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private vapidConfigured = false;

  constructor(
    @InjectRepository(PushSubscription)
    private subRepo: Repository<PushSubscription>,
    @InjectRepository(NativePushToken)
    private nativeTokenRepo: Repository<NativePushToken>,
    private config: ConfigService,
    private firebase: FirebaseAdminService,
  ) {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT') || 'mailto:support@optischedule.app';
    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
    }
  }

  get isConfigured(): boolean {
    return this.vapidConfigured || this.firebase.isReady;
  }

  getPublicKey(): string | null {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? null;
  }

  async subscribe(userId: string, businessId: string, dto: SubscribePushDto, userAgent?: string) {
    await this.subRepo.delete({ userId, businessId, endpoint: dto.endpoint });
    const saved = await this.subRepo.save(
      this.subRepo.create({
        userId,
        businessId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: userAgent ?? null,
      }),
    );
    return { id: saved.id, subscribed: true };
  }

  async unsubscribe(userId: string, businessId: string, endpoint: string) {
    await this.subRepo.delete({ userId, businessId, endpoint });
    return { unsubscribed: true };
  }

  async registerNativeToken(userId: string, businessId: string, dto: RegisterNativePushDto) {
    await this.nativeTokenRepo.delete({ userId, businessId, platform: dto.platform });
    await this.nativeTokenRepo.save(
      this.nativeTokenRepo.create({
        userId,
        businessId,
        token: dto.token,
        platform: dto.platform,
      }),
    );
    return { registered: true, platform: dto.platform };
  }

  async getNativePushStatus(
    userId: string,
    businessId: string,
    platform?: 'ios' | 'android',
  ): Promise<{ registered: boolean; platform: 'ios' | 'android' | null }> {
    const where = platform
      ? { userId, businessId, platform }
      : { userId, businessId };
    const count = await this.nativeTokenRepo.count({ where });
    return { registered: count > 0, platform: platform ?? null };
  }

  async sendToUser(
    userId: string,
    businessId: string,
    payload: { title: string; body: string; url?: string },
  ): Promise<number> {
    let sent = 0;

    if (this.vapidConfigured) {
      const subs = await this.subRepo.find({ where: { userId, businessId } });
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
          );
          sent += 1;
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await this.subRepo.delete({ id: sub.id });
          } else {
            this.logger.warn(`Web push failed for ${sub.id}: ${err.message}`);
          }
        }
      }
    }

    sent += await this.notifyNativeTokens(userId, businessId, payload);
    return sent;
  }

  private async notifyNativeTokens(
    userId: string,
    businessId: string,
    payload: { title: string; body: string; url?: string },
  ): Promise<number> {
    const tokens = await this.nativeTokenRepo.find({ where: { userId, businessId } });
    if (tokens.length === 0) return 0;

    if (!this.firebase.isReady) {
      this.logger.log(
        `Native push skipped for ${tokens.length} device(s) — set FIREBASE_SERVICE_ACCOUNT_PATH`,
      );
      return 0;
    }

    let sent = 0;
    for (const entry of tokens) {
      try {
        await this.firebase.messaging().send({
          token: entry.token,
          notification: { title: payload.title, body: payload.body },
          data: payload.url ? { url: payload.url } : undefined,
          android: {
            priority: 'high',
            notification: { channelId: 'booking_alerts' },
          },
        });
        sent += 1;
        this.logger.log(`FCM push sent to ${entry.platform} device ${entry.id}`);
      } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          this.logger.warn(`Removing invalid FCM token ${entry.id} for user ${userId}`);
          await this.nativeTokenRepo.delete({ id: entry.id });
        } else {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(`FCM push failed for token ${entry.id}: ${message}`);
        }
      }
    }

    return sent;
  }

  async sendToEmployeeUser(
    employeeUserId: string | null | undefined,
    businessId: string,
    payload: { title: string; body: string; url?: string },
  ): Promise<number> {
    if (!employeeUserId) return 0;
    return this.sendToUser(employeeUserId, businessId, payload);
  }
}
