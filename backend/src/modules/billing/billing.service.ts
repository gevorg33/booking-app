import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { StripeService } from './stripe.service.js';
import { getActivePlans, getPlan } from './plans.js';
import {
  SubscriptionStatus,
  mapStripeSubscriptionStatus,
  isSubscriptionUsable,
} from './subscription-status.enum.js';
import { BookingPaymentService } from '../booking/booking-payment.service.js';

interface StripeCheckoutSession {
  metadata?: Record<string, string> | null;
  customer?: string | null;
  subscription?: string | null;
}

interface StripeSubscriptionPayload {
  id: string;
  status: string;
  metadata?: Record<string, string> | null;
  current_period_end?: number;
}

interface StripeInvoicePayload {
  customer?: string | { id?: string } | null;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly businessRepo: Repository<Business>;
  private readonly stripeService: StripeService;
  private readonly bookingPaymentService: BookingPaymentService;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    stripeService: StripeService,
    @Inject(forwardRef(() => BookingPaymentService))
    bookingPaymentService: BookingPaymentService,
  ) {
    this.businessRepo = businessRepo;
    this.stripeService = stripeService;
    this.bookingPaymentService = bookingPaymentService;
  }

  listPlans() {
    return getActivePlans();
  }

  async getSubscription(businessId: string) {
    const business = await this.findBusiness(businessId);
    const plan = business.subscriptionPlanId
      ? getPlan(business.subscriptionPlanId)
      : null;

    return {
      status: business.subscriptionStatus ?? SubscriptionStatus.INACTIVE,
      planId: business.subscriptionPlanId,
      plan,
      currentPeriodEnd: business.subscriptionCurrentPeriodEnd,
      isActive: isSubscriptionUsable(
        (business.subscriptionStatus as SubscriptionStatus) ??
          SubscriptionStatus.INACTIVE,
      ),
      stripeCustomerId: business.stripeCustomerId,
    };
  }

  async createCheckoutSession(
    businessId: string,
    planId: string,
    userEmail: string,
    billingInterval: 'month' | 'year' = 'month',
  ): Promise<{ url: string }> {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the server');
    }

    const plan = getPlan(planId);
    if (!plan || plan.active === false) {
      throw new NotFoundException(`Plan "${planId}" not found`);
    }

    const business = await this.findBusiness(businessId);
    const stripe = this.stripeService.client;
    const frontendUrl = this.stripeService.frontendUrl;

    let customerId = business.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: business.email || userEmail,
        name: business.name,
        metadata: { businessId: business.id },
      });
      customerId = customer.id;
      business.stripeCustomerId = customerId;
      await this.businessRepo.save(business);
    }

    const interval = billingInterval === 'year' ? 'year' : 'month';
    const unitAmount =
      interval === 'year' ? plan.priceAnnual * 100 : plan.priceMonthly * 100;
    const recurringLabel = interval === 'year' ? 'yearly' : 'monthly';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            unit_amount: unitAmount,
            product_data: {
              name: `${plan.name} — OptiSchedule (${recurringLabel})`,
              description: plan.description,
              metadata: { planId: plan.id },
            },
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      metadata: {
        businessId: business.id,
        planId: plan.id,
        billingInterval: interval,
      },
      subscription_data: {
        metadata: {
          businessId: business.id,
          planId: plan.id,
          billingInterval: interval,
        },
      },
      success_url: `${frontendUrl}/dashboard/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/dashboard/billing?canceled=1`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create Stripe checkout session');
    }

    return { url: session.url };
  }

  /** Sync subscription after redirect when webhooks are not configured (local dev). */
  async confirmCheckoutSession(businessId: string, sessionId: string) {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the server');
    }

    const business = await this.findBusiness(businessId);
    const session =
      await this.stripeService.client.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.businessId !== businessId) {
      throw new ForbiddenException(
        'Checkout session does not belong to this business',
      );
    }

    if (session.status !== 'complete') {
      throw new BadRequestException('Checkout session is not complete yet');
    }

    await this.onCheckoutCompleted(session as StripeCheckoutSession);
    return this.getSubscription(business.id);
  }

  async createPortalSession(businessId: string): Promise<{ url: string }> {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the server');
    }

    const business = await this.findBusiness(businessId);
    if (!business.stripeCustomerId) {
      throw new BadRequestException(
        'No billing account yet. Subscribe to a plan first.',
      );
    }

    const session =
      await this.stripeService.client.billingPortal.sessions.create({
        customer: business.stripeCustomerId,
        return_url: `${this.stripeService.frontendUrl}/dashboard/billing`,
      });

    return { url: session.url };
  }

  async handleWebhookEvent(event: {
    type: string;
    data: { object: unknown };
  }): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.bookingPaymentService.handleCheckoutCompleted(
          event.data.object as StripeCheckoutSession,
        );
        await this.onCheckoutCompleted(
          event.data.object as StripeCheckoutSession,
        );
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.syncSubscription(
          event.data.object as StripeSubscriptionPayload,
        );
        break;
      case 'invoice.payment_failed':
        await this.onPaymentFailed(event.data.object as StripeInvoicePayload);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  constructWebhookEvent(payload: Buffer, signature: string) {
    const secret = this.stripeService.webhookSecret;
    if (!secret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
    }
    return this.stripeService.client.webhooks.constructEvent(
      payload,
      signature,
      secret,
    );
  }

  private async onCheckoutCompleted(session: StripeCheckoutSession) {
    if (session.metadata?.type === 'booking_payment') {
      return;
    }
    const businessId = session.metadata?.businessId;
    const planId = session.metadata?.planId;
    if (!businessId) return;

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) return;

    if (session.customer && typeof session.customer === 'string') {
      business.stripeCustomerId = session.customer;
    }
    if (session.subscription && typeof session.subscription === 'string') {
      business.stripeSubscriptionId = session.subscription;
      const sub = await this.stripeService.client.subscriptions.retrieve(
        session.subscription,
      );
      await this.applySubscriptionToBusiness(business, sub, planId);
    } else if (planId) {
      business.subscriptionPlanId = planId;
    }

    await this.businessRepo.save(business);
    this.logger.log(
      `Checkout completed for business ${businessId}, plan ${planId}`,
    );
  }

  private async syncSubscription(subscription: StripeSubscriptionPayload) {
    const businessId = subscription.metadata?.businessId;
    if (!businessId) return;

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) return;

    await this.applySubscriptionToBusiness(
      business,
      subscription,
      subscription.metadata?.planId,
    );
    await this.businessRepo.save(business);
    this.logger.log(
      `Subscription synced for business ${businessId}: ${subscription.status}`,
    );
  }

  private async onPaymentFailed(invoice: StripeInvoicePayload) {
    const customerId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;
    if (!customerId) return;

    const business = await this.businessRepo.findOne({
      where: { stripeCustomerId: customerId },
    });
    if (!business) return;

    business.subscriptionStatus = SubscriptionStatus.PAST_DUE;
    await this.businessRepo.save(business);
    this.logger.warn(`Payment failed for business ${business.id}`);
  }

  private async applySubscriptionToBusiness(
    business: Business,
    subscription: StripeSubscriptionPayload,
    planId?: string | null,
  ) {
    business.stripeSubscriptionId = subscription.id;
    business.subscriptionStatus = mapStripeSubscriptionStatus(
      subscription.status,
    );
    const resolvedPlanId = planId ?? subscription.metadata?.planId;
    if (resolvedPlanId) {
      business.subscriptionPlanId = resolvedPlanId;
    }

    const periodEnd = subscription.current_period_end;
    if (periodEnd) {
      business.subscriptionCurrentPeriodEnd = new Date(periodEnd * 1000);
    }
  }

  private async findBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }
}
