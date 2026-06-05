import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GiftCard } from './entities/gift-card.entity.js';
import {
  GiftCardChangeRequest,
  type GiftCardChangeRequestStatus,
} from './entities/gift-card-change-request.entity.js';
import { readBusinessGiftCardSettings } from './gift-card.types.js';
import { evaluateGiftCardOrderPolicy } from './gift-card-order-policy.util.js';
import { resolveGiftCardExpirationUpdate } from './gift-card-expiration.util.js';
import type {
  GiftCardChangeRequestResolution,
  GiftCardChangeRequestListItem,
  GiftCardCustomerAccountView,
  GiftCardCustomerOrderView,
  GiftCardCustomerRedeemedView,
  GiftCardModifyPayload,
  GiftCardRefundStatus,
  SubmitGiftCardModifyInput,
} from './gift-card-order.types.js';
import { IsNull, Not } from 'typeorm';
import { ZendeskIntegrationService } from '../integrations/zendesk/zendesk-integration.service.js';
import { EmailService } from '../notifications/email.service.js';
import { WhatsAppService } from '../notifications/whatsapp.service.js';
import { WhatsAppIntegrationService } from '../notifications/whatsapp-integration.service.js';
import { Business } from '../business/entities/business.entity.js';
import { GiftCardRefundService } from './gift-card-refund.service.js';
import { deactivateCancelledGiftCard } from './gift-card-refund.util.js';

const OPEN_REQUEST_STATUSES: GiftCardChangeRequestStatus[] = [
  'pending',
  'in_review',
  'needs_info',
];

function toIso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

@Injectable()
export class GiftCardOrderService {
  private readonly logger = new Logger(GiftCardOrderService.name);

  constructor(
    @InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>,
    @InjectRepository(GiftCardChangeRequest)
    private changeRequestRepo: Repository<GiftCardChangeRequest>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private zendeskService: ZendeskIntegrationService,
    private emailService: EmailService,
    private whatsappService: WhatsAppService,
    private whatsappIntegrationService: WhatsAppIntegrationService,
    private refundService: GiftCardRefundService,
  ) {}

  async listCustomerGiftCardAccount(
    businessId: string,
    customerId: string,
  ): Promise<GiftCardCustomerAccountView> {
    const [orders, redeemed] = await Promise.all([
      this.listCustomerOrders(businessId, customerId),
      this.listCustomerRedeemedGiftCards(businessId, customerId),
    ]);
    return { orders, redeemed };
  }

  async listCustomerRedeemedGiftCards(
    businessId: string,
    customerId: string,
  ): Promise<GiftCardCustomerRedeemedView[]> {
    await this.findBusiness(businessId);
    const cards = await this.giftCardRepo.find({
      where: {
        businessId,
        claimedByCustomerId: customerId,
        claimedAt: Not(IsNull()),
      },
      order: { claimedAt: 'DESC' },
      relations: { serviceCredits: true },
    });
    return cards.map((card) => this.toRedeemedView(card));
  }

  async listCustomerOrders(
    businessId: string,
    customerId: string,
  ): Promise<GiftCardCustomerOrderView[]> {
    const business = await this.findBusiness(businessId);
    const settings = readBusinessGiftCardSettings(business.settings);
    const cards = await this.giftCardRepo.find({
      where: { businessId, purchaserCustomerId: customerId },
      order: { createdAt: 'DESC' },
      relations: { serviceCredits: true },
    });
    const requests = await this.loadOpenRequestsByCardIds(
      cards.map((c) => c.id),
    );
    return cards.map((card) =>
      this.toCustomerView(card, settings, requests.get(card.id)),
    );
  }

  async getCustomerOrder(
    businessId: string,
    customerId: string,
    giftCardId: string,
  ): Promise<GiftCardCustomerOrderView> {
    const card = await this.requireCustomerCard(
      businessId,
      customerId,
      giftCardId,
    );
    const business = await this.findBusiness(businessId);
    const settings = readBusinessGiftCardSettings(business.settings);
    const request = await this.findOpenRequest(giftCardId);
    return this.toCustomerView(card, settings, request);
  }

