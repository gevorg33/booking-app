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
import { resolvePublicPaymentSettings } from '../../common/utils/customer-self-service.util.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { GiftCardClaimService } from './gift-card-claim.service.js';
import { CustomerService } from '../customer/customer.service.js';

export interface PurchaseGiftCardInput {
  cardType: GiftCardType;
  amount?: number;
  serviceId?: string;
  serviceIds?: string[];
  bundleId?: string;
  packageId?: string;
  subscriptionPlanId?: string;
  deliveryMethod: 'digital' | 'physical';
  buyForSelf?: boolean;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  purchaserEmail: string;
  purchaserName?: string;
  personalMessage?: string;
  shippingAddress?: GiftCardShippingAddress;
  shippingMethodId?: string;
  purchaserCustomerId?: string;
  paymentMethod?: 'online' | 'cash';
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
    private packagesService: ServicePackagesService,
    private subscriptionsService: ServiceSubscriptionsService,
    private claimService: GiftCardClaimService,
    private customerService: CustomerService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getPublicCatalog(businessId: string) {
    const business = await this.findBusiness(businessId);
    const settings = readBusinessGiftCardSettings(business.settings);
    if (!settings.purchaseEnabled) {
      return { purchaseEnabled: false, settings: null };
    }

    const [purchasablePackages, purchasableSubscriptionPlans] = await Promise.all([
      this.buildPublicPackageCatalog(businessId, settings),
      this.buildPublicSubscriptionPlanCatalog(businessId, settings),
    ]);

    return {
      purchaseEnabled: true,
      settings: {
        digitalDeliveryEnabled: settings.digitalDeliveryEnabled,
        physicalDeliveryEnabled: settings.physicalDeliveryEnabled,
        presetAmounts: settings.presetAmounts,
        purchasableServices: settings.purchasableServices,
        purchasablePackages,
        purchasableSubscriptionPlans,
        bundles: settings.bundles,
        shippingMethods: settings.physicalDeliveryEnabled ? settings.shippingMethods : [],
        cancelModifyEnabled: settings.cancelModifyEnabled,
        cancelModifyWindowHours: settings.cancelModifyWindowHours,
        physicalCancelBeforeReady: settings.physicalCancelBeforeReady,
        acceptCashPayments: resolvePublicPaymentSettings(business.settings).acceptCashPayments,
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
    const wantsCash = input.paymentMethod === 'cash';
    if (wantsCash) {
      if (!resolvePublicPaymentSettings(business.settings).acceptCashPayments) {
        throw new BadRequestException('Cash payment is not accepted for gift card purchases');
      }
      if (stripeSessionId) {
        throw new BadRequestException('Cash gift card purchases cannot include an online payment session');
      }
    }

    const quote = await this.quotePurchase(businessId, input);

    const purchaserCustomerId = await this.resolvePurchaserCustomerId(businessId, input);

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
        purchaserName: input.purchaserName?.trim() || null,
        personalMessage: input.personalMessage ?? null,
        shippingAddress: input.shippingAddress ?? null,
        shippingMethod: input.shippingMethodId ?? null,
        purchaseAmount: quote.total,
        shippingFee: quote.shippingFee,
        serviceId:
          quote.cardType === 'service' ? (this.normalizePurchasableServiceIds(input)[0] ?? null) : null,
        packageId: quote.cardType === 'package' ? (input.packageId ?? null) : null,
        subscriptionPlanId:
          quote.cardType === 'subscription' ? (input.subscriptionPlanId ?? null) : null,
        purchaserCustomerId,
        codeRevealed: !isPhysical,
        stripeSessionId: wantsCash ? null : stripeSessionId ?? null,
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

    let savedCard = card;
    if (
      input.buyForSelf &&
      purchaserCustomerId &&
      !isPhysical &&
      (card.cardType === 'package' || card.cardType === 'subscription')
    ) {
      await this.claimService.claimCard(businessId, card, purchaserCustomerId);
      savedCard =
        (await this.giftCardRepo.findOne({ where: { id: card.id }, relations: { serviceCredits: true } })) ??
        card;
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
        stripeSessionId: wantsCash ? null : stripeSessionId,
        paymentMethod: wantsCash ? 'cash' : 'online',
        recipientName: card.recipientName,
        isPhysical,
      },
    });

    return savedCard;
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

    if (input.cardType === 'package') {
      if (!input.packageId) throw new BadRequestException('packageId is required');
      const pkg = await this.packagesService.assertPackageBookable(businessId, input.packageId);
      const preview = this.packagesService.previewFromPackage(pkg);
      const pricing = this.resolvePackageGiftPricing(
        settings,
        input.packageId,
        Number(preview.pricing.packagePrice),
      );
      if (!pricing.allowed) throw new BadRequestException('Package is not available as a gift card');
      return {
        cardType: 'package',
        subtotal: pricing.subtotal,
        label: `${pkg.name} package gift card`,
      };
    }

    if (input.cardType === 'subscription') {
      if (!input.subscriptionPlanId) {
        throw new BadRequestException('subscriptionPlanId is required');
      }
      const preview = await this.subscriptionsService.previewPlanPricing(
        businessId,
        input.subscriptionPlanId,
      );
      const pricing = this.resolveSubscriptionGiftPricing(
        settings,
        input.subscriptionPlanId,
        Number(preview.pricing.subscriptionPrice),
      );
      if (!pricing.allowed) {
        throw new BadRequestException('Subscription plan is not available as a gift card');
      }
      return {
        cardType: 'subscription',
        subtotal: pricing.subtotal,
        label: `${preview.plan.name} subscription gift card`,
      };
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

  private resolvePackageGiftPricing(
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
    packageId: string,
    defaultPrice: number,
  ): { allowed: boolean; subtotal: number } {
    const entries = settings.purchasablePackages;
    if (entries.length === 0) {
      return { allowed: true, subtotal: defaultPrice };
    }
    const configured = entries.find((p) => p.packageId === packageId);
    if (!configured) return { allowed: false, subtotal: 0 };
    return {
      allowed: true,
      subtotal: Number(configured.price ?? defaultPrice),
    };
  }

  private resolveSubscriptionGiftPricing(
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
    planId: string,
    defaultPrice: number,
  ): { allowed: boolean; subtotal: number } {
    const entries = settings.purchasableSubscriptionPlans;
    if (entries.length === 0) {
      return { allowed: true, subtotal: defaultPrice };
    }
    const configured = entries.find((p) => p.planId === planId);
    if (!configured) return { allowed: false, subtotal: 0 };
    return {
      allowed: true,
      subtotal: Number(configured.price ?? defaultPrice),
    };
  }

  private async listPackageGiftEntries(
    businessId: string,
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
  ) {
    const configured = settings.purchasablePackages;
    if (configured.length > 0) return configured;
    const publicPackages = await this.packagesService.listPublicPackages(businessId);
    return publicPackages.map((pkg) => ({ packageId: pkg.id, price: null }));
  }

  private async listSubscriptionGiftEntries(
    businessId: string,
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
  ) {
    const configured = settings.purchasableSubscriptionPlans;
    if (configured.length > 0) return configured;
    const plans = await this.subscriptionsService.listPlans(businessId);
    return plans.filter((plan) => plan.isActive).map((plan) => ({ planId: plan.id, price: null }));
  }

  private async buildPublicPackageCatalog(
    businessId: string,
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
  ) {
    const results: Array<{
      packageId: string;
      price: number | null;
      name: string;
      packagePrice: number;
      regularTotal: number;
      savingsPercent: number;
      itemSummary: string;
      currency: string;
    }> = [];

    const entries = await this.listPackageGiftEntries(businessId, settings);
    for (const entry of entries) {
      try {
        const pkg = await this.packagesService.getPublicPackage(businessId, entry.packageId);
        const pricing = this.resolvePackageGiftPricing(
          settings,
          entry.packageId,
          Number(pkg.pricing.packagePrice),
        );
        if (!pricing.allowed) continue;
        results.push({
          packageId: entry.packageId,
          price: entry.price != null ? Number(entry.price) : null,
          name: pkg.name,
          packagePrice: pricing.subtotal,
          regularTotal: Number(pkg.pricing.regularTotal),
          savingsPercent: Number(pkg.pricing.savingsPercent),
          itemSummary: pkg.items
            .map((item) => `${item.serviceName} × ${item.quantity}`)
            .join(' · '),
          currency: pkg.currency,
        });
      } catch {
        // Skip packages that are no longer bookable
      }
    }
    return results;
  }

  private async buildPublicSubscriptionPlanCatalog(
    businessId: string,
    settings: ReturnType<typeof readBusinessGiftCardSettings>,
  ) {
    const results: Array<{
      planId: string;
      price: number | null;
      name: string;
      serviceName: string;
      includedAppointments: number;
      durationMonths: number;
      subscriptionPrice: number;
      regularTotal: number;
      savings: number;
      savingsPercent: number;
      currency: string;
    }> = [];

    const activePlans = await this.subscriptionsService.listPlans(businessId);
    const planById = new Map(activePlans.map((plan) => [plan.id, plan]));
    const entries = await this.listSubscriptionGiftEntries(businessId, settings);

    for (const entry of entries) {
      const match = planById.get(entry.planId);
      if (!match?.isActive) continue;
      try {
        const preview = await this.subscriptionsService.previewPlanPricing(businessId, entry.planId);
        const pricing = this.resolveSubscriptionGiftPricing(
          settings,
          entry.planId,
          Number(preview.pricing.subscriptionPrice),
        );
        if (!pricing.allowed) continue;
        const regularTotal = Number(preview.pricing.regularTotal);
        const savings = Number(preview.pricing.savings);
        const savingsPercent =
          regularTotal > 0 ? Math.round((savings / regularTotal) * 100) : 0;
        results.push({
          planId: entry.planId,
          price: entry.price != null ? Number(entry.price) : null,
          name: preview.plan.name,
          serviceName: match.service?.name ?? '',
          includedAppointments: preview.plan.includedAppointments,
          durationMonths: preview.plan.durationMonths,
          subscriptionPrice: pricing.subtotal,
          regularTotal,
          savings,
          savingsPercent,
          currency: match.service?.currency ?? 'USD',
        });
      } catch {
        // Skip inactive or missing plans
      }
    }
    return results;
  }

  async linkGuestPurchasesToCustomer(
    businessId: string,
    customerId: string,
    email: string,
  ): Promise<void> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;

    await this.giftCardRepo
      .createQueryBuilder()
      .update(GiftCard)
      .set({ purchaserCustomerId: customerId })
      .where('business_id = :businessId', { businessId })
      .andWhere('purchaser_customer_id IS NULL')
      .andWhere('LOWER(purchaser_email) = :email', { email: normalized })
      .execute();
  }

  private async resolvePurchaserCustomerId(
    businessId: string,
    input: PurchaseGiftCardInput,
  ): Promise<string | null> {
    if (input.purchaserCustomerId) return input.purchaserCustomerId;

    const email = input.purchaserEmail?.trim();
    if (!email) return null;

    const name =
      input.purchaserName?.trim() ||
      email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() ||
      'Guest';

    const { customer } = await this.customerService.findOrCreateByContact(businessId, {
      name,
      email,
    });
    return customer.id;
  }

  private async findBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }
}
