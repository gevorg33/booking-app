import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftCard } from './entities/gift-card.entity.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';

export interface GiftCardClaimResult {
  giftCardId: string;
  cardType: string;
  packagePurchaseId?: string;
  subscriptionId?: string;
}

@Injectable()
export class GiftCardClaimService {
  constructor(
    @InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>,
    private packagesService: ServicePackagesService,
    private subscriptionsService: ServiceSubscriptionsService,
  ) {}

  async claimByCode(
    businessId: string,
    code: string,
    customerId: string,
  ): Promise<GiftCardClaimResult> {
    const card = await this.giftCardRepo.findOne({
      where: { businessId, code: code.trim().toUpperCase() },
      relations: { serviceCredits: true },
    });
    if (!card) throw new NotFoundException('Gift card not found');
    return this.claimCard(businessId, card, customerId);
  }

  async claimCard(
    businessId: string,
    card: GiftCard,
    customerId: string,
  ): Promise<GiftCardClaimResult> {
    this.assertClaimable(card, customerId);

    if (card.cardType === 'service' || card.cardType === 'bundle') {
      if (card.claimedByCustomerId === customerId) {
        return { giftCardId: card.id, cardType: card.cardType };
      }
      await this.markLinked(card, customerId);
      return { giftCardId: card.id, cardType: card.cardType };
    }

    if (card.cardType === 'package') {
      if (!card.packageId) throw new BadRequestException('Gift card is missing package reference');
      const pkg = await this.packagesService.assertPackageBookable(businessId, card.packageId);
      const purchase = await this.packagesService.createPackagePurchase(
        businessId,
        pkg.id,
        customerId,
        Number(card.purchaseAmount ?? 0),
        card.currency,
      );
      await this.markClaimed(card, customerId);
      return {
        giftCardId: card.id,
        cardType: card.cardType,
        packagePurchaseId: purchase.id,
      };
    }

    if (card.cardType === 'subscription') {
      if (!card.subscriptionPlanId) {
        throw new BadRequestException('Gift card is missing subscription plan reference');
      }
      const subscription = await this.subscriptionsService.assignSubscription(
        businessId,
        customerId,
        card.subscriptionPlanId,
        { pricePaid: Number(card.purchaseAmount ?? 0), currency: card.currency },
      );
      await this.markClaimed(card, customerId);
      return {
        giftCardId: card.id,
        cardType: card.cardType,
        subscriptionId: subscription.id,
      };
    }

    throw new BadRequestException('This gift card cannot be claimed on your account');
  }

  private assertClaimable(card: GiftCard, customerId: string) {
    if (!card.isActive) throw new BadRequestException('Gift card is no longer active');
    if (card.claimedAt && (card.cardType === 'package' || card.cardType === 'subscription')) {
      throw new BadRequestException('Gift card has already been claimed');
    }
    if (!card.codeRevealed) {
      throw new BadRequestException('Gift card code is not yet active');
    }
    if (card.expiresAt && card.expiresAt < new Date()) {
      throw new BadRequestException('Gift card expired');
    }

    if (card.cardType === 'monetary') {
      throw new BadRequestException('Monetary gift cards are redeemed at booking checkout');
    }

    if (card.cardType === 'service' || card.cardType === 'bundle') {
      if (card.claimedByCustomerId && card.claimedByCustomerId !== customerId) {
        throw new BadRequestException('Gift card has already been claimed by another account');
      }
      const credits = card.serviceCredits ?? [];
      if (!credits.some((c) => c.quantityRemaining > 0)) {
        throw new BadRequestException('Gift card has no remaining service credits');
      }
    }
  }

  private async markClaimed(card: GiftCard, customerId: string) {
    card.claimedAt = new Date();
    card.claimedByCustomerId = customerId;
    card.isActive = false;
    await this.giftCardRepo.save(card);
  }

  private async markLinked(card: GiftCard, customerId: string) {
    card.claimedAt = new Date();
    card.claimedByCustomerId = customerId;
    await this.giftCardRepo.save(card);
  }
}
