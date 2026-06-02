import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingCheckoutDraft } from './entities/booking-checkout-draft.entity.js';
import { Service, PrepaymentMode } from '../service/entities/service.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { StripeService } from '../billing/stripe.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { CustomerService } from '../customer/customer.service.js';
import { BookingService } from './booking.service.js';
import { CreatePublicBookingDto } from '../public-booking/dto/public-booking.dto.js';
import { PaymentStatus } from './entities/booking.entity.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import { CheckoutPricingService } from '../promo-codes/checkout-pricing.service.js';
import type { CheckoutPricingResult } from '../promo-codes/checkout-pricing.types.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { resolveEarnPercentForService } from '../loyalty/loyalty-settings.util.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import {
  resolvePublicCheckoutKind,
  buildSubscriptionLineItem,
  buildPackageLineItem,
  buildMultiServiceLineItem,
} from '../../common/utils/subscription-checkout.util.js';
import { BookPublicPackageDto, BookPublicMultiServiceDto } from '../public-booking/dto/public-booking.dto.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { GiftCardPurchaseService, type PurchaseGiftCardInput } from '../gift-cards/gift-card-purchase.service.js';
import { GiftCardDeliveryService } from '../gift-cards/gift-card-delivery.service.js';

interface StripeCheckoutSession {
  id?: string;
  metadata?: Record<string, string> | null;
  status?: string | null;
  payment_status?: string | null;
}

@Injectable()
export class BookingPaymentService {
  private readonly logger = new Logger(BookingPaymentService.name);

  constructor(
    @InjectRepository(BookingCheckoutDraft)
    private draftRepo: Repository<BookingCheckoutDraft>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private stripeService: StripeService,
    private stripeIntegrationService: StripeIntegrationService,
    private customerService: CustomerService,
    private bookingService: BookingService,
    private eventStore: EventStoreService,
    @Inject(forwardRef(() => PublicBookingService))
    private publicBookingService: PublicBookingService,
    private checkoutPricingService: CheckoutPricingService,
    private subscriptionsService: ServiceSubscriptionsService,
    private packagesService: ServicePackagesService,
    private multiServiceBookingsService: MultiServiceBookingsService,
    @Inject(forwardRef(() => GiftCardPurchaseService))
    private giftCardPurchaseService: GiftCardPurchaseService,
    @Inject(forwardRef(() => GiftCardDeliveryService))
    private giftCardDeliveryService: GiftCardDeliveryService,
  ) {}

  calculatePrepaymentAmount(service: Service): number {
    const price = Number(service.price);
    if (service.prepaymentMode === PrepaymentMode.FULL) {
      return price;
    }
    if (service.prepaymentMode === PrepaymentMode.DEPOSIT) {
      if (service.depositAmount != null && Number(service.depositAmount) > 0) {
        return Math.min(Number(service.depositAmount), price);
      }
      return Math.round(price * 50) / 100;
    }
    return 0;
  }

  requiresPrepayment(service: Service): boolean {
    return (
      service.prepaymentMode !== PrepaymentMode.NONE &&
      this.calculatePrepaymentAmount(service) > 0
    );
  }

  pricingMetadata(pricing: CheckoutPricingResult) {
    return {
      pricing: {
        servicePrice: pricing.servicePrice,
        subtotal: pricing.subtotal,
        promoDiscount: pricing.promoDiscount,
        giftCardDiscount: pricing.giftCardDiscount,
        loyaltyDiscount: pricing.loyaltyDiscount,
        totalDiscount: pricing.totalDiscount,
        amountDue: pricing.amountDue,
        loyaltyPointsRedeemed: pricing.loyaltyPointsToRedeem,
        promoCode: pricing.promoCode ?? null,
        promoCodeId: pricing.promoCodeId ?? null,
        giftCardCode: pricing.giftCardCode ?? null,
        giftCardId: pricing.giftCardId ?? null,
        pointsToEarn: pricing.pointsToEarn,
        adjustments: pricing.adjustments,
      },
      amountPaid: pricing.amountDue,
      cashPaidEligible: pricing.amountDue,
    };
  }

