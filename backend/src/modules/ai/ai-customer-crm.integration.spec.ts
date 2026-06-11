import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiCustomerCrmService } from './ai-customer-crm.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Business } from '../business/entities/business.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { CustomerSubscription } from '../service-subscriptions/entities/subscription.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { GiftCardChangeRequest } from '../gift-cards/entities/gift-card-change-request.entity.js';
import { CustomerService } from '../customer/customer.service.js';
import { CustomerPrivacyService } from '../customer/customer-privacy.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { GiftCardOrderService } from '../gift-cards/gift-card-order.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { ZendeskIntegrationService } from '../integrations/zendesk/zendesk-integration.service.js';

describe('Sprint 28 customer account & CRM AI scenarios', () => {
  const customers = [
    { id: 'c1', name: 'Anna Lopez', email: 'anna@test.com' },
    { id: 'c2', name: 'Bob Smith', email: 'bob@test.com' },
  ] as any[];
  const resolveCustomer = (list: any[], name: string) =>
    list.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));

  const sub = {
    id: 'sub-1',
    plan: { name: 'Nail Plan' },
    appointmentsRemaining: 5,
    expiresAt: new Date('2026-06-01'),
  };

  const customerService = {
    getCustomerDetail: jest.fn(async () => ({
      customer: { id: 'c1', name: 'Anna Lopez' },
      stats: { total: 2, noShowCount: 1 },
      appointments: [{ id: 'b1', status: 'confirmed' }],
    })),
    update: jest.fn(async (_id, dto) => ({
      id: 'c1',
      name: 'Anna Lopez',
      tags: dto.tags ?? [],
    })),
    remove: jest.fn(),
  };
  const customerPrivacyService = {
    exportCustomerData: jest.fn(async () => ({ customer: 'export' })),
    deleteCustomerData: jest.fn(),
  };
  const subscriptionsService = {
    listCustomerSubscriptions: jest.fn(async () => [sub]),
    getUsageHistory: jest.fn(async () => ({
      usage: [{ id: 'u1' }],
      subscription: sub,
    })),
    getCustomerSubscriptionUsage: jest.fn(async () => ({
      usage: [{ id: 'u1' }],
      subscription: sub,
    })),
    cancelSubscription: jest.fn(),
    listPlans: jest.fn(async () => [{ id: 'plan-1', name: 'Nail Plan' }]),
  };
  const giftCardOrderService = {
    listCustomerGiftCardAccount: jest.fn(async () => ({
      orders: [
        {
          id: 'gc-1',
          code: 'GIFT123',
          deliveryMethod: 'physical',
          fulfillmentStatus: 'shipped',
          balance: 50,
        },
      ],
      redeemed: [{ id: 'gc-2', code: 'REDEEM1', remainingBalance: 25 }],
    })),
    submitCancelRequest: jest.fn(async () => ({ requestId: 'cancel-1' })),
    getCustomerOrder: jest.fn(),
  };
  const packagesService = {
    listPackages: jest.fn(async () => [{ id: 'pkg-1', name: 'Spa Day' }]),
  };
  const zendeskService = {
    createSupportTicket: jest.fn(async () => ({ ticketId: 99 })),
    createGiftCardChangeTicket: jest.fn(async () => ({ ticketId: 100 })),
  };
  const bookingRepo = {
    find: jest.fn(async () => [{ id: 'ns-1', status: 'no_show' }]),
    update: jest.fn(),
  };
  const subscriptionRepo = { save: jest.fn(async (s) => s), update: jest.fn() };
  const giftCardRepo = {
    findOne: jest.fn(async () => ({
      id: 'gc-1',
      code: 'GIFT123',
      cardType: 'monetary',
      deliveryMethod: 'physical',
      fulfillmentStatus: 'shipped',
      purchaseAmount: 50,
      balance: 50,
      serviceCredits: [{ serviceName: 'Massage', quantityRemaining: 1 }],
    })),
  };
  const changeRequestRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({ id: 'req-1', ...v })),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      name: 'Salon',
      settings: {
        giftCards: { purchaseEnabled: true, presetAmounts: [50, 100] },
      },
    })),
  };

  let customerCrm: AiCustomerCrmService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiCustomerCrmService,
        AiIntentRescueService,
        { provide: CustomerService, useValue: customerService },
        { provide: CustomerPrivacyService, useValue: customerPrivacyService },
        {
          provide: ServiceSubscriptionsService,
          useValue: subscriptionsService,
        },
        { provide: GiftCardOrderService, useValue: giftCardOrderService },
        { provide: ServicePackagesService, useValue: packagesService },
        { provide: ZendeskIntegrationService, useValue: zendeskService },
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        {
          provide: getRepositoryToken(Customer),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(CustomerSubscription),
          useValue: subscriptionRepo,
        },
        { provide: getRepositoryToken(GiftCard), useValue: giftCardRepo },
        {
          provide: getRepositoryToken(GiftCardChangeRequest),
          useValue: changeRequestRepo,
        },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
      ],
    }).compile();

    customerCrm = module.get(AiCustomerCrmService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('intent rescue (ai-cmd-u3 dashboard CRM)', () => {
    it('rescues customer 360 read intents', () => {
      expect(
        rescue.rescue({
          prompt: "List Anna's subscriptions",
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('list_customer_subscriptions');
      expect(
        rescue.rescue({
          prompt: 'Usage history nail plan for Anna',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('subscription_usage_history');
      expect(
        rescue.rescue({
          prompt: "Show Anna's gift cards",
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('list_customer_gift_cards');
      expect(
        rescue.rescue({
          prompt: 'List appointments for Anna',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('list_customer_bookings');
      expect(
        rescue.rescue({
          prompt: 'Anna no-show history',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('customer_no_show_history');
    });

    it('rescues customer 360 mutate intents', () => {
      expect(
        rescue.rescue({
          prompt: 'Extend Anna nail plan 2 months',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('extend_subscription');
      expect(
        rescue.rescue({
          prompt: 'Cancel subscription for Anna',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('cancel_subscription_admin');
      expect(
        rescue.rescue({
          prompt: 'Tag Anna as VIP',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('tag_customer');
      expect(
        rescue.rescue({
          prompt: 'Export customer data Anna',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('export_customer_data');
      expect(
        rescue.rescue({
          prompt: 'Delete customer data Anna',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('delete_customer_data');
      expect(
        rescue.rescue({
          prompt: 'Send win-back message to Anna',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('send_reengagement_message');
      expect(
        rescue.rescue({
          prompt: 'Merge duplicate customers',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('merge_customers');
    });
  });

  describe('intent rescue (ai-cmd-u1/u2 customer account)', () => {
    it('rescues my_* account intents', () => {
      expect(
        rescue.rescue({
          prompt: 'Show my profile',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('my_profile');
      expect(
        rescue.rescue({
          prompt: 'Show my appointments',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('list_my_appointments');
      expect(
        rescue.rescue({
          prompt: 'My appointments',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('my_appointments');
      expect(
        rescue.rescue({
          prompt: 'Show my subscriptions',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('my_subscriptions');
      expect(
        rescue.rescue({
          prompt: 'My subscription usage remaining',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('subscription_usage');
      expect(
        rescue.rescue({
          prompt: 'Show my gift cards',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('my_gift_cards');
      expect(
        rescue.rescue({
          prompt: 'Gift card balance left',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('gift_card_balance');
      expect(
        rescue.rescue({
          prompt: 'Gift card redemption history',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('gift_card_redemption_history');
      expect(
        rescue.rescue({
          prompt: 'Track physical gift card shipment',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('track_physical_gift_card_order');
      expect(
        rescue.rescue({
          prompt: 'Export my personal data',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('privacy_export');
      expect(
        rescue.rescue({
          prompt: 'Delete my account data',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('privacy_delete');
    });

    it('rescues gift card Zendesk handoff intents', () => {
      expect(
        rescue.rescue({
          prompt: 'Cancel my gift card order',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('request_gift_card_cancel');
      expect(
        rescue.rescue({
          prompt: 'Modify my gift card order',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('request_gift_card_modify');
    });
  });

  describe('intent rescue (ai-cmd-c4 discovery)', () => {
    it('rescues package, plan, and gift card discovery', () => {
      expect(
        rescue.rescue({
          prompt: 'What packages are available?',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('discover_packages');
      expect(
        rescue.rescue({
          prompt: 'What membership plans are available',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('discover_subscription_plans');
      expect(
        rescue.rescue({
          prompt: 'What gift cards can I buy',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('discover_gift_card_products');
    });

    it('does not rescue CRM compound via single-intent rescue', () => {
      expect(
        customerCrm.rescueCrmIntent(
          "List Anna's subscriptions and show her gift cards",
          'unknown',
        ),
      ).toBeNull();
    });
  });

  describe('dashboard CRM handler flows', () => {
    it('lists subscriptions, gift cards, bookings, and no-shows', async () => {
      expect(
        (
          await customerCrm.handleListCustomerSubscriptions(
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await customerCrm.handleListCustomerGiftCards(
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await customerCrm.handleListCustomerBookings(
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await customerCrm.handleCustomerNoShowHistory(
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
    });

    it('manages subscriptions and customer tags', async () => {
      expect(
        (
          await customerCrm.handleSubscriptionUsageHistory(
            'biz-1',
            { customerName: 'Anna', subscriptionId: 'sub-1' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await customerCrm.handleExtendSubscription(
            'biz-1',
            { customerName: 'Anna', extendMonths: 2, subscriptionId: 'sub-1' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(subscriptionRepo.save).toHaveBeenCalled();
      expect(
        (
          await customerCrm.handleCancelSubscriptionAdmin(
            'biz-1',
            { customerName: 'Anna', subscriptionId: 'sub-1' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(subscriptionsService.cancelSubscription).toHaveBeenCalled();
      expect(
        (
          await customerCrm.handleTagCustomer(
            'biz-1',
            { customerName: 'Anna', tag: 'vip' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
    });

    it('exports, deletes, re-engages, and merges customers', async () => {
      expect(
        (
          await customerCrm.handleExportCustomerData(
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await customerCrm.handleDeleteCustomerData(
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await customerCrm.handleSendReengagementMessage(
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(zendeskService.createSupportTicket).toHaveBeenCalled();
      expect(
        (
          await customerCrm.handleMergeCustomers(
            'biz-1',
            { primaryCustomerName: 'Anna', secondaryCustomerName: 'Bob' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(bookingRepo.update).toHaveBeenCalled();
      expect(customerService.remove).toHaveBeenCalled();
    });
  });

  describe('customer account handler flows', () => {
    it('handles my_* read intents with session customer', async () => {
      const session = { sessionCustomerId: 'c1' };
      expect(
        (await customerCrm.handleMyProfile('biz-1', session)).success,
      ).toBe(true);
      expect(
        (await customerCrm.handleMyAppointments('biz-1', session)).success,
      ).toBe(true);
      expect(
        (await customerCrm.handleMySubscriptions('biz-1', session)).success,
      ).toBe(true);
      expect(
        (await customerCrm.handleSubscriptionUsage('biz-1', session)).success,
      ).toBe(true);
      expect(
        (await customerCrm.handleMyGiftCards('biz-1', session)).success,
      ).toBe(true);
      expect(
        (await customerCrm.handleGiftCardBalance('biz-1', session)).success,
      ).toBe(true);
      expect(
        (await customerCrm.handleGiftCardRedemptionHistory('biz-1', session))
          .success,
      ).toBe(true);
      expect(
        (await customerCrm.handleTrackPhysicalGiftCardOrder('biz-1', session))
          .success,
      ).toBe(true);
    });

    it('handles gift card cancel/modify Zendesk handoff and privacy', async () => {
      const session = { sessionCustomerId: 'c1', giftCardId: 'gc-1' };
      expect(
        (await customerCrm.handleRequestGiftCardCancel('biz-1', session))
          .success,
      ).toBe(true);
      expect(giftCardOrderService.submitCancelRequest).toHaveBeenCalled();
      expect(
        (await customerCrm.handleRequestGiftCardModify('biz-1', session))
          .success,
      ).toBe(true);
      expect(zendeskService.createGiftCardChangeTicket).toHaveBeenCalled();
      expect(
        (
          await customerCrm.handlePrivacyExport('biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await customerCrm.handlePrivacyDelete('biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
    });
  });

  describe('discovery handler flows', () => {
    it('discovers packages, plans, and gift card products', async () => {
      expect((await customerCrm.handleDiscoverPackages('biz-1')).success).toBe(
        true,
      );
      expect(
        (await customerCrm.handleDiscoverSubscriptionPlans('biz-1', {}))
          .success,
      ).toBe(true);
      expect(
        (await customerCrm.handleDiscoverGiftCardProducts('biz-1')).success,
      ).toBe(true);
    });
  });

  describe('multi-command CRM compound', () => {
    it('executes subscriptions + gift cards in one command via natural decompose', async () => {
      const result = await customerCrm.handleCrmCompound(
        'biz-1',
        "List Anna's subscriptions and show her gift cards",
        {},
        customers,
        resolveCustomer,
        'user-1',
      );
      expect(result.success).toBe(true);
      expect((result.details as any).steps).toHaveLength(2);
      expect((result.details as any).crmCompound).toBe(true);
      expect(subscriptionsService.listCustomerSubscriptions).toHaveBeenCalled();
      expect(
        giftCardOrderService.listCustomerGiftCardAccount,
      ).toHaveBeenCalled();
    });

    it('executes discovery compound and tag + export dashboard flow', async () => {
      const discover = await customerCrm.handleCrmCompound(
        'biz-1',
        'What packages are available and what membership plans are available',
        {},
        customers,
        resolveCustomer,
      );
      expect(discover.success).toBe(true);
      expect((discover.details as any).steps).toHaveLength(2);

      const dashboard = await customerCrm.handleCrmCompound(
        'biz-1',
        'compound',
        {
          compoundSteps: [
            {
              action: 'tag_customer',
              params: { customerName: 'Anna', tag: 'vip' },
              segment: 'a',
            },
            {
              action: 'export_customer_data',
              params: { customerName: 'Anna' },
              segment: 'b',
            },
          ],
        },
        customers,
        resolveCustomer,
      );
      expect(dashboard.success).toBe(true);
    });

    it('stops compound on failed step', async () => {
      const result = await customerCrm.handleCrmCompound(
        'biz-1',
        'compound',
        {
          compoundSteps: [
            { action: 'list_customer_subscriptions', params: {}, segment: 'a' },
            {
              action: 'tag_customer',
              params: { customerName: 'Anna', tag: 'vip' },
              segment: 'b',
            },
          ],
        },
        customers,
        resolveCustomer,
      );
      expect(result.success).toBe(false);
      expect((result.details as any).failedStep).toBe(
        'list_customer_subscriptions',
      );
    });
  });
});
