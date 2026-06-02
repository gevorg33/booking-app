import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromoCode, PromoDiscountType } from './entities/promo-code.entity.js';
import { PlanEntitlementsService } from '../billing/plan-entitlements.service.js';

@Injectable()
export class PromoCodesService {
  constructor(
    @InjectRepository(PromoCode) private promoRepo: Repository<PromoCode>,
    private planEntitlements: PlanEntitlementsService,
  ) {}

  list(businessId: string) {
    return this.promoRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    businessId: string,
    dto: {
      code: string;
      discountType: PromoDiscountType;
      discountValue: number;
      minOrderAmount?: number;
      maxUses?: number;
      expiresAt?: string;
      description?: string;
    },
  ) {
    await this.planEntitlements.assertFeature(businessId, 'promoCodes');
    const code = dto.code.trim().toUpperCase();
    if (!code) throw new BadRequestException('Promo code is required');

    const existing = await this.promoRepo.findOne({ where: { businessId, code } });
    if (existing) throw new BadRequestException('Promo code already exists');

    this.assertDiscountValue(dto.discountType, dto.discountValue);

    return this.promoRepo.save(
      this.promoRepo.create({
        businessId,
        code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount ?? null,
        maxUses: dto.maxUses ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        description: dto.description ?? null,
        isActive: true,
      }),
    );
  }

  async deactivate(businessId: string, id: string) {
    const promo = await this.promoRepo.findOne({ where: { id, businessId } });
    if (!promo) throw new NotFoundException('Promo code not found');
    promo.isActive = false;
    return this.promoRepo.save(promo);
  }

  async findValidForCheckout(
    businessId: string,
    code: string,
    orderAmount: number,
  ): Promise<PromoCode> {
    const normalized = code.trim().toUpperCase();
    const promo = await this.promoRepo.findOne({ where: { businessId, code: normalized } });
    if (!promo) throw new BadRequestException('Invalid promo code');
    if (!promo.isActive) throw new BadRequestException('Promo code is no longer active');
    if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Promo code has expired');
    }
    if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException('Promo code has reached its usage limit');
    }
    if (promo.minOrderAmount != null && orderAmount < Number(promo.minOrderAmount)) {
      throw new BadRequestException(
        `Minimum order amount is ${Number(promo.minOrderAmount)}`,
      );
    }
    return promo;
  }

  calculateDiscount(promo: PromoCode, amount: number): number {
    const base = Math.max(0, amount);
    let discount = 0;
    if (promo.discountType === PromoDiscountType.PERCENT) {
      discount = Math.round(base * (Number(promo.discountValue) / 100) * 100) / 100;
    } else {
      discount = Number(promo.discountValue);
    }
    return Math.min(base, Math.max(0, discount));
  }

  async recordUse(promoId: string) {
    await this.promoRepo.increment({ id: promoId }, 'usedCount', 1);
  }

  private assertDiscountValue(type: PromoDiscountType, value: number) {
    if (value <= 0) throw new BadRequestException('Discount value must be positive');
    if (type === PromoDiscountType.PERCENT && value > 100) {
      throw new BadRequestException('Percent discount cannot exceed 100');
    }
  }
}
