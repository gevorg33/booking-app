import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventType } from '../../../events/event-types.js';
import type { OperationalEvent } from '../../../events/store/event-store.entity.js';
import { PushService } from '../push.service.js';
import { GiftCardFulfillmentService } from '../../gift-cards/gift-card-fulfillment.service.js';
import { GiftCardDeliveryService } from '../../gift-cards/gift-card-delivery.service.js';
import { readBusinessGiftCardSettings } from '../../gift-cards/gift-card.types.js';
import { Business } from '../../business/entities/business.entity.js';
import { GiftCard } from '../../gift-cards/entities/gift-card.entity.js';

@Injectable()
export class GiftCardFulfillmentPushListener {
  private readonly logger = new Logger(GiftCardFulfillmentPushListener.name);

  constructor(
    private pushService: PushService,
    private fulfillmentService: GiftCardFulfillmentService,
    private deliveryService: GiftCardDeliveryService,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>,
  ) {}

  @OnEvent(EventType.PAYMENT_RECEIVED, { async: true })
  async handleGiftCardPayment(event: OperationalEvent): Promise<void> {
    if (event.aggregateType !== 'gift_card_order') return;
    if (!event.businessId) return;

    const giftCardId = String(event.payload?.giftCardId ?? event.aggregateId);
    const card = await this.giftCardRepo.findOne({ where: { id: giftCardId } });
    if (!card) return;

    if (card.deliveryMethod === 'digital') {
      await this.deliveryService.deliverDigitalGiftCard(card.id);
      return;
    }

    const business = await this.businessRepo.findOne({ where: { id: event.businessId } });
    const settings = readBusinessGiftCardSettings(business?.settings);
    const userIds = await this.fulfillmentService.resolveStaffUserIds(settings.cardCreatorStaffIds);

    for (const userId of userIds) {
      await this.pushService.sendToUser(userId, event.businessId, {
        title: 'New gift card to prepare',
        body: `${card.recipientName ?? 'Recipient'} — ${card.cardType} gift card`,
        url: `/provider/gift-cards/create/${card.id}`,
      });
    }
  }

  @OnEvent(EventType.PAYMENT_RECEIVED, { async: true })
  async handleGiftCardReadyForDelivery(event: OperationalEvent): Promise<void> {
    if (event.aggregateType !== 'gift_card_fulfillment') return;
    if (event.payload?.fulfillmentStatus !== 'ready_for_delivery') return;
    if (!event.businessId) return;

    const business = await this.businessRepo.findOne({ where: { id: event.businessId } });
    const settings = readBusinessGiftCardSettings(business?.settings);
    const userIds = await this.fulfillmentService.resolveStaffUserIds(settings.deliveryStaffIds);
    const card = await this.giftCardRepo.findOne({ where: { id: event.aggregateId } });
    if (!card) return;

    for (const userId of userIds) {
      await this.pushService.sendToUser(userId, event.businessId, {
        title: 'Gift card ready for delivery',
        body: `${card.recipientName ?? 'Recipient'} — ${card.shippingAddress?.city ?? 'pickup'}`,
        url: `/provider/gift-cards/delivery/${card.id}`,
      });
    }
  }
}
