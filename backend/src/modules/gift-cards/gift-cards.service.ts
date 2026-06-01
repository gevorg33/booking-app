import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftCard } from './entities/gift-card.entity.js';
import { GiftCardServiceCredit } from './entities/gift-card-service-credit.entity.js';
import { GiftCardRedemption } from './entities/gift-card-redemption.entity.js';
import { generateGiftCardCode } from './gift-card-code.util.js';
import type { GiftCardType } from './gift-card.types.js';

export interface GiftCardBalanceView {
  id: string;
  code: string;
  cardType: GiftCardType;
  balance: number;
  currency: string;
  expiresAt: Date | null;
  isActive: boolean;
  serviceCredits: Array<{
    serviceId: string;
    serviceName: string;
    quantityRemaining: number;
    quantityTotal: number;
  }>;
}

@Injectable()
export class GiftCardsService {
  constructor(
    @InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>,
    @InjectRepository(GiftCardServiceCredit) private creditRepo: Repository<GiftCardServiceCredit>,
    @InjectRepository(GiftCardRedemption) private redemptionRepo: Repository<GiftCardRedemption>,
  ) {}

  async list(businessId: string): Promise<GiftCard[]> {
    return this.giftCardRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
      relations: { serviceCredits: true },
    });
  }

  async create(
    businessId: string,
    dto: {
      amount: number;
      currency?: string;
      expiresAt?: string;
      purchaserCustomerId?: string;
      cardType?: GiftCardType;
    },
  ): Promise<GiftCard> {
    const cardType = dto.cardType ?? 'monetary';
    const code = generateGiftCardCode(cardType);
    return this.giftCardRepo.save(
      this.giftCardRepo.create({
        businessId,
        code,
        cardType,
        initialBalance: dto.amount,
        balance: dto.amount,
        currency: dto.currency || 'USD',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        purchaserCustomerId: dto.purchaserCustomerId || undefined,
      }),
    );
  }

  async findByCode(businessId: string, code: string): Promise<GiftCard | null> {
    return this.giftCardRepo.findOne({
      where: { businessId, code: code.trim().toUpperCase() },
      relations: { serviceCredits: true },
    });
  }

  async validate(businessId: string, code: string, serviceId?: string): Promise<GiftCard> {
    const card = await this.findByCode(businessId, code);
    if (!card || !card.isActive) throw new NotFoundException('Gift card not found');
    if (!card.codeRevealed) {
      throw new BadRequestException('Gift card code is not yet active');
    }
    if (card.expiresAt && card.expiresAt < new Date()) {
      throw new BadRequestException('Gift card expired');
    }

    if (card.cardType === 'monetary') {
      if (Number(card.balance) <= 0) throw new BadRequestException('Gift card has no balance');
      return card;
    }

    const credits = card.serviceCredits ?? [];
    if (serviceId) {
      const match = credits.find((c) => c.serviceId === serviceId && c.quantityRemaining > 0);
      if (!match) {
        throw new BadRequestException('Gift card has no remaining credit for this service');
      }
    } else if (!credits.some((c) => c.quantityRemaining > 0)) {
      throw new BadRequestException('Gift card has no remaining service credits');
    }

    return card;
  }

  async redeem(businessId: string, code: string, amount: number, bookingId?: string): Promise<GiftCard> {
    const card = await this.validate(businessId, code);
    if (card.cardType !== 'monetary') {
      throw new BadRequestException('Use service credit redemption for this gift card type');
    }
    if (amount > Number(card.balance)) {
      throw new BadRequestException('Insufficient gift card balance');
    }

    card.balance = Number(card.balance) - amount;
    if (Number(card.balance) <= 0) {
      card.balance = 0;
      card.isActive = false;
    }

    await this.redemptionRepo.save(
      this.redemptionRepo.create({
        giftCardId: card.id,
        businessId,
        bookingId: bookingId ?? null,
        amount,
        creditsConsumed: 0,
      }),
    );

    return this.giftCardRepo.save(card);
  }

  async redeemServiceCredit(
    businessId: string,
    code: string,
    serviceId: string,
    bookingId?: string,
  ): Promise<GiftCard> {
    const card = await this.validate(businessId, code, serviceId);
    if (card.cardType === 'monetary') {
      throw new BadRequestException('Monetary gift cards must be redeemed by amount');
    }

    const credit = (card.serviceCredits ?? []).find(
      (c) => c.serviceId === serviceId && c.quantityRemaining > 0,
    );
    if (!credit) throw new BadRequestException('No service credit available');

    credit.quantityRemaining -= 1;
    await this.creditRepo.save(credit);

    await this.redemptionRepo.save(
      this.redemptionRepo.create({
        giftCardId: card.id,
        businessId,
        bookingId: bookingId ?? null,
        serviceId,
        serviceName: credit.serviceName,
        creditsConsumed: 1,
      }),
    );

    const remaining = (card.serviceCredits ?? []).reduce(
      (sum, c) => sum + c.quantityRemaining,
      0,
    );
    if (remaining <= 0) card.isActive = false;

    return this.giftCardRepo.save(card);
  }

  async getBalanceView(businessId: string, code: string): Promise<GiftCardBalanceView> {
    const card = await this.findByCode(businessId, code);
    if (!card) throw new NotFoundException('Gift card not found');

    return {
      id: card.id,
      code: card.codeRevealed ? card.code : '****',
      cardType: card.cardType,
      balance: Number(card.balance),
      currency: card.currency,
      expiresAt: card.expiresAt,
      isActive: card.isActive,
      serviceCredits: (card.serviceCredits ?? []).map((c) => ({
        serviceId: c.serviceId,
        serviceName: c.serviceName,
        quantityRemaining: c.quantityRemaining,
        quantityTotal: c.quantityTotal,
      })),
    };
  }

  async listRedemptions(giftCardId: string): Promise<GiftCardRedemption[]> {
    return this.redemptionRepo.find({
      where: { giftCardId },
      order: { createdAt: 'DESC' },
    });
  }
}