  async submitCancelRequest(
    businessId: string,
    customerId: string,
    giftCardId: string,
    customerNotes?: string,
  ) {
    const card = await this.requireCustomerCard(
      businessId,
      customerId,
      giftCardId,
    );
    const business = await this.findBusiness(businessId);
    const settings = readBusinessGiftCardSettings(business.settings);
    const openRequest = await this.findOpenRequest(giftCardId);
    const policy = this.evaluateOrderPolicy(card, settings, openRequest);
    if (!policy.canCancel) {
      throw new BadRequestException(
        policy.blockReason ?? 'Cancel is not available',
      );
    }

    const request = await this.changeRequestRepo.save(
      this.changeRequestRepo.create({
        giftCardId: card.id,
        businessId,
        customerId,
        requestType: 'cancel',
        status: 'pending',
        customerNotes: customerNotes?.trim() || null,
      }),
    );

    deactivateCancelledGiftCard(card);
    await this.giftCardRepo.save(card);
    const refundStatus = await this.refundService.refundPurchase(
      business,
      card,
    );

    request.status = 'completed';
    request.resolvedAt = new Date();
    await this.changeRequestRepo.save(request);
    await this.notifyCustomer(
      card,
      business.name,
      'completed',
      request,
      refundStatus,
    );

    return {
      request,
      order: await this.getCustomerOrder(businessId, customerId, giftCardId),
      refundStatus,
    };
  }

  async submitModifyRequest(
    businessId: string,
    customerId: string,
    giftCardId: string,
    _input: SubmitGiftCardModifyInput,
  ) {
    await this.requireCustomerCard(businessId, customerId, giftCardId);
    throw new BadRequestException(
      'Gift card orders cannot be modified. You can cancel within the policy window if no value has been used.',
    );
  }

  async listChangeRequests(
    businessId: string,
    status?: string,
  ): Promise<GiftCardChangeRequestListItem[]> {
    const where: Record<string, unknown> = { businessId };
    if (status) where.status = status;
    const requests = await this.changeRequestRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    if (requests.length === 0) return [];

    const cardIds = [...new Set(requests.map((r) => r.giftCardId))];
    const cards = await this.giftCardRepo.find({
      where: { id: In(cardIds), businessId },
    });
    const cardById = new Map(cards.map((card) => [card.id, card]));

    return requests.map((request) =>
      this.toChangeRequestListItem(request, cardById.get(request.giftCardId)),
    );
  }

  async resolveChangeRequest(
    businessId: string,
    requestId: string,
    resolution: GiftCardChangeRequestResolution,
    specialistNotes?: string,
  ) {
    const request = await this.changeRequestRepo.findOne({
      where: { id: requestId, businessId },
    });
    if (!request) throw new NotFoundException('Change request not found');
    if (!OPEN_REQUEST_STATUSES.includes(request.status)) {
      throw new BadRequestException('This request has already been resolved');
    }

    const card = await this.giftCardRepo.findOne({
      where: { id: request.giftCardId, businessId },
      relations: { serviceCredits: true, business: true },
    });
    if (!card) throw new NotFoundException('Gift card not found');

    const business = card.business ?? (await this.findBusiness(businessId));
    request.specialistNotes = specialistNotes?.trim() || null;

    if (resolution === 'needs_info') {
      request.status = 'needs_info';
      await this.changeRequestRepo.save(request);
      await this.notifyCustomer(card, business.name, 'needs_info', request);
      return { request, card };
    }

    if (resolution === 'deny') {
      request.status = 'denied';
      request.resolvedAt = new Date();
      await this.changeRequestRepo.save(request);
      await this.notifyCustomer(card, business.name, 'denied', request);
      return { request, card };
    }

    let refundStatus: GiftCardRefundStatus | null = null;

    if (request.requestType === 'cancel') {
      deactivateCancelledGiftCard(card);
      await this.giftCardRepo.save(card);
      refundStatus = await this.refundService.refundPurchase(business, card);
    } else {
      this.applyApprovedModifications(card, request.modifyPayload);
      await this.giftCardRepo.save(card);
    }

    request.status = 'completed';
    request.resolvedAt = new Date();
    await this.changeRequestRepo.save(request);
    await this.notifyCustomer(
      card,
      business.name,
      'completed',
      request,
      refundStatus,
    );

    return { request, card, refundStatus };
  }

  applyApprovedModifications(
    card: GiftCard,
    payload: GiftCardModifyPayload | null,
  ) {
    if (!payload) return;

    if (payload.recipientName !== undefined)
      card.recipientName = payload.recipientName || null;
    if (payload.recipientEmail !== undefined)
      card.recipientEmail = payload.recipientEmail || null;
    if (payload.recipientPhone !== undefined)
      card.recipientPhone = payload.recipientPhone || null;
    if (payload.personalMessage !== undefined) {
      card.personalMessage = payload.personalMessage || null;
    }
    if (payload.shippingAddress !== undefined) {
      card.shippingAddress = payload.shippingAddress ?? null;
    }
    if (payload.shippingMethodId !== undefined) {
      card.shippingMethod = payload.shippingMethodId || null;
    }
    if (payload.amount !== undefined && card.cardType === 'monetary') {
      const amount = Number(payload.amount);
      if (Number.isFinite(amount) && amount > 0) {
        card.balance = amount;
        card.initialBalance = amount;
      }
    }
    if (payload.expiresAt !== undefined) {
      const resolved = resolveGiftCardExpirationUpdate(card.expiresAt, {
        expiresAt: payload.expiresAt,
      });
      card.expiresAt = resolved.expiresAt;
    }
  }

