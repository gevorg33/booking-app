import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumerNativePushToken } from './entities/consumer-native-push-token.entity.js';
import type { RegisterConsumerNativePushDto } from './dto/register-consumer-native-push.dto.js';

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
  ): Promise<{ registered: true; platform: 'ios' | 'android' }> {
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
      }),
    );
    return { registered: true, platform: dto.platform };
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
}
