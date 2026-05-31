import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { WebhookSubscription } from './entities/webhook-subscription.entity.js';
import { WebhookDelivery } from './entities/webhook-delivery.entity.js';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/integrations.dto.js';
import { encryptSecret, decryptSecret } from '../../common/utils/secret.util.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import type { BusinessMember } from '../business/entities/business-member.entity.js';
import { EventType } from '../../events/event-types.js';

export const WEBHOOK_EVENT_OPTIONS = [
  EventType.BOOKING_CREATED,
  EventType.BOOKING_CANCELLED,
  EventType.BOOKING_COMPLETED,
  EventType.BOOKING_RESCHEDULED,
  EventType.PAYMENT_RECEIVED,
  EventType.REVIEW_RECEIVED,
] as const;

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(WebhookSubscription)
    private subRepo: Repository<WebhookSubscription>,
    @InjectRepository(WebhookDelivery)
    private deliveryRepo: Repository<WebhookDelivery>,
    private config: ConfigService,
  ) {}

  assertAdminRole(membership: BusinessMember): void {
    if (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only owners and admins can manage webhooks');
    }
  }

  getEventOptions() {
    return { events: WEBHOOK_EVENT_OPTIONS };
  }

  async listSubscriptions(businessId: string) {
    const subs = await this.subRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
    return subs.map((s) => ({
      id: s.id,
      url: s.url,
      events: s.events,
      isActive: s.isActive,
      description: s.description,
      createdAt: s.createdAt,
    }));
  }

  async createSubscription(businessId: string, dto: CreateWebhookDto) {
    this.validateEvents(dto.events);
    const secret = randomBytes(32).toString('hex');
    const saved = await this.subRepo.save(
      this.subRepo.create({
        businessId,
        url: dto.url.trim(),
        events: dto.events,
        description: dto.description?.trim() || null,
        secretEnc: encryptSecret(secret, this.encryptionSecret()),
      }),
    );
    return {
      id: saved.id,
      url: saved.url,
      events: saved.events,
      isActive: saved.isActive,
      description: saved.description,
      secret,
      createdAt: saved.createdAt,
    };
  }

  async updateSubscription(businessId: string, id: string, dto: UpdateWebhookDto) {
    const sub = await this.findSubscription(businessId, id);
    if (dto.events) this.validateEvents(dto.events);
    if (dto.url !== undefined) sub.url = dto.url.trim();
    if (dto.events !== undefined) sub.events = dto.events;
    if (dto.isActive !== undefined) sub.isActive = dto.isActive;
    if (dto.description !== undefined) sub.description = dto.description?.trim() || null;
    await this.subRepo.save(sub);
    return {
      id: sub.id,
      url: sub.url,
      events: sub.events,
      isActive: sub.isActive,
      description: sub.description,
    };
  }

  async deleteSubscription(businessId: string, id: string) {
    const sub = await this.findSubscription(businessId, id);
    await this.subRepo.remove(sub);
    return { deleted: true };
  }

  async listDeliveries(businessId: string, subscriptionId?: string, limit = 50) {
    const qb = this.deliveryRepo
      .createQueryBuilder('d')
      .where('d.business_id = :businessId', { businessId })
      .orderBy('d.created_at', 'DESC')
      .take(limit);
    if (subscriptionId) {
      qb.andWhere('d.subscription_id = :subscriptionId', { subscriptionId });
    }
    return qb.getMany();
  }

  async getActiveSubscriptionsForEvent(businessId: string, eventType: string) {
    const subs = await this.subRepo.find({
      where: { businessId, isActive: true },
    });
    return subs.filter((s) => s.events.includes(eventType));
  }

  decryptSubscriptionSecret(sub: WebhookSubscription): string {
    return decryptSecret(sub.secretEnc, this.encryptionSecret());
  }

  private async findSubscription(businessId: string, id: string) {
    const sub = await this.subRepo.findOne({ where: { id, businessId } });
    if (!sub) throw new NotFoundException('Webhook subscription not found');
    return sub;
  }

  private validateEvents(events: string[]) {
    const allowed = new Set<string>(WEBHOOK_EVENT_OPTIONS);
    for (const e of events) {
      if (!allowed.has(e)) {
        throw new BadRequestException(`Unsupported webhook event: ${e}`);
      }
    }
  }

  private encryptionSecret(): string {
    return this.config.get<string>('JWT_SECRET') || 'dev-secret-change-in-production';
  }
}
