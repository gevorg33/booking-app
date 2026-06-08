import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumerNativePushToken } from './entities/consumer-native-push-token.entity.js';
import type { RegisterConsumerNativePushDto } from './dto/register-consumer-native-push.dto.js';
import type { PushDeliverabilityTokenAggregate } from '../../common/utils/n99-push-reachability.util.js';
import {
  resolveSilentFailureCandidates,
  shouldRefreshConsumerPushToken,
} from '../../common/utils/n99-push-deliverability.util.js';

@Injectable()
export class ConsumerPushTokenService {
  constructor(
    @InjectRepository(ConsumerNativePushToken)
    private tokenRepo: Repository<ConsumerNativePushToken>,
  ) {}

  async registerToken(
    customerId: string,
    businessId: string,
    dto: RegisterConsumerNativePushDto,
  ): Promise<{ registered: true; platform: 'ios' | 'android'; refreshed: boolean }> {
    const existing = await this.tokenRepo.findOne({
      where: { customerId, businessId, platform: dto.platform },
    });
    const refreshed = shouldRefreshConsumerPushToken(existing?.token, dto.token);

    await this.tokenRepo.delete({
      customerId,
      businessId,
      platform: dto.platform,
    });
    await this.tokenRepo.save(
      this.tokenRepo.create({
        customerId,
        businessId,
        token: dto.token,
        platform: dto.platform,
        permissionState: dto.permissionState ?? 'full',
        analyticsAnonId: dto.analyticsAnonId?.trim() || null,
        tokenRefreshedAt: refreshed ? new Date() : null,
      }),
    );
    return { registered: true, platform: dto.platform, refreshed };
  }

  async getNativePushStatus(
    customerId: string,
    businessId: string,
    platform?: 'ios' | 'android',
  ): Promise<{ registered: boolean; platform: 'ios' | 'android' | null }> {
    const where = platform
      ? { customerId, businessId, platform }
      : { customerId, businessId };
    const count = await this.tokenRepo.count({ where });
    return { registered: count > 0, platform: platform ?? null };
  }

  async listTokensForCustomer(
    customerId: string,
    businessId: string,
  ): Promise<ConsumerNativePushToken[]> {
    return this.tokenRepo.find({ where: { customerId, businessId } });
  }

  async deleteTokenById(id: string): Promise<void> {
    await this.tokenRepo.delete({ id });
  }

  async recordFcmAccepted(tokenId: string, deliveryId: string): Promise<void> {
    const token = await this.tokenRepo.findOne({ where: { id: tokenId } });
    if (!token) return;
    token.deliverySuccessCount += 1;
    token.lastDeliveredAt = new Date();
    token.lastFcmAcceptedAt = new Date();
    token.lastFcmMessageId = deliveryId.slice(0, 128);
    token.lastDeliveryError = null;
    await this.tokenRepo.save(token);
  }

  async recordDeliverySuccess(tokenId: string): Promise<void> {
    await this.recordFcmAccepted(tokenId, `legacy-${tokenId}`);
  }

  async recordDeliveryFailure(tokenId: string, errorCode: string): Promise<void> {
    const token = await this.tokenRepo.findOne({ where: { id: tokenId } });
    if (!token) return;
    token.deliveryFailureCount += 1;
    token.lastDeliveryError = errorCode.slice(0, 255);
    await this.tokenRepo.save(token);
  }

  async recordDeliveryAck(
    customerId: string,
    businessId: string,
    platform: 'ios' | 'android',
    deliveryId: string,
  ): Promise<{ acked: boolean }> {
    const token = await this.tokenRepo.findOne({
      where: { customerId, businessId, platform },
    });
    if (!token || token.lastFcmMessageId !== deliveryId) {
      return { acked: false };
    }
    token.lastDeliveryAckAt = new Date();
    await this.tokenRepo.save(token);
    return { acked: true };
  }

  async recordSilentFailure(tokenId: string): Promise<void> {
    const token = await this.tokenRepo.findOne({ where: { id: tokenId } });
    if (!token) return;
    token.silentFailureCount += 1;
    token.lastSilentFailureAt = new Date();
    token.lastDeliveryError = 'silent_failure';
    await this.tokenRepo.save(token);
  }

  async scanSilentDeliveryFailures(): Promise<number> {
    const tokens = await this.tokenRepo.find({
      where: {},
      select: {
        id: true,
        lastFcmAcceptedAt: true,
        lastDeliveryAckAt: true,
        lastSilentFailureAt: true,
      },
    });
    const candidateIds = resolveSilentFailureCandidates(tokens);
    for (const id of candidateIds) {
      await this.recordSilentFailure(id);
    }
    return candidateIds.length;
  }

  async getDeliverabilityAggregate(businessId: string): Promise<PushDeliverabilityTokenAggregate> {
    const raw = await this.tokenRepo
      .createQueryBuilder('token')
      .select('COALESCE(SUM(token.delivery_success_count), 0)', 'deliverySuccessCount')
      .addSelect('COALESCE(SUM(token.delivery_failure_count), 0)', 'deliveryFailureCount')
      .addSelect('COALESCE(SUM(token.silent_failure_count), 0)', 'silentFailureCount')
      .where('token.business_id = :businessId', { businessId })
      .getRawOne<{
        deliverySuccessCount: string;
        deliveryFailureCount: string;
        silentFailureCount: string;
      }>();

    return {
      deliverySuccessCount: Number(raw?.deliverySuccessCount ?? 0),
      deliveryFailureCount: Number(raw?.deliveryFailureCount ?? 0),
      silentFailureCount: Number(raw?.silentFailureCount ?? 0),
    };
  }
}
