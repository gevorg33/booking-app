import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { GiftCard } from './entities/gift-card.entity.js';

@Injectable()
export class GiftCardsService {
  constructor(@InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>) {}

  async list(businessId: string): Promise<GiftCard[]> {
    return this.giftCardRepo.find({
      where: { businessId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    businessId: string,
    dto: { amount: number; currency?: string; expiresAt?: string; purchaserCustomerId?: string },
  ): Promise<GiftCard> {
    const code = `GC-${randomBytes(4).toString('hex').toUpperCase()}`;
    return this.giftCardRepo.save(
      this.giftCardRepo.create({
        businessId,
        code,
        initialBalance: dto.amount,
        balance: dto.amount,
        currency: dto.currency || 'USD',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        purchaserCustomerId: dto.purchaserCustomerId || undefined,
      }),
    );
  }

  async validate(businessId: string, code: string): Promise<GiftCard> {
    const card = await this.giftCardRepo.findOne({
      where: { businessId, code: code.trim().toUpperCase(), isActive: true },
    });
    if (!card) throw new NotFoundException('Gift card not found');
    if (card.expiresAt && card.expiresAt < new Date()) {
      throw new BadRequestException('Gift card expired');
    }
    if (Number(card.balance) <= 0) throw new BadRequestException('Gift card has no balance');
    return card;
  }

  async redeem(businessId: string, code: string, amount: number): Promise<GiftCard> {
    const card = await this.validate(businessId, code);
    if (amount > Number(card.balance)) {
      throw new BadRequestException('Insufficient gift card balance');
    }
    card.balance = Number(card.balance) - amount;
    // Single-use: once redeemed on a booking, the card cannot be used again.
    card.isActive = false;
    return this.giftCardRepo.save(card);
  }
}