  private toChangeRequestListItem(
    request: GiftCardChangeRequest,
    card?: GiftCard,
  ): GiftCardChangeRequestListItem {
    return {
      id: request.id,
      requestType: request.requestType,
      status: request.status,
      displayStatus: this.displayChangeRequestStatus(request),
      giftCardId: request.giftCardId,
      giftCardCode: card?.code ?? '—',
      giftCardStatus: card?.fulfillmentStatus ?? null,
      customerNotes: request.customerNotes,
      specialistNotes: request.specialistNotes,
      refundStatus: this.resolveRefundStatus(card, request),
      createdAt: toIso(request.createdAt),
      resolvedAt: request.resolvedAt ? toIso(request.resolvedAt) : null,
    };
  }

  private displayChangeRequestStatus(request: GiftCardChangeRequest): string {
    if (request.status === 'completed' && request.requestType === 'cancel') {
      return 'cancelled';
    }
    return request.status;
  }

  private resolveRefundStatus(
    card: GiftCard | undefined,
    request: GiftCardChangeRequest,
  ): GiftCardRefundStatus | null {
    if (request.requestType !== 'cancel') return null;
    if (request.status !== 'completed') return null;
    if (card?.stripeRefundId) return 'refunded';
    if (!card?.stripeSessionId) return 'skipped';
    return 'failed';
  }

  private async notifyCustomer(
    card: GiftCard,
    businessName: string,
    kind: 'needs_info' | 'denied' | 'completed',
    request: GiftCardChangeRequest,
    refundStatus?: GiftCardRefundStatus | null,
  ) {
    const email = card.purchaserEmail?.trim();
    const phone = card.recipientPhone?.trim() || null;
    const subject = this.notificationSubject(kind, request.requestType);
    const body = this.notificationBody(
      businessName,
      kind,
      request,
      refundStatus,
    );

    if (email) {
      await this.emailService.send({
        to: email,
        subject,
        html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
        text: body,
      });
    }

    if (phone) {
      const whatsappConfig =
        this.whatsappIntegrationService.resolveRuntimeConfig(
          card.business?.settings,
        );
      if (whatsappConfig) {
        await this.whatsappService.sendGiftCardMessage(
          {
            toPhone: phone,
            recipientName: card.recipientName ?? 'Customer',
            senderName: businessName,
            giftCardCode: card.codeRevealed ? card.code : '****',
            summary: body,
          },
          whatsappConfig,
        );
      }
    }
  }

  private notificationSubject(
    kind: 'needs_info' | 'denied' | 'completed',
    requestType: string,
  ): string {
    const action = requestType === 'cancel' ? 'cancellation' : 'modification';
    switch (kind) {
      case 'needs_info':
        return `More information needed for your gift card ${action} request`;
      case 'denied':
        return `Your gift card ${action} request was declined`;
      default:
        return `Your gift card ${action} request is complete`;
    }
  }

  private notificationBody(
    businessName: string,
    kind: 'needs_info' | 'denied' | 'completed',
    request: GiftCardChangeRequest,
    refundStatus?: GiftCardRefundStatus | null,
  ): string {
    const lines = [`${businessName} gift card update`];
    if (kind === 'needs_info') {
      lines.push(
        request.specialistNotes?.trim() ||
          'Please reply with any additional details we requested.',
      );
    } else if (kind === 'denied') {
      lines.push(
        request.specialistNotes?.trim() ||
          'We were unable to approve this request. Contact us if you have questions.',
      );
    } else {
      if (request.requestType === 'cancel') {
        lines.push('Your gift card order has been cancelled.');
        if (
          refundStatus === 'refunded' ||
          refundStatus === 'already_refunded'
        ) {
          lines.push(
            'A refund has been issued to your original payment method.',
          );
        } else if (refundStatus === 'failed') {
          lines.push(
            'We could not process your refund automatically. Please contact the business for assistance.',
          );
        } else if (refundStatus === 'skipped') {
          lines.push('No online payment was found for this order.');
        }
      } else {
        lines.push('Your requested changes have been applied.');
      }
      if (request.specialistNotes?.trim())
        lines.push(request.specialistNotes.trim());
    }
    return lines.join('\n\n');
  }