  async resolvePackageCheckoutPricing(
    businessId: string,
    packageId: string,
    dto: Pick<BookPublicPackageDto, 'promoCode' | 'loyaltyPointsToRedeem'>,
    customerId?: string,
  ) {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    const preview = await this.packagesService.previewPackagePricing(businessId, packageId);
    const packagePrice = preview.pricing.packagePrice;

    return this.checkoutPricingService.calculate({
      businessId,
      servicePrice: packagePrice,
      prepaymentAmount: packagePrice,
      currency: preview.currency,
      promoCode: dto.promoCode,
      loyaltyPointsToRedeem: dto.loyaltyPointsToRedeem,
      customerId,
      earnPercentCashback: resolveEarnPercentForService(business?.settings, packageId),
    });
  }

  async createPackageCheckoutSession(
    slug: string,
    dto: BookPublicPackageDto,
    authenticatedCustomerId?: string,
  ) {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Online payments are not configured on the server');
    }

    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = await this.stripeIntegrationService.assertCanAcceptOnlinePayments(
      business.id,
    );

    const pricing = await this.resolvePackageCheckoutPricing(
      business.id,
      dto.packageId,
      dto,
      authenticatedCustomerId,
    );

    if (pricing.amountDue <= 0) {
      throw new BadRequestException(
        'No payment is due after discounts. Confirm booking without checkout.',
      );
    }

    const preview = await this.packagesService.previewPackagePricing(business.id, dto.packageId);
    const line = buildPackageLineItem(preview.package.name, dto.lines.length);

    if (!dto.customer.email && !dto.customer.phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    const draftPayload = {
      ...dto,
      metadata: {
        ...(dto.metadata || {}),
        ...(authenticatedCustomerId ? { authenticatedCustomerId } : {}),
        checkoutPricing: pricing,
        checkoutKind: 'package_purchase',
        packageId: dto.packageId,
      },
    };

    const draft = await this.draftRepo.save(
      this.draftRepo.create({
        businessId: business.id,
        payload: draftPayload as unknown as Record<string, unknown>,
        amount: pricing.amountDue,
        currency: preview.currency,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        stripeConnectAccountId: connectAccountId,
      }),
    );

    const frontendUrl = this.stripeService.frontendUrl;
    const checkoutQuery = new URLSearchParams({
      paid: '1',
      packageId: dto.packageId,
    });

    const [sessionParams, connectOpts] = this.stripeService.connectCheckoutSessionCreate(
      connectAccountId,
      {
        mode: 'payment',
        customer_email: dto.customer.email || undefined,
        line_items: [
          {
            price_data: {
              currency: preview.currency.toLowerCase(),
              unit_amount: Math.round(pricing.amountDue * 100),
              product_data: {
                name: line.name,
                description: line.description,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'booking_payment',
          draftId: draft.id,
          businessId: business.id,
          slug,
          connectAccountId,
          checkoutKind: 'package_purchase',
        },
        success_url: `${frontendUrl}/book/${slug}/packages/${dto.packageId}/checkout?${checkoutQuery.toString()}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/book/${slug}/packages/${dto.packageId}/checkout?canceled=1`,
      },
      business.settings,
      Math.round(pricing.amountDue * 100),
    );

    const session = await this.stripeService.client.checkout.sessions.create(
      sessionParams,
      connectOpts,
    );

    if (!session.url) {
      throw new BadRequestException('Failed to create payment session');
    }

    draft.stripeSessionId = session.id;
    await this.draftRepo.save(draft);

    return {
      url: session.url,
      sessionId: session.id,
      amount: pricing.amountDue,
      currency: preview.currency,
    };
  }

  async createGiftCardCheckoutSession(
    slug: string,
    dto: PurchaseGiftCardInput,
    authenticatedCustomerId?: string,
  ) {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Online payments are not configured on the server');
    }

    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = await this.stripeIntegrationService.assertCanAcceptOnlinePayments(
      business.id,
    );

    const quote = await this.giftCardPurchaseService.quotePurchase(business.id, dto);
    if (quote.total <= 0) {
      throw new BadRequestException('Gift card total must be greater than zero');
    }
    if (!dto.purchaserEmail?.trim()) {
      throw new BadRequestException('Purchaser email is required');
    }

    const draftPayload = {
      ...dto,
      metadata: {
        checkoutKind: 'gift_card_purchase',
        ...(authenticatedCustomerId ? { authenticatedCustomerId } : {}),
      },
    };

    const draft = await this.draftRepo.save(
      this.draftRepo.create({
        businessId: business.id,
        payload: draftPayload as unknown as Record<string, unknown>,
        amount: quote.total,
        currency: quote.currency,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        stripeConnectAccountId: connectAccountId,
      }),
    );

    const frontendUrl = this.stripeService.frontendUrl;
    const lineItems = [
      {
        price_data: {
          currency: quote.currency.toLowerCase(),
          unit_amount: Math.round(quote.subtotal * 100),
          product_data: { name: quote.label },
        },
        quantity: 1,
      },
    ];
    if (quote.shippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: quote.currency.toLowerCase(),
          unit_amount: Math.round(quote.shippingFee * 100),
          product_data: { name: 'Gift card shipping' },
        },
        quantity: 1,
      });
    }

