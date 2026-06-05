import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillingService } from './billing.service.js';
import { SubscriptionStatus } from './subscription-status.enum.js';
import { Business } from '../business/entities/business.entity.js';
import { BookingPaymentService } from '../booking/booking-payment.service.js';
import { StripeService } from './stripe.service.js';

describe('BillingService', () => {
  const business = {
    id: 'biz-1',
    name: 'Salon',
    email: 'owner@salon.com',
    stripeCustomerId: null as string | null,
    subscriptionPlanId: null as string | null,
    subscriptionStatus: SubscriptionStatus.INACTIVE,
    stripeSubscriptionId: null as string | null,
    subscriptionCurrentPeriodEnd: null as Date | null,
  };

  const businessRepo = {
    findOne: jest.fn(async () => business),
    save: jest.fn(async (b: typeof business) => {
      Object.assign(business, b);
      return business;
    }),
  };

  const stripeSessionsCreate = jest.fn();
  const stripeCustomersCreate = jest.fn();
  const stripeSessionsRetrieve = jest.fn();
  const stripeSubscriptionsRetrieve = jest.fn();
  const stripePortalCreate = jest.fn();
  const stripeWebhooksConstruct = jest.fn();
  const stripeService = {
    isConfigured: true,
    frontendUrl: 'http://localhost:3000',
    webhookSecret: 'whsec_test',
    client: {
      customers: { create: stripeCustomersCreate },
      checkout: {
        sessions: {
          create: stripeSessionsCreate,
          retrieve: stripeSessionsRetrieve,
        },
      },
      subscriptions: { retrieve: stripeSubscriptionsRetrieve },
      billingPortal: { sessions: { create: stripePortalCreate } },
      webhooks: { constructEvent: stripeWebhooksConstruct },
    },
  };

  const bookingPaymentService = {
    handleCheckoutCompleted: jest.fn(),
  };

  const service = new BillingService(
    businessRepo as any,
    stripeService as any,
    bookingPaymentService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    business.stripeCustomerId = null;
    business.stripeSubscriptionId = null;
    business.subscriptionPlanId = null;
    business.subscriptionStatus = SubscriptionStatus.INACTIVE;
    business.subscriptionCurrentPeriodEnd = null;
    businessRepo.findOne.mockImplementation(async () => business);
    stripeCustomersCreate.mockResolvedValue({ id: 'cus_1' });
    stripeSessionsCreate.mockResolvedValue({
      url: 'https://checkout.stripe.test/session',
    });
  });

  it('lists active plans with annual pricing', () => {
    const plans = service.listPlans();
    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].priceAnnual).toBe(182);
  });

  it('uses owner email when business email is missing', async () => {
    business.email = '';
    await service.createCheckoutSession(
      'biz-1',
      'starter',
      'owner@salon.com',
      'month',
    );
    expect(stripeCustomersCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'owner@salon.com' }),
    );
  });

  it('creates monthly checkout session', async () => {
    const result = await service.createCheckoutSession(
      'biz-1',
      'starter',
      'owner@salon.com',
      'month',
    );
    expect(result.url).toContain('checkout.stripe.test');
    expect(stripeSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 19 * 100,
              recurring: { interval: 'month' },
            }),
          }),
        ],
        metadata: expect.objectContaining({
          billingInterval: 'month',
          planId: 'starter',
        }),
      }),
    );
  });

  it('creates annual checkout session with discounted yearly amount', async () => {
    await service.createCheckoutSession(
      'biz-1',
      'starter',
      'owner@salon.com',
      'year',
    );
    expect(stripeSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 182 * 100,
              recurring: { interval: 'year' },
              product_data: expect.objectContaining({
                name: expect.stringContaining('yearly'),
              }),
            }),
          }),
        ],
        metadata: expect.objectContaining({ billingInterval: 'year' }),
      }),
    );
  });

  it('reuses existing stripe customer id', async () => {
    business.stripeCustomerId = 'cus_existing';
    await service.createCheckoutSession('biz-1', 'starter', 'owner@salon.com');
    expect(stripeCustomersCreate).not.toHaveBeenCalled();
    expect(stripeSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' }),
    );
  });

  it('rejects checkout when stripe is not configured', async () => {
    const offline = new BillingService(
      businessRepo as any,
      { ...stripeService, isConfigured: false } as any,
      bookingPaymentService as any,
    );
    await expect(
      offline.createCheckoutSession('biz-1', 'starter', 'owner@salon.com'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unknown plan', async () => {
    await expect(
      service.createCheckoutSession('biz-1', 'enterprise', 'owner@salon.com'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects inactive plan', async () => {
    await expect(
      service.createCheckoutSession('biz-1', 'legacy', 'owner@salon.com'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects checkout session without redirect url', async () => {
    stripeSessionsCreate.mockResolvedValue({ url: null });
    await expect(
      service.createCheckoutSession('biz-1', 'starter', 'owner@salon.com'),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns inactive subscription without plan details', async () => {
    const sub = await service.getSubscription('biz-1');
    expect(sub.planId).toBeNull();
    expect(sub.plan).toBeNull();
    expect(sub.isActive).toBe(false);
    expect(sub.status).toBe(SubscriptionStatus.INACTIVE);
  });

  it('defaults missing subscription status to inactive', async () => {
    business.subscriptionStatus = undefined as unknown as SubscriptionStatus;
    const sub = await service.getSubscription('biz-1');
    expect(sub.status).toBe(SubscriptionStatus.INACTIVE);
    expect(sub.isActive).toBe(false);
  });

  it('returns subscription info for active plan', async () => {
    business.subscriptionPlanId = 'starter';
    business.subscriptionStatus = SubscriptionStatus.ACTIVE;
    business.subscriptionCurrentPeriodEnd = new Date(
      '2026-12-01T00:00:00.000Z',
    );
    const sub = await service.getSubscription('biz-1');
    expect(sub.planId).toBe('starter');
    expect(sub.isActive).toBe(true);
    expect(sub.plan?.priceAnnual).toBe(182);
  });

  it('confirms checkout session and activates subscription', async () => {
    stripeSessionsRetrieve.mockResolvedValue({
      status: 'complete',
      metadata: { businessId: 'biz-1', planId: 'starter' },
      customer: 'cus_confirm',
      subscription: 'sub_confirm',
    });
    stripeSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_confirm',
      status: 'active',
      metadata: { planId: 'starter' },
      current_period_end: Math.floor(new Date('2026-12-01').getTime() / 1000),
    });
    const result = await service.confirmCheckoutSession('biz-1', 'cs_test');
    expect(result.planId).toBe('starter');
    expect(business.stripeCustomerId).toBe('cus_confirm');
  });

  it('rejects confirm when session belongs to another business', async () => {
    stripeSessionsRetrieve.mockResolvedValue({
      status: 'complete',
      metadata: { businessId: 'other-biz', planId: 'starter' },
    });
    await expect(
      service.confirmCheckoutSession('biz-1', 'cs_test'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects incomplete checkout confirmation', async () => {
    stripeSessionsRetrieve.mockResolvedValue({
      status: 'open',
      metadata: { businessId: 'biz-1', planId: 'starter' },
    });
    await expect(
      service.confirmCheckoutSession('biz-1', 'cs_test'),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates billing portal session for subscribed customer', async () => {
    business.stripeCustomerId = 'cus_portal';
    stripePortalCreate.mockResolvedValue({
      url: 'https://billing.stripe.test/portal',
    });
    const result = await service.createPortalSession('biz-1');
    expect(result.url).toContain('portal');
  });

  it('rejects portal when customer id missing', async () => {
    business.stripeCustomerId = null;
    await expect(service.createPortalSession('biz-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('handles checkout.session.completed webhook', async () => {
    await service.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { businessId: 'biz-1', planId: 'starter' },
          customer: 'cus_wh',
          subscription: 'sub_wh',
        },
      },
    });
    expect(bookingPaymentService.handleCheckoutCompleted).toHaveBeenCalled();
    expect(business.subscriptionPlanId).toBe('starter');
  });

  it('skips platform checkout when metadata type is booking_payment', async () => {
    await service.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { type: 'booking_payment', businessId: 'biz-1' },
          customer: 'cus_booking',
        },
      },
    });
    expect(business.subscriptionPlanId).toBeNull();
  });

  it('syncs subscription.updated webhook', async () => {
    await service.handleWebhookEvent({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_upd',
          status: 'trialing',
          metadata: { businessId: 'biz-1', planId: 'starter' },
          current_period_end: Math.floor(Date.now() / 1000) + 86400,
        },
      },
    });
    expect(business.subscriptionStatus).toBe(SubscriptionStatus.TRIALING);
  });

  it('marks business past_due on invoice.payment_failed', async () => {
    business.stripeCustomerId = 'cus_fail';
    await service.handleWebhookEvent({
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_fail' } },
    });
    expect(business.subscriptionStatus).toBe(SubscriptionStatus.PAST_DUE);
  });

  it('ignores unknown webhook events', async () => {
    await expect(
      service.handleWebhookEvent({
        type: 'unknown.event',
        data: { object: {} },
      }),
    ).resolves.toBeUndefined();
  });

  it('constructs webhook events when secret configured', () => {
    const payload = Buffer.from('{}');
    stripeWebhooksConstruct.mockReturnValue({ type: 'test' });
    expect(service.constructWebhookEvent(payload, 'sig')).toEqual({
      type: 'test',
    });
  });

  it('rejects webhook construct without secret', () => {
    const offlineStripe = { ...stripeService, webhookSecret: '' };
    const offline = new BillingService(
      businessRepo as any,
      offlineStripe as any,
      bookingPaymentService as any,
    );
    expect(() =>
      offline.constructWebhookEvent(Buffer.from('{}'), 'sig'),
    ).toThrow(BadRequestException);
  });

  it('throws when business not found', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.getSubscription('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('activates plan id when checkout has no subscription id', async () => {
    await service.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { businessId: 'biz-1', planId: 'starter' },
          customer: 'cus_only_plan',
        },
      },
    });
    expect(business.subscriptionPlanId).toBe('starter');
    expect(business.stripeSubscriptionId).toBeNull();
  });

  it('reads plan id from subscription metadata when omitted in apply', async () => {
    await service.handleWebhookEvent({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_meta',
          status: 'active',
          metadata: { businessId: 'biz-1', planId: 'starter' },
        },
      },
    });
    expect(business.subscriptionPlanId).toBe('starter');
  });

  it('rejects confirm when stripe offline', async () => {
    const offline = new BillingService(
      businessRepo as any,
      { ...stripeService, isConfigured: false } as any,
      bookingPaymentService as any,
    );
    await expect(offline.confirmCheckoutSession('biz-1', 'cs')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects portal when stripe is not configured', async () => {
    const offline = new BillingService(
      businessRepo as any,
      { ...stripeService, isConfigured: false } as any,
      bookingPaymentService as any,
    );
    await expect(offline.createPortalSession('biz-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('skips persisting stripe customer when checkout customer is expanded', async () => {
    await service.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { businessId: 'biz-1', planId: 'starter' },
          customer: { id: 'cus_expanded' },
        },
      },
    });
    expect(business.stripeCustomerId).toBeNull();
    expect(business.subscriptionPlanId).toBe('starter');
  });

  it('leaves plan unset when checkout has expanded subscription and no planId', async () => {
    await service.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { businessId: 'biz-1' },
          customer: 'cus_sub_obj',
          subscription: { id: 'sub_expanded' },
        },
      },
    });
    expect(business.subscriptionPlanId).toBeNull();
  });

  it('sets plan from metadata when subscription id is expanded object', async () => {
    await service.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { businessId: 'biz-1', planId: 'starter' },
          customer: 'cus_sub_obj',
          subscription: { id: 'sub_expanded' },
        },
      },
    });
    expect(business.subscriptionPlanId).toBe('starter');
    expect(stripeSubscriptionsRetrieve).not.toHaveBeenCalled();
  });

  it('syncs subscription without changing plan when no plan id is provided', async () => {
    business.subscriptionPlanId = 'starter';
    stripeSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_no_plan',
      status: 'active',
      metadata: {},
    });
    await service.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { businessId: 'biz-1' },
          customer: 'cus_no_plan',
          subscription: 'sub_no_plan',
        },
      },
    });
    expect(business.subscriptionPlanId).toBe('starter');
  });

  it('applies plan id from subscription metadata when session omits planId', async () => {
    stripeSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_meta_only',
      status: 'active',
      metadata: { planId: 'starter' },
      current_period_end: Math.floor(Date.now() / 1000) + 86400,
    });
    await service.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { businessId: 'biz-1' },
          customer: 'cus_meta',
          subscription: 'sub_meta_only',
        },
      },
    });
    expect(business.subscriptionPlanId).toBe('starter');
  });

  it('syncs subscription.deleted webhook', async () => {
    await service.handleWebhookEvent({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_del',
          status: 'canceled',
          metadata: { businessId: 'biz-1', planId: 'starter' },
        },
      },
    });
    expect(business.subscriptionStatus).toBe(SubscriptionStatus.CANCELED);
  });

  it('ignores checkout webhook without business id', async () => {
    await service.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: { object: { metadata: { planId: 'starter' } } },
    });
    expect(business.subscriptionPlanId).toBeNull();
  });

  it('ignores checkout webhook when business is missing', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    await service.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { businessId: 'missing', planId: 'starter' },
          customer: 'cus_missing',
        },
      },
    });
    expect(businessRepo.save).not.toHaveBeenCalled();
  });

  it('marks past_due when invoice customer is an expanded object', async () => {
    business.stripeCustomerId = 'cus_obj';
    await service.handleWebhookEvent({
      type: 'invoice.payment_failed',
      data: { object: { customer: { id: 'cus_obj' } } },
    });
    expect(business.subscriptionStatus).toBe(SubscriptionStatus.PAST_DUE);
  });

  it('ignores payment_failed when customer id is missing', async () => {
    await service.handleWebhookEvent({
      type: 'invoice.payment_failed',
      data: { object: { customer: null } },
    });
    expect(business.subscriptionStatus).toBe(SubscriptionStatus.INACTIVE);
  });

  it('ignores payment_failed when no business matches customer', async () => {
    business.stripeCustomerId = 'cus_other';
    business.subscriptionStatus = SubscriptionStatus.ACTIVE;
    businessRepo.findOne.mockImplementationOnce(
      async (opts: { where?: { stripeCustomerId?: string } }) => {
        if (opts?.where?.stripeCustomerId === 'cus_unknown') return null;
        return business;
      },
    );
    await service.handleWebhookEvent({
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_unknown' } },
    });
    expect(business.subscriptionStatus).toBe(SubscriptionStatus.ACTIVE);
  });

  it('ignores subscription sync without business id', async () => {
    await service.handleWebhookEvent({
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_orphan', status: 'active', metadata: {} } },
    });
    expect(businessRepo.save).not.toHaveBeenCalled();
  });

  it('ignores subscription sync when business is missing', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    await service.handleWebhookEvent({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_missing',
          status: 'active',
          metadata: { businessId: 'missing' },
        },
      },
    });
    expect(businessRepo.save).not.toHaveBeenCalled();
  });

  it('instantiates through Nest forwardRef injection', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: StripeService, useValue: stripeService },
        { provide: BookingPaymentService, useValue: bookingPaymentService },
      ],
    }).compile();
    const injected = moduleRef.get(BillingService);
    expect(injected.listPlans().length).toBeGreaterThan(0);
    await moduleRef.close();
  });
});
