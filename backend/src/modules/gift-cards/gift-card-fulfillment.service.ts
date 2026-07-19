import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GiftCard } from './entities/gift-card.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import type { GiftCardFulfillmentStatus } from './gift-card.types.js';
import { EventType } from '../../events/event-types.js';

export type GiftCardFulfillmentSortBy = 'createdAt';
export type GiftCardFulfillmentSortOrder = 'ASC' | 'DESC';

export interface ListGiftCardFulfillmentQuery {
  status?: GiftCardFulfillmentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: GiftCardFulfillmentSortBy;
  sortOrder?: GiftCardFulfillmentSortOrder;
}

export interface PaginatedGiftCardFulfillmentResult {
  orders: GiftCard[];
  total: number;
  page: number;
  pageSize: number;
}

const DASHBOARD_FULFILLMENT_STATUSES: GiftCardFulfillmentStatus[] = [
  'pending',
  'awaiting_card_creation',
  'ready_for_delivery',
  'out_for_delivery',
  'shipped',
  'delivered',
  'cancelled',
];

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

  async listDashboardOrders(
    businessId: string,
    query: ListGiftCardFulfillmentQuery = {},
  ): Promise<PaginatedGiftCardFulfillmentResult> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100);
    const sortOrder: 'ASC' | 'DESC' =
      query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.giftCardRepo
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.serviceCredits', 'serviceCredits')
      .where('card.businessId = :businessId', { businessId });

    if (query.status) {
      qb.andWhere('card.fulfillmentStatus = :status', { status: query.status });
    } else {
      qb.andWhere('card.fulfillmentStatus IN (:...statuses)', {
        statuses: DASHBOARD_FULFILLMENT_STATUSES,
      });
    }

    const search = query.search?.trim().toLowerCase();
    if (search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('LOWER(card.code) LIKE :search', { search: `%${search}%` })
            .orWhere('LOWER(card.recipientName) LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('LOWER(card.recipientEmail) LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('LOWER(card.purchaserEmail) LIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    const [orders, total] = await qb
      .orderBy('card.createdAt', sortOrder)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { orders, total, page, pageSize };
  }

  async getDashboardOrder(
    businessId: string,
    giftCardId: string,
  ): Promise<GiftCard> {
    const card = await this.giftCardRepo.findOne({
      where: { id: giftCardId, businessId },
      relations: { serviceCredits: true, purchaser: true },
    });
    if (!card) throw new NotFoundException('Gift card order not found');
    return card;
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

  async markDelivered(
    businessId: string,
    giftCardId: string,
  ): Promise<GiftCard> {
    const card = await this.findPhysicalOrder(businessId, giftCardId);
    // e2e-bug.73 — delivered is terminal; only out_for_delivery (hand) or
    // shipped (carrier) may advance here — never skip ready/dispatch steps.
    if (
      card.fulfillmentStatus !== 'out_for_delivery' &&
      card.fulfillmentStatus !== 'shipped'
    ) {
      throw new BadRequestException(
        card.fulfillmentStatus === 'delivered'
          ? 'Gift card is already delivered'
          : 'Gift card must be out for delivery or shipped before marking delivered',
      );
    }
    card.fulfillmentStatus = 'delivered';
    card.deliveredAt = new Date();
    card.codeRevealed = true;
    return this.giftCardRepo.save(card);
  }

  async resolveStaffUserIds(employeeIds: string[]): Promise<string[]> {
    if (!employeeIds.length) return [];
    const employees = await this.employeeRepo.find({
      where: { id: In(employeeIds) },
    });
    return employees.map((e) => e.userId).filter(Boolean);
  }

  private async findPhysicalOrder(
    businessId: string,
    giftCardId: string,
  ): Promise<GiftCard> {
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

  private async resolveEmployeeId(
    userId: string,
    businessId: string,
  ): Promise<string | null> {
    const employee = await this.employeeRepo.findOne({
      where: { userId, businessId },
    });
    return employee?.id ?? null;
  }

  private emitFulfillmentEvent(
    card: GiftCard,
    status: GiftCardFulfillmentStatus,
  ) {
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