    const [sessionParams, connectOpts] = this.stripeService.connectCheckoutSessionCreate(
      connectAccountId,
      {
        mode: 'payment',
        customer_email: dto.purchaserEmail.trim(),
        line_items: lineItems,
        metadata: {
          type: 'booking_payment',
          draftId: draft.id,
          businessId: business.id,
          slug,
          connectAccountId,
          checkoutKind: 'gift_card_purchase',
        },
        success_url: `${frontendUrl}/book/${slug}/gift-cards/checkout?paid=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/book/${slug}/gift-cards/checkout?canceled=1`,
      },
      business.settings,
      Math.round(quote.total * 100),
    );

    const session = await this.stripeService.client.checkout.sessions.create(
      sessionParams,
      connectOpts,
    );

    if (!session.url) throw new BadRequestException('Failed to create payment session');

    draft.stripeSessionId = session.id;
    await this.draftRepo.save(draft);

    return { url: session.url, sessionId: session.id, draftId: draft.id, total: quote.total };
  }

  async resolveMultiServiceCheckoutPricing(
    businessId: string,
    serviceIds: string[],
    dto: Pick<BookPublicMultiServiceDto, 'promoCode' | 'loyaltyPointsToRedeem'>,
    customerId?: string,
  ) {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    const preview = await this.multiServiceBookingsService.previewTotals(businessId, serviceIds);
    const totalPrice = preview.totals!.totalPrice;
    const currency = preview.totals!.currency;

    return this.checkoutPricingService.calculate({
      businessId,
      servicePrice: totalPrice,
      prepaymentAmount: totalPrice,
      currency,
      promoCode: dto.promoCode,
      loyaltyPointsToRedeem: dto.loyaltyPointsToRedeem,
      customerId,
      earnPercentCashback: resolveEarnPercentForService(business?.settings, serviceIds[0]),
    });
  }

  async createMultiServiceCheckoutSession(
    slug: string,
    dto: BookPublicMultiServiceDto,
    authenticatedCustomerId?: string,
  ) {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Online payments are not configured on the server');
    }

    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = await this.stripeIntegrationService.assertCanAcceptOnlinePayments(
      business.id,
    );

    const pricing = await this.resolveMultiServiceCheckoutPricing(
      business.id,
      dto.serviceIds,
      dto,
      authenticatedCustomerId,
    );

    if (pricing.amountDue <= 0) {
      throw new BadRequestException(
        'No payment is due after discounts. Confirm booking without checkout.',
      );
    }

    const preview = await this.multiServiceBookingsService.previewTotals(business.id, dto.serviceIds);
    const line = buildMultiServiceLineItem(dto.serviceIds.length);

    if (!dto.customer.email && !dto.customer.phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    const draftPayload = {
      ...dto,
      metadata: {
        ...(dto.metadata || {}),
        ...(authenticatedCustomerId ? { authenticatedCustomerId } : {}),
        checkoutPricing: pricing,
        checkoutKind: 'multi_service_booking',
        serviceIds: dto.serviceIds,
      },
    };

    const draft = await this.draftRepo.save(
      this.draftRepo.create({
        businessId: business.id,
        payload: draftPayload as unknown as Record<string, unknown>,
        amount: pricing.amountDue,
        currency: preview.totals!.currency,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        stripeConnectAccountId: connectAccountId,
      }),
    );

    const frontendUrl = this.stripeService.frontendUrl;
    const checkoutQuery = new URLSearchParams({
      paid: '1',
      services: dto.serviceIds.join(','),
    });

    const [sessionParams, connectOpts] = this.stripeService.connectCheckoutSessionCreate(
      connectAccountId,
      {
        mode: 'payment',
        customer_email: dto.customer.email || undefined,
        line_items: [
          {
            price_data: {
              currency: preview.totals!.currency.toLowerCase(),
              unit_amount: Math.round(pricing.amountDue * 100),
              product_data: {
                name: line.name,
                description: line.description,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'booking_payment',
          draftId: draft.id,
          businessId: business.id,
          slug,
          connectAccountId,
          checkoutKind: 'multi_service_booking',
        },
        success_url: `${frontendUrl}/book/${slug}/multi/checkout?${checkoutQuery.toString()}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/book/${slug}/multi/checkout?canceled=1&services=${encodeURIComponent(dto.serviceIds.join(','))}`,
      },
      business.settings,
      Math.round(pricing.amountDue * 100),
    );

    const session = await this.stripeService.client.checkout.sessions.create(
      sessionParams,
      connectOpts,
    );

    if (!session.url) {
      throw new BadRequestException('Failed to create payment session');
    }

    draft.stripeSessionId = session.id;
    await this.draftRepo.save(draft);

    return {
      url: session.url,
      sessionId: session.id,
      amount: pricing.amountDue,
      currency: preview.totals!.currency,
    };
  }

  async resolveCheckoutPricing(
    businessId: string,
    service: Service,
    dto: CreatePublicBookingDto,
    customerId?: string,
  ) {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    let chargeBase: number;
    let servicePrice = Number(service.price);

    if (dto.purchasePlanId) {
      const planCheckout = await this.subscriptionsService.getPlanCheckoutDetails(
        businessId,
        dto.purchasePlanId,
      );
      chargeBase = planCheckout.amount;
      servicePrice = planCheckout.amount;
    } else {
      const prepaymentAmount = this.calculatePrepaymentAmount(service);
      chargeBase = prepaymentAmount > 0 ? prepaymentAmount : Number(service.price);
    }

    return this.checkoutPricingService.calculate({
      businessId,
      servicePrice,
      prepaymentAmount: chargeBase,
      currency: service.currency || 'USD',
      promoCode: dto.promoCode,
      loyaltyPointsToRedeem: dto.loyaltyPointsToRedeem,
      customerId,
      earnPercentCashback: resolveEarnPercentForService(business?.settings, service.id),
    });
  }

  async createCheckoutSession(
    slug: string,
    dto: CreatePublicBookingDto,
    authenticatedCustomerId?: string,
  ): Promise<{ url: string; sessionId: string; amount: number; currency: string }> {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Online payments are not configured on the server');
    }

    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = await this.stripeIntegrationService.assertCanAcceptOnlinePayments(
      business.id,
    );

    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId, businessId: business.id, isActive: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    const checkoutKind = resolvePublicCheckoutKind(dto);
    if (checkoutKind === 'subscription_purchase' && !dto.purchasePlanId) {
      throw new BadRequestException('purchasePlanId is required');
    }

    const pricing = await this.resolveCheckoutPricing(
      business.id,
      service,
      dto,
      authenticatedCustomerId,
    );

    if (pricing.amountDue <= 0) {
      throw new BadRequestException(
        'No payment is due after discounts. Confirm booking without checkout.',
      );
    }

    let currency = service.currency || 'USD';
    let lineItemName = service.name;
    let lineItemDescription =
      service.prepaymentMode === PrepaymentMode.DEPOSIT
        ? `Deposit for ${service.name}`
        : service.name;

    if (checkoutKind === 'subscription_purchase') {
      const planCheckout = await this.subscriptionsService.getPlanCheckoutDetails(
        business.id,
        dto.purchasePlanId!,
      );
      currency = planCheckout.currency;
      const line = buildSubscriptionLineItem(
        planCheckout.planName,
        planCheckout.includedAppointments,
        planCheckout.durationMonths,
      );
      lineItemName = line.name;
      lineItemDescription = line.description;
    } else if (this.calculatePrepaymentAmount(service) <= 0) {
      throw new BadRequestException('This service does not require online payment');
    }

    const amount = pricing.amountDue;

    if (!dto.customer.email && !dto.customer.phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    const draftPayload: CreatePublicBookingDto = {
      ...dto,
      metadata: {
        ...(dto.metadata || {}),
        ...(authenticatedCustomerId ? { authenticatedCustomerId } : {}),
        checkoutPricing: pricing,
        checkoutKind,
      },
    };

    const draft = await this.draftRepo.save(
      this.draftRepo.create({
        businessId: business.id,
        payload: draftPayload as unknown as Record<string, unknown>,
        amount,
        currency,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        stripeConnectAccountId: connectAccountId,
      }),
    );

    const frontendUrl = this.stripeService.frontendUrl;
    const checkoutQuery = new URLSearchParams({
      paid: '1',
      serviceId: dto.serviceId,
      startTime: dto.startTime,
    });
    if (dto.employeeId) {
      checkoutQuery.set('employeeId', dto.employeeId);
    } else {
      checkoutQuery.set('autoAssign', '1');
    }

    const [sessionParams, connectOpts] = this.stripeService.connectCheckoutSessionCreate(
      connectAccountId,
      {
        mode: 'payment',
        customer_email: dto.customer.email || undefined,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: Math.round(amount * 100),
              product_data: {
                name: lineItemName,
                description: lineItemDescription,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'booking_payment',
          draftId: draft.id,
          businessId: business.id,
          slug,
          connectAccountId,
          checkoutKind,
        },
        success_url: `${frontendUrl}/book/${slug}/checkout?${checkoutQuery.toString()}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/book/${slug}/checkout?canceled=1&serviceId=${encodeURIComponent(dto.serviceId)}&startTime=${encodeURIComponent(dto.startTime)}${dto.employeeId ? `&employeeId=${encodeURIComponent(dto.employeeId)}` : '&autoAssign=1'}`,
      },
      business.settings,
      Math.round(amount * 100),
    );

    const session = await this.stripeService.client.checkout.sessions.create(
      sessionParams,
      connectOpts,
    );

    if (!session.url) {
      throw new BadRequestException('Failed to create payment session');
    }

    draft.stripeSessionId = session.id;
    await this.draftRepo.save(draft);

    return {
      url: session.url,
      sessionId: session.id,
      amount,
      currency: service.currency || 'USD',
    };
  }

  async confirmCheckoutSession(slug: string, sessionId: string) {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured');
    }

    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = this.stripeIntegrationService.resolveConnectAccountId(
      business.settings,
    );
    if (!connectAccountId) {
      throw new BadRequestException('Stripe is not connected for this business');
    }

    const session = await this.stripeService.client.checkout.sessions.retrieve(
      sessionId,
      {},
      this.stripeService.connectRequestOptions(connectAccountId, business.settings),
    );
    if (session.metadata?.type !== 'booking_payment' || session.metadata.slug !== slug) {
      throw new BadRequestException('Invalid payment session');
    }

    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      throw new BadRequestException('Payment is not complete yet');
    }

    return this.fulfillDraft(session.metadata.draftId!, sessionId);
  }

  async handleCheckoutCompleted(session: StripeCheckoutSession): Promise<void> {
    if (session.metadata?.type !== 'booking_payment' || !session.metadata.draftId) {
      return;
    }

    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      return;
    }

    await this.fulfillDraft(session.metadata.draftId, session.id ?? 'unknown');
  }

  private async fulfillDraft(draftId: string, sessionId: string) {
    const draft = await this.draftRepo.findOne({ where: { id: draftId } });
    if (!draft) {
      this.logger.warn(`Checkout draft ${draftId} not found`);
      return { alreadyCompleted: true };
    }

    if (draft.status === 'completed') {
      return { alreadyCompleted: true };
    }

    const dto = draft.payload as unknown as CreatePublicBookingDto;
    const business = await this.businessRepo.findOne({ where: { id: draft.businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const authenticatedCustomerId =
      typeof dto.metadata?.authenticatedCustomerId === 'string'
        ? dto.metadata.authenticatedCustomerId
        : undefined;

    const checkoutKind =
      typeof dto.metadata?.checkoutKind === 'string'
        ? dto.metadata.checkoutKind
        : resolvePublicCheckoutKind(dto);

    if (checkoutKind === 'package_purchase') {
      const packageDto = dto as unknown as BookPublicPackageDto;
      const result = await this.publicBookingService.bookPackage(
        business.slug,
        { ...packageDto, markPaid: true },
        authenticatedCustomerId,
      );

      draft.status = 'completed';
      draft.stripeSessionId = sessionId;
      await this.draftRepo.save(draft);

      await this.eventStore.publish({
        eventType: EventType.PAYMENT_RECEIVED,
        aggregateType: 'package_purchase',
        aggregateId: result.packagePurchase.id,
        businessId: business.id,
        payload: {
          packageId: packageDto.packageId,
          customerId: result.customer.id,
          amount: Number(draft.amount),
          currency: draft.currency,
          stripeSessionId: sessionId,
          source: 'package_purchase',
        },
      });

      return {
        alreadyCompleted: false,
        packagePurchase: result.packagePurchase,
        bookings: result.bookings,
        customer: result.customer,
      };
    }

    if (checkoutKind === 'multi_service_booking') {
      const multiDto = dto as unknown as BookPublicMultiServiceDto;
      const result = await this.publicBookingService.bookMultiService(
        business.slug,
        { ...multiDto, markPaid: true },
        authenticatedCustomerId,
      );

      draft.status = 'completed';
      draft.stripeSessionId = sessionId;
      await this.draftRepo.save(draft);

      await this.eventStore.publish({
        eventType: EventType.PAYMENT_RECEIVED,
        aggregateType: 'multi_service_booking_group',
        aggregateId: result.multiServiceGroup.id,
        businessId: business.id,
        payload: {
          multiServiceGroupId: result.multiServiceGroup.id,
          customerId: result.customer.id,
          amount: Number(draft.amount),
          currency: draft.currency,
          stripeSessionId: sessionId,
          source: 'multi_service_booking',
        },
      });

      return {
        alreadyCompleted: false,
        multiServiceGroup: result.multiServiceGroup,
        bookings: result.bookings,
        customer: result.customer,
      };
    }

    if (checkoutKind === 'gift_card_purchase') {
      const purchaseDto = dto as unknown as PurchaseGiftCardInput;
      const card = await this.giftCardPurchaseService.fulfillPurchase(
        business.id,
        {
          ...purchaseDto,
          purchaserCustomerId:
            authenticatedCustomerId ?? purchaseDto.purchaserCustomerId,
        },
        sessionId,
      );

      draft.status = 'completed';
      draft.stripeSessionId = sessionId;
      await this.draftRepo.save(draft);

      return {
        alreadyCompleted: false,
        giftCard: card,
      };
    }

    const enrichedDto: CreatePublicBookingDto = {
      ...dto,
      markPaid: true,
      metadata: {
        ...(dto.metadata || {}),
        stripeSessionId: sessionId,
        stripeConnectAccountId: draft.stripeConnectAccountId,
        subscriptionPricePaid: dto.purchasePlanId ? Number(draft.amount) : undefined,
        prepaymentAmount: Number(draft.amount),
      },
    };

    const result = await this.publicBookingService.createBooking(
      business.slug,
      enrichedDto,
      authenticatedCustomerId,
    );

    draft.status = 'completed';
    draft.stripeSessionId = sessionId;
    await this.draftRepo.save(draft);

    await this.eventStore.publish({
      eventType: EventType.PAYMENT_RECEIVED,
      aggregateType: 'booking',
      aggregateId: result.booking.id,
      businessId: business.id,
      payload: {
        bookingId: result.booking.id,
        customerId: result.customer.id,
        amount: Number(draft.amount),
        currency: draft.currency,
        stripeSessionId: sessionId,
        source: dto.purchasePlanId ? 'subscription' : 'public_booking',
      },
    });

    if (dto.purchasePlanId) {
      await this.eventStore.publish({
        eventType: EventType.SUBSCRIPTION_PURCHASED,
        aggregateType: 'customer_subscription',
        aggregateId: dto.purchasePlanId,
        businessId: business.id,
        payload: {
          planId: dto.purchasePlanId,
          customerId: result.customer.id,
          bookingId: result.booking.id,
          amount: Number(draft.amount),
          currency: draft.currency,
        },
      });
    }

    return {
      alreadyCompleted: false,
      booking: result.booking,
      customer: result.customer,
    };
  }
}
