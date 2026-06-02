import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { GiftCard } from './entities/gift-card.entity.js';
import { GiftCardServiceCredit } from './entities/gift-card-service-credit.entity.js';
import { generateGiftCardCode } from './gift-card-code.util.js';
import {
  readBusinessGiftCardSettings,
  type GiftCardBundleLine,
  type GiftCardShippingAddress,
  type GiftCardType,
} from './gift-card.types.js';
import { EventType } from '../../events/event-types.js';

export interface PurchaseGiftCardInput {
  cardType: GiftCardType;
  amount?: number;
  serviceId?: string;
  serviceIds?: string[];
  bundleId?: string;
  deliveryMethod: 'digital' | 'physical';
  buyForSelf?: boolean;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  purchaserEmail: string;
  personalMessage?: string;
  shippingAddress?: GiftCardShippingAddress;
  shippingMethodId?: string;
  purchaserCustomerId?: string;
}

export interface GiftCardPurchaseQuote {
  cardType: GiftCardType;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  label: string;
  bundleLines?: GiftCardBundleLine[];
}

@Injectable()
export class GiftCardPurchaseService {
  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>,
    @InjectRepository(GiftCardServiceCredit) private creditRepo: Repository<GiftCardServiceCredit>,
    private eventEmitter: EventEmitter2,
  ) {}

  async getPublicCatalog(businessId: string) {
    const business = await this.findBusiness(businessId);
    const settings = readBusinessGiftCardSettings(business.settings);
    if (!settings.purchaseEnabled) {
      return { purchaseEnabled: false, settings: null };
    }

    return {
      purchaseEnabled: true,
      settings: {
        digitalDeliveryEnabled: settings.digitalDeliveryEnabled,
        physicalDeliveryEnabled: settings.physicalDeliveryEnabled,
        presetAmounts: settings.presetAmounts,
        purchasableServices: settings.purchasableServices,
        bundles: settings.bundles,
        shippingMethods: settings.physicalDeliveryEnabled ? settings.shippingMethods : [],
        cancelModifyEnabled: settings.cancelModifyEnabled,
        cancelModifyWindowHours: settings.cancelModifyWindowHours,
        physicalCancelBeforeReady: settings.physicalCancelBeforeReady,
      },
    };
  }

  async quotePurchase(businessId: string, input: PurchaseGiftCardInput): Promise<GiftCardPurchaseQuote> {
    const business = await this.findBusiness(businessId);
    const settings = readBusinessGiftCardSettings(business.settings);
    if (!settings.purchaseEnabled) throw new BadRequestException('Gift card purchase is not enabled');

    this.assertDeliveryAllowed(settings, input.deliveryMethod);
    const quote = await this.resolveQuote(businessId, settings, input);

    const shippingFee =
      input.deliveryMethod === 'physical'
        ? this.resolveShippingFee(settings, input.shippingMethodId)
        : 0;

    return {
      ...quote,
      shippingFee,
      total: quote.subtotal + shippingFee,
      currency: business.settings?.currency?.toString?.() ?? 'USD',
    };
  }

  async fulfillPurchase(
    businessId: string,
    input: PurchaseGiftCardInput,
    stripeSessionId?: string,
  ): Promise<GiftCard> {
    const business = await this.findBusiness(businessId);
    const settings = readBusinessGiftCardSettings(business.settings);
    const quote = await this.quotePurchase(businessId, input);

    const expiresAt = settings.defaultExpiryMonths
      ? new Date(Date.now() + settings.defaultExpiryMonths * 30 * 24 * 60 * 60 * 1000)
      : null;

    const code = generateGiftCardCode(input.cardType);
    const isPhysical = input.deliveryMethod === 'physical';
    const fulfillmentStatus = isPhysical ? 'awaiting_card_creation' : 'pending';

    const card = await this.giftCardRepo.save(
      this.giftCardRepo.create({
        businessId,
        code,
        cardType: quote.cardType,
        initialBalance: input.cardType === 'monetary' ? quote.subtotal : 0,
        balance: input.cardType === 'monetary' ? quote.subtotal : 0,
        currency: quote.currency,
        expiresAt,
        isActive: true,
        deliveryMethod: input.deliveryMethod,
        fulfillmentStatus,
        recipientName: input.recipientName ?? null,
        recipientEmail: input.recipientEmail ?? null,
        recipientPhone: input.recipientPhone ?? null,
        purchaserEmail: input.purchaserEmail,
        personalMessage: input.personalMessage ?? null,
        shippingAddress: input.shippingAddress ?? null,
        shippingMethod: input.shippingMethodId ?? null,
        purchaseAmount: quote.total,
        shippingFee: quote.shippingFee,
        serviceId:
          quote.cardType === 'service' ? (this.normalizePurchasableServiceIds(input)[0] ?? null) : null,
        purchaserCustomerId: input.purchaserCustomerId ?? null,
        codeRevealed: !isPhysical,
        stripeSessionId: stripeSessionId ?? null,
        cardCreatorStaffId: settings.cardCreatorStaffIds[0] ?? null,
        deliveryStaffId: settings.deliveryStaffIds[0] ?? null,
      }),
    );

    if (quote.bundleLines?.length) {
      for (const line of quote.bundleLines) {
        await this.creditRepo.save(
          this.creditRepo.create({
            giftCardId: card.id,
            serviceId: line.serviceId,
            serviceName: line.serviceName,
            quantityTotal: line.quantity,
            quantityRemaining: line.quantity,
          }),
        );
      }
    } else if (input.cardType === 'service') {
      const serviceIds = this.normalizePurchasableServiceIds(input);
      const service = await this.serviceRepo.findOne({
        where: { id: serviceIds[0], businessId },
      });
      if (!service) throw new NotFoundException('Service not found');
      await this.creditRepo.save(
        this.creditRepo.create({
          giftCardId: card.id,
          serviceId: service.id,
          serviceName: service.name,
          quantityTotal: 1,
          quantityRemaining: 1,
        }),
      );
    }

    this.eventEmitter.emit(EventType.PAYMENT_RECEIVED, {
      eventType: EventType.PAYMENT_RECEIVED,
      aggregateType: 'gift_card_order',
      aggregateId: card.id,
      businessId,
      payload: {
        giftCardId: card.id,
        cardType: card.cardType,
        deliveryMethod: card.deliveryMethod,
        fulfillmentStatus: card.fulfillmentStatus,
        amount: quote.total,
        currency: quote.currency,
        stripeSessionId,
        recipientName: card.recipientName,
        isPhysical,
      },
    });

    return card;
  }

  async listCustomerOrders(businessId: string, purchaserCustomerId: string) {
    return this.giftCardRepo.find({
      where: { businessId, purchaserCustomerId },
      order: { createdAt: 'DESC' },
      relations: { serviceCredits: true },
    });
  }

  private async resolveQuote(
    businessId: string,
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
    input: PurchaseGiftCardInput,
  ): Promise<Omit<GiftCardPurchaseQuote, 'shippingFee' | 'total' | 'currency'>> {
    if (input.cardType === 'monetary') {
      const amount = Number(input.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new BadRequestException('Valid amount is required');
      }
      return { cardType: 'monetary', subtotal: amount, label: `Gift card $${amount}` };
    }

    if (input.cardType === 'service') {
      return this.buildServiceGiftQuote(businessId, settings, this.normalizePurchasableServiceIds(input));
    }

    if (!input.bundleId) throw new BadRequestException('bundleId is required');
    const bundle = settings.bundles.find((b) => b.id === input.bundleId);
    if (!bundle) throw new BadRequestException('Bundle is not available');
    return {
      cardType: 'bundle',
      subtotal: Number(bundle.price),
      label: `${bundle.name} bundle gift card`,
      bundleLines: bundle.lines,
    };
  }

  private normalizePurchasableServiceIds(input: PurchaseGiftCardInput): string[] {
    const fromList = (input.serviceIds ?? []).filter(Boolean);
    const ids = fromList.length > 0 ? fromList : input.serviceId ? [input.serviceId] : [];
    return [...new Set(ids)];
  }

  private async buildServiceGiftQuote(
    businessId: string,
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
    serviceIds: string[],
  ): Promise<Omit<GiftCardPurchaseQuote, 'shippingFee' | 'total' | 'currency'>> {
    if (!serviceIds.length) {
      throw new BadRequestException('At least one service is required');
    }

    const lines: GiftCardBundleLine[] = [];
    let subtotal = 0;
    const names: string[] = [];

    for (const id of serviceIds) {
      const configured = settings.purchasableServices.find((entry) => entry.serviceId === id);
      if (!configured) {
        throw new BadRequestException('Service is not available as a gift card');
      }
      const service = await this.serviceRepo.findOne({ where: { id, businessId } });
      if (!service) throw new NotFoundException('Service not found');
      const price = Number(configured.price ?? service.price);
      subtotal += price;
      names.push(service.name);
      lines.push({ serviceId: service.id, serviceName: service.name, quantity: 1 });
    }

    if (serviceIds.length === 1) {
      return {
        cardType: 'service',
        subtotal,
        label: `${names[0]} gift card`,
      };
    }

    return {
      cardType: 'bundle',
      subtotal,
      label: `${names.join(' + ')} gift card`,
      bundleLines: lines,
    };
  }

  private assertDeliveryAllowed(
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
    method: 'digital' | 'physical',
  ) {
    if (method === 'digital' && !settings.digitalDeliveryEnabled) {
      throw new BadRequestException('Digital delivery is not enabled');
    }
    if (method === 'physical' && !settings.physicalDeliveryEnabled) {
      throw new BadRequestException('Physical delivery is not enabled');
    }
    if (method === 'physical' && !settings.shippingMethods.length) {
      throw new BadRequestException('No shipping methods configured');
    }
  }

  private resolveShippingFee(
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
    methodId?: string,
  ): number {
    const method = settings.shippingMethods.find((m) => m.id === methodId) ?? settings.shippingMethods[0];
    if (!method) throw new BadRequestException('Shipping method is required');
    return Number(method.fee);
  }

  private async findBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }
}
