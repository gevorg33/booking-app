import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GiftCard } from './entities/gift-card.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import type { GiftCardFulfillmentStatus } from './gift-card.types.js';
import { EventType } from '../../events/event-types.js';

@Injectable()
export class GiftCardFulfillmentService {
  constructor(
    @InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private eventEmitter: EventEmitter2,
  ) {}

  async listCardCreationQueue(businessId: string): Promise<GiftCard[]> {
    return this.giftCardRepo.find({
      where: {
        businessId,
        deliveryMethod: 'physical',
        fulfillmentStatus: 'awaiting_card_creation',
      },
      order: { createdAt: 'ASC' },
      relations: { serviceCredits: true },
    });
  }

  async listDeliveryQueue(businessId: string): Promise<GiftCard[]> {
    return this.giftCardRepo.find({
      where: {
        businessId,
        deliveryMethod: 'physical',
        fulfillmentStatus: In(['ready_for_delivery', 'out_for_delivery']),
      },
      order: { cardReadyAt: 'ASC' },
      relations: { serviceCredits: true },
    });
  }

  async listDashboardOrders(businessId: string, status?: GiftCardFulfillmentStatus): Promise<GiftCard[]> {
    const where: Record<string, unknown> = { businessId };
    if (status) where.fulfillmentStatus = status;
    else where.fulfillmentStatus = In([
      'awaiting_card_creation',
      'ready_for_delivery',
      'out_for_delivery',
      'shipped',
      'delivered',
    ]);

    return this.giftCardRepo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: { serviceCredits: true },
    });
  }

  async markCardReady(
    businessId: string,
    giftCardId: string,
    staffUserId: string,
  ): Promise<GiftCard> {
    const card = await this.findPhysicalOrder(businessId, giftCardId);
    if (card.fulfillmentStatus !== 'awaiting_card_creation') {
      throw new BadRequestException('Gift card is not awaiting card creation');
    }

    const staffId = await this.resolveEmployeeId(staffUserId, businessId);
    card.fulfillmentStatus = 'ready_for_delivery';
    card.cardReadyAt = new Date();
    card.cardCreatorStaffId = staffId;
    card.codeRevealed = true;

    const saved = await this.giftCardRepo.save(card);
    this.emitFulfillmentEvent(saved, 'ready_for_delivery');
    return saved;
  }

  async markOutForDelivery(
    businessId: string,
    giftCardId: string,
    staffUserId: string,
  ): Promise<GiftCard> {
    const card = await this.findPhysicalOrder(businessId, giftCardId);
    if (card.fulfillmentStatus !== 'ready_for_delivery') {
      throw new BadRequestException('Gift card is not ready for delivery');
    }

    const staffId = await this.resolveEmployeeId(staffUserId, businessId);
    card.fulfillmentStatus = 'out_for_delivery';
    card.deliveryStaffId = staffId;
    return this.giftCardRepo.save(card);
  }

  async markShipped(
    businessId: string,
    giftCardId: string,
    carrier: string,
    trackingNumber: string,
  ): Promise<GiftCard> {
    const card = await this.findPhysicalOrder(businessId, giftCardId);
    card.fulfillmentStatus = 'shipped';
    card.trackingCarrier = carrier;
    card.trackingNumber = trackingNumber;
    card.codeRevealed = true;
    return this.giftCardRepo.save(card);
  }

  async markDelivered(businessId: string, giftCardId: string): Promise<GiftCard> {
    const card = await this.findPhysicalOrder(businessId, giftCardId);
    card.fulfillmentStatus = 'delivered';
    card.deliveredAt = new Date();
    card.codeRevealed = true;
    return this.giftCardRepo.save(card);
  }

  async resolveStaffUserIds(employeeIds: string[]): Promise<string[]> {
    if (!employeeIds.length) return [];
    const employees = await this.employeeRepo.find({ where: { id: In(employeeIds) } });
    return employees.map((e) => e.userId).filter(Boolean) as string[];
  }

  private async findPhysicalOrder(businessId: string, giftCardId: string): Promise<GiftCard> {
    const card = await this.giftCardRepo.findOne({
      where: { id: giftCardId, businessId },
      relations: { serviceCredits: true },
    });
    if (!card) throw new NotFoundException('Gift card order not found');
    if (card.deliveryMethod !== 'physical') {
      throw new BadRequestException('Not a physical gift card order');
    }
    return card;
  }

  private async resolveEmployeeId(userId: string, businessId: string): Promise<string | null> {
    const employee = await this.employeeRepo.findOne({ where: { userId, businessId } });
    return employee?.id ?? null;
  }

  private emitFulfillmentEvent(card: GiftCard, status: GiftCardFulfillmentStatus) {
    this.eventEmitter.emit(EventType.PAYMENT_RECEIVED, {
      eventType: EventType.PAYMENT_RECEIVED,
      aggregateType: 'gift_card_fulfillment',
      aggregateId: card.id,
      businessId: card.businessId,
      payload: {
        giftCardId: card.id,
        fulfillmentStatus: status,
        deliveryMethod: card.deliveryMethod,
      },
    });
  }
}