  private toRedeemedView(card: GiftCard): GiftCardCustomerRedeemedView {
    return {
      id: card.id,
      code: card.code,
      cardType: card.cardType,
      currency: card.currency,
      claimedAt: toIso(card.claimedAt!),
      purchaseAmount:
        card.purchaseAmount != null ? Number(card.purchaseAmount) : null,
      packageId: card.packageId ?? null,
      subscriptionPlanId: card.subscriptionPlanId ?? null,
      serviceCredits: (card.serviceCredits ?? []).map((credit) => ({
        serviceId: credit.serviceId,
        serviceName: credit.serviceName,
        quantityRemaining: credit.quantityRemaining,
        quantityTotal: credit.quantityTotal,
      })),
    };
  }

  private toCustomerView(
    card: GiftCard,
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
    openRequest?: GiftCardChangeRequest | null,
  ): GiftCardCustomerOrderView {
    const policy = this.evaluateOrderPolicy(card, settings, openRequest);
    return {
      id: card.id,
      code: card.codeRevealed ? card.code : '****',
      cardType: card.cardType,
      balance: Number(card.balance),
      currency: card.currency,
      deliveryMethod: card.deliveryMethod,
      fulfillmentStatus: card.fulfillmentStatus,
      recipientName: card.recipientName,
      recipientEmail: card.recipientEmail,
      expiresAt: card.expiresAt?.toISOString() ?? null,
      isActive: card.isActive,
      purchaseAmount:
        card.purchaseAmount != null ? Number(card.purchaseAmount) : null,
      trackingCarrier: card.trackingCarrier,
      trackingNumber: card.trackingNumber,
      createdAt: toIso(card.createdAt),
      serviceCredits: (card.serviceCredits ?? []).map((credit) => ({
        serviceId: credit.serviceId,
        serviceName: credit.serviceName,
        quantityRemaining: credit.quantityRemaining,
        quantityTotal: credit.quantityTotal,
      })),
      policy,
      changeRequest: openRequest
        ? {
            id: openRequest.id,
            requestType: openRequest.requestType,
            status: openRequest.status,
            createdAt: toIso(openRequest.createdAt),
          }
        : null,
    };
  }

  private evaluateOrderPolicy(
    card: GiftCard,
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
    openRequest?: GiftCardChangeRequest | null,
  ) {
    return evaluateGiftCardOrderPolicy(
      {
        createdAt: card.createdAt,
        deliveryMethod: card.deliveryMethod,
        fulfillmentStatus: card.fulfillmentStatus,
        cardType: card.cardType,
        balance: Number(card.balance),
        initialBalance: Number(card.initialBalance),
        isActive: card.isActive,
        claimedAt: card.claimedAt,
        serviceCredits: (card.serviceCredits ?? []).map((credit) => ({
          quantityRemaining: credit.quantityRemaining,
          quantityTotal: credit.quantityTotal,
        })),
      },
      settings,
      openRequest,
    );
  }

  private async requireCustomerCard(
    businessId: string,
    customerId: string,
    giftCardId: string,
  ): Promise<GiftCard> {
    const card = await this.giftCardRepo.findOne({
      where: { id: giftCardId, businessId, purchaserCustomerId: customerId },
      relations: { serviceCredits: true, business: true },
    });
    if (!card) throw new NotFoundException('Gift card order not found');
    return card;
  }

  private async findOpenRequest(giftCardId: string) {
    return this.changeRequestRepo
      .createQueryBuilder('r')
      .where('r.gift_card_id = :giftCardId', { giftCardId })
      .andWhere('r.status IN (:...statuses)', {
        statuses: OPEN_REQUEST_STATUSES,
      })
      .orderBy('r.created_at', 'DESC')
      .getOne();
  }

  private async loadOpenRequestsByCardIds(cardIds: string[]) {
    const map = new Map<string, GiftCardChangeRequest>();
    if (!cardIds.length) return map;
    const requests = await this.changeRequestRepo
      .createQueryBuilder('r')
      .where('r.gift_card_id IN (:...cardIds)', { cardIds })
      .andWhere('r.status IN (:...statuses)', {
        statuses: OPEN_REQUEST_STATUSES,
      })
      .orderBy('r.created_at', 'DESC')
      .getMany();
    for (const request of requests) {
      if (!map.has(request.giftCardId)) map.set(request.giftCardId, request);
    }
    return map;
  }

  private async findBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }
}
