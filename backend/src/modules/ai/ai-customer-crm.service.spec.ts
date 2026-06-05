import { AiCustomerCrmService } from './ai-customer-crm.service.js';

describe('AiCustomerCrmService (thin wrapper)', () => {
  const sub = {
    id: 'sub-1',
    plan: { name: 'Nail Plan' },
    appointmentsRemaining: 5,
    expiresAt: new Date('2026-06-01'),
  };

  const deps = {
    customerService: {
      getCustomerDetail: jest.fn(async () => ({
        customer: { id: 'c1', name: 'Anna Lopez' },
        stats: { total: 1 },
        appointments: [{ id: 'b1' }],
      })),
      update: jest.fn(async (_id, dto) => ({
        id: 'c1',
        name: 'Anna Lopez',
        tags: dto.tags,
      })),
      remove: jest.fn(),
    },
    customerPrivacyService: {
      exportCustomerData: jest.fn(async () => ({ ok: true })),
      deleteCustomerData: jest.fn(),
    },
    subscriptionsService: {
      listCustomerSubscriptions: jest.fn(async () => [sub]),
      getUsageHistory: jest.fn(async () => ({ usage: [], subscription: sub })),
      getCustomerSubscriptionUsage: jest.fn(async () => ({
        usage: [],
        subscription: sub,
      })),
      cancelSubscription: jest.fn(),
      listPlans: jest.fn(async () => [{ id: 'plan-1', name: 'Nail Plan' }]),
    },
    giftCardOrderService: {
      listCustomerGiftCardAccount: jest.fn(async () => ({
        orders: [
          {
            id: 'gc-1',
            code: 'GIFT1234',
            deliveryMethod: 'physical',
            fulfillmentStatus: 'shipped',
          },
        ],
        redeemed: [],
      })),
      submitCancelRequest: jest.fn(async () => ({ requestId: 'r1' })),
      getCustomerOrder: jest.fn(),
    },
    packagesService: {
      listPackages: jest.fn(async () => [{ id: 'pkg-1', name: 'Spa Day' }]),
    },
    zendeskService: {
      createSupportTicket: jest.fn(async () => ({ ticketId: 1 })),
      createGiftCardChangeTicket: jest.fn(async () => ({ ticketId: 2 })),
    },
    bookingRepo: { find: jest.fn(async () => []), update: jest.fn() },
    customerRepo: { findOne: jest.fn(), save: jest.fn() },
    subscriptionRepo: { save: jest.fn(async (s) => s), update: jest.fn() },
    changeRequestRepo: {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({ id: 'req-1', ...v })),
    },
    giftCardRepo: {
      findOne: jest.fn(async () => ({
        id: 'gc-1',
        code: 'GIFT1234',
        cardType: 'monetary',
        deliveryMethod: 'physical',
        fulfillmentStatus: 'shipped',
        purchaseAmount: 50,
        balance: 50,
        serviceCredits: [],
      })),
    },
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: { giftCards: { purchaseEnabled: true, presetAmounts: [50] } },
      })),
    },
  };

  const service = new AiCustomerCrmService(
    deps.customerService as any,
    deps.customerPrivacyService as any,
    deps.subscriptionsService as any,
    deps.giftCardOrderService as any,
    deps.packagesService as any,
    deps.zendeskService as any,
    deps.bookingRepo as any,
    deps.customerRepo as any,
    deps.subscriptionRepo as any,
    deps.changeRequestRepo as any,
    deps.giftCardRepo as any,
    deps.businessRepo as any,
  );

  const customers = [
    { id: 'c1', name: 'Anna Lopez', email: 'anna@test.com' },
    { id: 'c2', name: 'Bob Smith', email: 'bob@test.com' },
  ] as any[];
  const resolveCustomer = (list: any[], name: string) =>
    list.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));

  beforeEach(() => jest.clearAllMocks());

  it('rescues and decomposes CRM intents', () => {
    expect(
      service.rescueCrmIntent('Show my appointments', 'unknown')?.action,
    ).toBe('my_appointments');
    expect(service.rescueCrmIntent('hello', 'unknown')).toBeNull();
    expect(
      service.isCrmCompound(
        "List Anna's subscriptions and show her gift cards",
      ),
    ).toBe(true);
    expect(service.isCrmCompound('short')).toBe(false);
    expect(
      service.decomposeCrmCompound(
        "List Anna's subscriptions and show her gift cards",
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('delegates all dashboard CRM handlers', async () => {
    expect(
      (
        await service.handleListCustomerSubscriptions(
          'biz-1',
          { customerName: 'Anna' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleSubscriptionUsageHistory(
          'biz-1',
          { customerName: 'Anna', subscriptionId: 'sub-1' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleExtendSubscription(
          'biz-1',
          { customerName: 'Anna', extendMonths: 2, subscriptionId: 'sub-1' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleCancelSubscriptionAdmin(
          'biz-1',
          { customerName: 'Anna', subscriptionId: 'sub-1' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleListCustomerGiftCards(
          'biz-1',
          { customerName: 'Anna' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleListCustomerBookings(
          'biz-1',
          { customerName: 'Anna' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleCustomerNoShowHistory(
          'biz-1',
          { customerName: 'Anna' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleTagCustomer(
          'biz-1',
          { customerName: 'Anna', tag: 'vip' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleExportCustomerData(
          'biz-1',
          { customerName: 'Anna' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleDeleteCustomerData(
          'biz-1',
          { customerName: 'Anna' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleSendReengagementMessage(
          'biz-1',
          { customerName: 'Anna' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleMergeCustomers(
          'biz-1',
          { primaryCustomerName: 'Anna', secondaryCustomerName: 'Bob' },
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
  });

  it('delegates all customer account handlers', async () => {
    const session = { sessionCustomerId: 'c1' };
    expect((await service.handleMyProfile('biz-1', session)).success).toBe(
      true,
    );
    expect((await service.handleMyAppointments('biz-1', session)).success).toBe(
      true,
    );
    expect(
      (await service.handleMySubscriptions('biz-1', session)).success,
    ).toBe(true);
    expect(
      (await service.handleSubscriptionUsage('biz-1', session)).success,
    ).toBe(true);
    expect((await service.handleMyGiftCards('biz-1', session)).success).toBe(
      true,
    );
    expect(
      (await service.handleGiftCardBalance('biz-1', session)).success,
    ).toBe(true);
    expect(
      (await service.handleGiftCardRedemptionHistory('biz-1', session)).success,
    ).toBe(true);
    expect(
      (
        await service.handleRequestGiftCardCancel('biz-1', {
          ...session,
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleRequestGiftCardModify('biz-1', {
          ...session,
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleTrackPhysicalGiftCardOrder('biz-1', session))
        .success,
    ).toBe(true);
    expect((await service.handlePrivacyExport('biz-1', session)).success).toBe(
      true,
    );
    expect((await service.handlePrivacyDelete('biz-1', session)).success).toBe(
      true,
    );
  });

  it('delegates discovery and compound handlers', async () => {
    expect((await service.handleDiscoverPackages('biz-1')).success).toBe(true);
    expect(
      (await service.handleDiscoverSubscriptionPlans('biz-1', {})).success,
    ).toBe(true);
    expect(
      (await service.handleDiscoverGiftCardProducts('biz-1')).success,
    ).toBe(true);
    expect(
      (
        await service.handleCrmCompound(
          'biz-1',
          "List Anna's subscriptions and show her gift cards",
          {},
          customers,
          resolveCustomer,
          'user-1',
        )
      ).success,
    ).toBe(true);
  });
});
