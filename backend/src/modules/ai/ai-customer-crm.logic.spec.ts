import {
  handleListCustomerSubscriptionsLogic,
  handleSubscriptionUsageHistoryLogic,
  handleExtendSubscriptionLogic,
  handleCancelSubscriptionAdminLogic,
  handleListCustomerGiftCardsLogic,
  handleListCustomerBookingsLogic,
  handleListCustomersLogic,
  handleCustomerNoShowHistoryLogic,
  handleTagCustomerLogic,
  handleUpdateCustomerLogic,
  handleExportCustomerDataLogic,
  handleDeleteCustomerDataLogic,
  handleSendReengagementMessageLogic,
  handleMergeCustomersLogic,
  handleMyProfileLogic,
  handleMyAppointmentsLogic,
  handleMySubscriptionsLogic,
  handleSubscriptionUsageLogic,
  handleMyGiftCardsLogic,
  handleGiftCardBalanceLogic,
  handleGiftCardRedemptionHistoryLogic,
  handleRequestGiftCardCancelLogic,
  handleRequestGiftCardModifyLogic,
  handleTrackPhysicalGiftCardOrderLogic,
  handleExplainGiftCardOrderLogic,
  handlePrivacyExportLogic,
  handlePrivacyDeleteLogic,
  handleDiscoverPackagesLogic,
  handleDiscoverSubscriptionPlansLogic,
  handleDiscoverGiftCardProductsLogic,
  handleCrmCompoundLogic,
  type CustomerCrmLogicDeps,
} from './ai-customer-crm.logic.js';

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

function buildDeps(
  overrides: Partial<CustomerCrmLogicDeps> = {},
): CustomerCrmLogicDeps {
  return {
    customerService: {
      getCustomerDetail: jest.fn(async () => ({
        customer: { id: 'c1', name: 'Anna Lopez' },
        stats: { total: 3, noShowCount: 1 },
        appointments: [{ id: 'b1' }],
      })),
      update: jest.fn(async (_id, dto) => ({
        id: 'c1',
        name: 'Anna Lopez',
        tags: dto.tags,
      })),
      remove: jest.fn(),
      searchDashboard: jest.fn(async () => ({
        stats: {
          totalCustomers: 2,
          filteredCustomers: 2,
          totalAppointments: 5,
          appointmentsByStatus: {},
        },
        customers: [
          {
            id: 'c1',
            name: 'Anna Lopez',
            email: 'anna@test.com',
            phone: null,
            tags: [],
            isVip: true,
            segment: 'vip',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            stats: { total: 3, noShowCount: 0, byStatus: {} },
          },
          {
            id: 'c2',
            name: 'Bob Smith',
            email: 'bob@test.com',
            phone: null,
            tags: ['waitlist'],
            isVip: false,
            segment: 'new',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            stats: { total: 0, noShowCount: 0, byStatus: {} },
          },
        ],
        totalItems: 2,
        page: 1,
        pageSize: 20,
      })),
    } as any,
    customerPrivacyService: {
      exportCustomerData: jest.fn(async () => ({ customer: 'data' })),
      deleteCustomerData: jest.fn(),
    } as any,
    subscriptionsService: {
      listCustomerSubscriptions: jest.fn(async () => [sub]),
      getUsageHistory: jest.fn(async () => ({
        usage: [{ id: 'u1' }],
        subscription: sub,
      })),
      getCustomerSubscriptionUsage: jest.fn(async () => ({
        usage: [{ id: 'u1' }],
        subscription: sub,
      })),
      cancelSubscription: jest.fn(async () => ({
        subscription: sub,
        refundStatus: undefined,
      })),
      listPlans: jest.fn(async () => [{ id: 'plan-1', name: 'Nail Plan' }]),
    } as any,
    giftCardOrderService: {
      listCustomerGiftCardAccount: jest.fn(async () => ({
        orders: [
          {
            id: 'gc-1',
            code: 'GIFT1234',
            deliveryMethod: 'physical',
            fulfillmentStatus: 'shipped',
            balance: 50,
          },
        ],
        redeemed: [{ id: 'gc-2', code: 'REDEEM1', remainingBalance: 25 }],
      })),
      submitCancelRequest: jest.fn(async () => ({ requestId: 'cancel-1' })),
      getCustomerOrder: jest.fn(),
    } as any,
    giftCardClaimService: {
      claimByCode: jest.fn(async () => ({
        giftCardId: 'gc-1',
        cardType: 'package',
      })),
    },
    packagesService: {
      listPackages: jest.fn(async () => [{ id: 'pkg-1', name: 'Spa Day' }]),
    } as any,
    zendeskService: {
      createSupportTicket: jest.fn(async () => ({ ticketId: 99 })),
      createGiftCardChangeTicket: jest.fn(async () => ({ ticketId: 100 })),
    } as any,
    bookingRepo: {
      find: jest.fn(async () => [{ id: 'ns-1', status: 'no_show' }]),
      update: jest.fn(),
    } as any,
    customerRepo: { findOne: jest.fn(), save: jest.fn() } as any,
    subscriptionRepo: {
      save: jest.fn(async (s) => s),
      update: jest.fn(),
    } as any,
    changeRequestRepo: {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({ id: 'req-1', ...v })),
    } as any,
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
    } as any,
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        name: 'Salon',
        settings: {
          giftCards: { purchaseEnabled: true, presetAmounts: [50, 100] },
        },
      })),
    } as any,
    publicCustomerAuthService: {
      getPreferredLocale: jest.fn(),
      updatePreferredLocale: jest.fn(),
    } as any,
    ...overrides,
  };
}

describe('ai-customer-crm.logic', () => {
  describe('dashboard CRM read handlers', () => {
    it('lists subscriptions with success and failure', async () => {
      expect(
        (
          await handleListCustomerSubscriptionsLogic(
            buildDeps(),
            'biz-1',
            {},
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      const ok = await handleListCustomerSubscriptionsLogic(
        buildDeps(),
        'biz-1',
        { customerName: 'Anna' },
        customers,
        resolveCustomer,
      );
      expect(ok.success).toBe(true);

      const empty = await handleListCustomerSubscriptionsLogic(
        buildDeps({
          subscriptionsService: {
            listCustomerSubscriptions: jest.fn(async () => []),
          } as any,
        }),
        'biz-1',
        { customerName: 'Anna' },
        customers,
        resolveCustomer,
      );
      expect(empty.success).toBe(true);

      const emptyGiftCards = await handleListCustomerGiftCardsLogic(
        buildDeps({
          giftCardOrderService: {
            listCustomerGiftCardAccount: jest.fn(async () => ({
              orders: [],
              redeemed: [],
            })),
          } as any,
        }),
        'biz-1',
        { customerName: 'Anna' },
        customers,
        resolveCustomer,
      );
      expect(emptyGiftCards.success).toBe(true);
      expect(emptyGiftCards.summary).toContain('no gift cards');
    });

    it('handles subscription usage history', async () => {
      expect(
        (
          await handleSubscriptionUsageHistoryLogic(
            buildDeps(),
            'biz-1',
            {},
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleSubscriptionUsageHistoryLogic(
            buildDeps({
              subscriptionsService: {
                listCustomerSubscriptions: jest.fn(async () => []),
              } as any,
            }),
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleSubscriptionUsageHistoryLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', subscriptionId: 'sub-1' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
    });

    it('lists gift cards, bookings, and no-shows', async () => {
      expect(
        (
          await handleListCustomerGiftCardsLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleListCustomerBookingsLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleCustomerNoShowHistoryLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleListCustomerGiftCardsLogic(
            buildDeps(),
            'biz-1',
            {},
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
    });

    it('lists customers with filters and formats the summary', async () => {
      const deps = buildDeps();
      const result = await handleListCustomersLogic(deps, 'biz-1', {
        searchTerm: 'anna',
        isVip: true,
        limit: 5,
      });
      expect(result.success).toBe(true);
      expect(result.action).toBe('list_customers');
      expect(deps.customerService.searchDashboard).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ search: 'anna', isVip: true, pageSize: 5 }),
      );
      expect(result.summary).toContain('2 customer(s) matching filters');
      expect(result.summary).toContain('Anna Lopez (VIP) — vip');
      expect(result.summary).toContain('Bob Smith — new, tags: waitlist');
      expect((result.details as any).totalItems).toBe(2);
    });

    it('reports no matches without implying filters were applied', async () => {
      const deps = buildDeps({
        customerService: {
          searchDashboard: jest.fn(async () => ({
            stats: {
              totalCustomers: 0,
              filteredCustomers: 0,
              totalAppointments: 0,
              appointmentsByStatus: {},
            },
            customers: [],
            totalItems: 0,
            page: 1,
            pageSize: 20,
          })),
        } as any,
      });
      const result = await handleListCustomersLogic(deps, 'biz-1', {});
      expect(result.success).toBe(true);
      expect(result.summary).toBe('No customers found.');
    });

    it('ignores an unrecognized tag/segment rather than passing it through', async () => {
      const deps = buildDeps();
      await handleListCustomersLogic(deps, 'biz-1', {
        tags: 'not-a-real-tag',
        segment: 'not-a-real-segment',
      });
      expect(deps.customerService.searchDashboard).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ tags: undefined, segment: undefined }),
      );
    });
  });

  describe('dashboard CRM mutate handlers', () => {
    it('extends and cancels subscriptions', async () => {
      expect(
        (
          await handleExtendSubscriptionLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleExtendSubscriptionLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', extendMonths: 3, subscriptionId: 'sub-1' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleCancelSubscriptionAdminLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', subscriptionId: 'sub-1' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleExtendSubscriptionLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', extendMonths: 2, subscriptionId: 'sub-1' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleCancelSubscriptionAdminLogic(
            buildDeps(),
            'biz-1',
            {},
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
    });

    it('tags, exports, deletes, and re-engages customers', async () => {
      expect(
        (
          await handleTagCustomerLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', tag: 'vip' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleTagCustomerLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', tag: 'at_risk' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleTagCustomerLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', tag: 'invalid' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleExportCustomerDataLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleDeleteCustomerDataLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleSendReengagementMessageLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', message: 'Come back!' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleSendReengagementMessageLogic(
            buildDeps({
              zendeskService: {
                createSupportTicket: jest.fn(async () => {
                  throw new Error('zendesk');
                }),
              } as any,
            }),
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
    });

    it('updates customer profile fields', async () => {
      expect(
        (
          await handleUpdateCustomerLogic(
            buildDeps(),
            'biz-1',
            {},
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleUpdateCustomerLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      const updated = await handleUpdateCustomerLogic(
        buildDeps(),
        'biz-1',
        { customerName: 'Anna', email: 'anna@new.com', isVip: true },
        customers,
        resolveCustomer,
      );
      expect(updated.success).toBe(true);
      expect(updated.details.customerId).toBe('c1');
      expect(
        (
          await handleUpdateCustomerLogic(
            buildDeps({
              customerService: {
                update: jest.fn(async () => {
                  throw new Error('update failed');
                }),
              } as any,
            }),
            'biz-1',
            { customerName: 'Anna', phone: '555-0100' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
    });

    it('merges customers', async () => {
      expect(
        (
          await handleMergeCustomersLogic(
            buildDeps(),
            'biz-1',
            { primaryCustomerId: 'c1', secondaryCustomerId: 'c2' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleMergeCustomersLogic(
            buildDeps(),
            'biz-1',
            { primaryCustomerName: 'Anna', secondaryCustomerName: 'Bob' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleMergeCustomersLogic(
            buildDeps(),
            'biz-1',
            { primaryCustomerId: 'c1', secondaryCustomerId: 'c1' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleMergeCustomersLogic(
            buildDeps(),
            'biz-1',
            { primaryCustomerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleMergeCustomersLogic(
            buildDeps(),
            'biz-1',
            { secondaryCustomerName: 'Bob' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
    });
  });

  describe('customer account handlers', () => {
    it('handles my_* read intents', async () => {
      expect(
        (await handleMyProfileLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (
          await handleMyProfileLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleMyAppointmentsLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleMySubscriptionsLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleMySubscriptionsLogic(
            buildDeps({
              subscriptionsService: {
                listCustomerSubscriptions: jest.fn(async () => []),
              } as any,
            }),
            'biz-1',
            { sessionCustomerId: 'c1' },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleSubscriptionUsageLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleSubscriptionUsageLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
            subscriptionId: 'sub-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleSubscriptionUsageLogic(
            buildDeps({
              subscriptionsService: {
                listCustomerSubscriptions: jest.fn(async () => []),
              } as any,
            }),
            'biz-1',
            { sessionCustomerId: 'c1' },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleMyGiftCardsLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleGiftCardRedemptionHistoryLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
    });

    it('handles gift card balance and tracking', async () => {
      expect(
        (
          await handleGiftCardBalanceLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleGiftCardBalanceLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
            giftCardCode: 'GIFT1234',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleGiftCardBalanceLogic(
            buildDeps({
              giftCardOrderService: {
                listCustomerGiftCardAccount: jest.fn(async () => ({
                  orders: [{ id: 'gc-3', code: 'X' }],
                  redeemed: [],
                })),
              } as any,
            }),
            'biz-1',
            { sessionCustomerId: 'c1' },
          )
        ).summary,
      ).toContain('n/a');
      expect(
        (
          await handleGiftCardBalanceLogic(
            buildDeps({
              giftCardOrderService: {
                listCustomerGiftCardAccount: jest.fn(async () => ({
                  orders: [],
                  redeemed: [],
                })),
              } as any,
            }),
            'biz-1',
            { sessionCustomerId: 'c1' },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleTrackPhysicalGiftCardOrderLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleTrackPhysicalGiftCardOrderLogic(
            buildDeps({
              giftCardOrderService: {
                listCustomerGiftCardAccount: jest.fn(async () => ({
                  orders: [{ id: 'gc-d', deliveryMethod: 'digital' }],
                  redeemed: [],
                })),
              } as any,
            }),
            'biz-1',
            { sessionCustomerId: 'c1' },
          )
        ).success,
      ).toBe(false);
    });

    it('explains a single gift card order', async () => {
      expect(
        (await handleExplainGiftCardOrderLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (
          await handleExplainGiftCardOrderLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
          })
        ).details?.clarify,
      ).toBe(true);
      const found = await handleExplainGiftCardOrderLogic(
        buildDeps({
          giftCardOrderService: {
            getCustomerOrder: jest.fn(async () => ({
              id: 'gc-1',
              cardType: 'monetary',
              balance: 25,
              deliveryMethod: 'digital',
              fulfillmentStatus: 'delivered',
            })),
          } as any,
        }),
        'biz-1',
        { sessionCustomerId: 'c1', giftCardId: 'gc-1' },
      );
      expect(found.success).toBe(true);
      expect(found.summary).toContain('25.00');
      const notFound = await handleExplainGiftCardOrderLogic(
        buildDeps({
          giftCardOrderService: {
            getCustomerOrder: jest.fn(async () => {
              throw new Error('Gift card not found');
            }),
          } as any,
        }),
        'biz-1',
        { sessionCustomerId: 'c1', giftCardId: 'missing' },
      );
      expect(notFound.success).toBe(false);
    });

    it('handles gift card cancel/modify and privacy', async () => {
      expect(
        (
          await handleRequestGiftCardCancelLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
            giftCardId: 'gc-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleRequestGiftCardCancelLogic(
            buildDeps({
              giftCardOrderService: {
                submitCancelRequest: jest.fn(async () => {
                  throw new Error('not allowed');
                }),
              } as any,
            }),
            'biz-1',
            { sessionCustomerId: 'c1', giftCardId: 'gc-1' },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleRequestGiftCardCancelLogic(
            buildDeps({
              giftCardOrderService: {
                submitCancelRequest: jest.fn(async () => {
                  throw { message: undefined };
                }),
              } as any,
            }),
            'biz-1',
            { sessionCustomerId: 'c1', giftCardId: 'gc-1' },
          )
        ).summary,
      ).toContain('Cancel not available');
      expect(
        (
          await handleRequestGiftCardModifyLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
            giftCardId: 'gc-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleRequestGiftCardModifyLogic(
            buildDeps({
              giftCardRepo: { findOne: jest.fn(async () => null) } as any,
            }),
            'biz-1',
            { sessionCustomerId: 'c1', giftCardId: 'gc-1' },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleRequestGiftCardModifyLogic(
            buildDeps({
              zendeskService: {
                createGiftCardChangeTicket: jest.fn(async () => {
                  throw new Error('zendesk');
                }),
              } as any,
            }),
            'biz-1',
            { sessionCustomerId: 'c1', giftCardId: 'gc-1' },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handlePrivacyExportLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handlePrivacyDeleteLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
            confirm: true,
          })
        ).success,
      ).toBe(true);
    });
  });

  describe('discovery handlers', () => {
    it('discovers packages, plans, and gift card products', async () => {
      const discovered = await handleDiscoverPackagesLogic(
        buildDeps(),
        'biz-1',
      );
      expect(discovered.success).toBe(true);
      expect(discovered.details?.navigate).toEqual({
        path: 'packages',
        query: {},
      });
      expect(
        (
          await handleDiscoverPackagesLogic(
            {
              packagesService: { listPackages: jest.fn(async () => []) } as any,
            },
            'biz-1',
          )
        ).success,
      ).toBe(true);
      expect(
        (await handleDiscoverSubscriptionPlansLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(true);
      expect(
        (
          await handleDiscoverSubscriptionPlansLogic(
            {
              subscriptionsService: {
                listPlans: jest.fn(async () => []),
              } as any,
            },
            'biz-1',
            {},
          )
        ).summary,
      ).toContain('No subscription plans');
      expect(
        (await handleDiscoverGiftCardProductsLogic(buildDeps(), 'biz-1'))
          .success,
      ).toBe(true);
      expect(
        (
          await handleDiscoverGiftCardProductsLogic(
            { businessRepo: { findOne: jest.fn(async () => null) } as any },
            'biz-1',
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleDiscoverGiftCardProductsLogic(
            {
              businessRepo: {
                findOne: jest.fn(async () => ({
                  id: 'biz-1',
                  settings: {
                    giftCards: { purchaseEnabled: false, presetAmounts: [] },
                  },
                })),
              } as any,
            },
            'biz-1',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleDiscoverGiftCardProductsLogic(
            {
              businessRepo: {
                findOne: jest.fn(async () => ({
                  id: 'biz-1',
                  settings: {
                    giftCards: { purchaseEnabled: true, presetAmounts: [] },
                  },
                })),
              } as any,
            },
            'biz-1',
          )
        ).summary,
      ).toContain('custom');
    });
  });

  describe('handleCrmCompoundLogic', () => {
    it('runs multi-step CRM compound and handles failures', async () => {
      const ok = await handleCrmCompoundLogic(
        buildDeps(),
        'biz-1',
        "List Anna's subscriptions and show her gift cards",
        {},
        customers,
        resolveCustomer,
        'user-1',
      );
      expect(ok.success).toBe(true);
      expect((ok.details as any).crmCompound).toBe(true);

      const fail = await handleCrmCompoundLogic(
        buildDeps(),
        'biz-1',
        'hello world',
        {},
        customers,
        resolveCustomer,
      );
      expect(fail.success).toBe(false);

      const stopped = await handleCrmCompoundLogic(
        buildDeps(),
        'biz-1',
        'unused',
        {
          compoundSteps: [
            {
              action: 'list_customer_subscriptions',
              params: { customerName: 'Anna' },
              segment: 'a',
            },
            {
              action: 'extend_subscription',
              params: { customerName: 'Anna' },
              segment: 'b',
            },
          ],
        },
        customers,
        resolveCustomer,
      );
      expect(stopped.success).toBe(false);

      const exportCompound = await handleCrmCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'export_customer_data',
              params: { customerName: 'Anna' },
              segment: 'a',
            },
            {
              action: 'extend_subscription',
              params: {
                customerName: 'Anna',
                extendMonths: 2,
                planName: 'Nail Plan',
              },
              segment: 'b',
            },
          ],
        },
        customers,
        resolveCustomer,
      );
      expect(exportCompound.success).toBe(true);

      const usageCompound = await handleCrmCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'subscription_usage_history',
              params: { customerName: 'Anna', subscriptionId: 'sub-1' },
              segment: 'a',
            },
            {
              action: 'customer_no_show_history',
              params: { customerName: 'Anna' },
              segment: 'b',
            },
          ],
        },
        customers,
        resolveCustomer,
      );
      expect(usageCompound.success).toBe(true);

      const discoverCompound = await handleCrmCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'my_gift_cards',
              params: { sessionCustomerId: 'c1' },
              segment: 'a',
            },
            {
              action: 'gift_card_balance',
              params: { sessionCustomerId: 'c1' },
              segment: 'b',
            },
            { action: 'discover_packages', params: {}, segment: 'c' },
            { action: 'discover_subscription_plans', params: {}, segment: 'd' },
          ],
        },
        customers,
        resolveCustomer,
      );
      expect(discoverCompound.success).toBe(true);

      const giftDiscoverCompound = await handleCrmCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            { action: 'discover_gift_card_products', params: {}, segment: 'a' },
            {
              action: 'list_customer_gift_cards',
              params: { customerName: 'Anna' },
              segment: 'b',
            },
          ],
        },
        customers,
        resolveCustomer,
      );
      expect(giftDiscoverCompound.success).toBe(true);

      const bookingsCompound = await handleCrmCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'list_customer_bookings',
              params: { customerName: 'Anna' },
              segment: 'a',
            },
            {
              action: 'tag_customer',
              params: { customerName: 'Anna', tag: 'vip' },
              segment: 'b',
            },
            {
              action: 'my_appointments',
              params: { sessionCustomerId: 'c1' },
              segment: 'c',
            },
            {
              action: 'my_subscriptions',
              params: { sessionCustomerId: 'c1' },
              segment: 'd',
            },
            {
              action: 'my_gift_cards',
              params: { sessionCustomerId: 'c1' },
              segment: 'e',
            },
            {
              action: 'gift_card_balance',
              params: { sessionCustomerId: 'c1' },
              segment: 'f',
            },
            { action: 'discover_packages', params: {}, segment: 'g' },
            { action: 'discover_subscription_plans', params: {}, segment: 'h' },
            { action: 'discover_gift_card_products', params: {}, segment: 'i' },
          ],
        },
        customers,
        resolveCustomer,
      );
      expect(bookingsCompound.success).toBe(true);

      const unsupported = await handleCrmCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            { action: 'merge_customers' as any, params: {}, segment: 'a' },
            {
              action: 'list_customer_subscriptions',
              params: { customerName: 'Anna' },
              segment: 'b',
            },
          ],
        },
        customers,
        resolveCustomer,
      );
      expect(unsupported.success).toBe(false);
    });
  });

  describe('resolveCustomer branches', () => {
    it('resolves by customerId and planName', async () => {
      expect(
        (
          await handleListCustomerSubscriptionsLogic(
            buildDeps(),
            'biz-1',
            { customerId: 'c1' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleListCustomerSubscriptionsLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Lopez' },
            customers,
            undefined,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleSubscriptionUsageHistoryLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', planName: 'Nail Plan' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      const subNoPlan = {
        id: 'sub-2',
        appointmentsRemaining: 1,
        expiresAt: new Date(),
      };
      expect(
        (
          await handleSubscriptionUsageHistoryLogic(
            buildDeps({
              subscriptionsService: {
                listCustomerSubscriptions: jest.fn(async () => [subNoPlan]),
                getUsageHistory: jest.fn(async () => ({
                  usage: [],
                  subscription: subNoPlan,
                })),
              } as any,
            }),
            'biz-1',
            { customerName: 'Anna', planName: 'sub-2' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleExtendSubscriptionLogic(
            buildDeps({
              subscriptionsService: {
                listCustomerSubscriptions: jest.fn(async () => [subNoPlan]),
              } as any,
            }),
            'biz-1',
            { customerName: 'Anna', extendMonths: 1, planName: 'sub-2' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleCancelSubscriptionAdminLogic(
            buildDeps({
              subscriptionsService: {
                listCustomerSubscriptions: jest.fn(async () => [subNoPlan]),
                cancelSubscription: jest.fn(async () => ({
                  subscription: subNoPlan,
                  refundStatus: undefined,
                })),
              } as any,
            }),
            'biz-1',
            { customerName: 'Anna', planName: 'sub-2' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleExtendSubscriptionLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', extendMonths: 1, planName: 'Nail Plan' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleCancelSubscriptionAdminLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', planName: 'Nail Plan' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleCancelSubscriptionAdminLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', planName: 'Missing Plan' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleCancelSubscriptionAdminLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleExtendSubscriptionLogic(
            buildDeps({
              subscriptionsService: {
                listCustomerSubscriptions: jest.fn(async () => []),
              } as any,
            }),
            'biz-1',
            { customerName: 'Anna', extendMonths: 1 },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
    });

    it('covers remaining failure branches', async () => {
      expect(
        (
          await handleListCustomerBookingsLogic(
            buildDeps(),
            'biz-1',
            {},
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleCustomerNoShowHistoryLogic(
            buildDeps(),
            'biz-1',
            {},
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleTagCustomerLogic(
            buildDeps(),
            'biz-1',
            {},
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleExportCustomerDataLogic(
            buildDeps(),
            'biz-1',
            {},
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleDeleteCustomerDataLogic(
            buildDeps(),
            'biz-1',
            {},
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleSendReengagementMessageLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Missing' },
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (await handleMyAppointmentsLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (await handleMySubscriptionsLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (await handleSubscriptionUsageLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (await handleMyGiftCardsLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (await handleGiftCardBalanceLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (await handleGiftCardRedemptionHistoryLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (await handleRequestGiftCardCancelLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (await handleRequestGiftCardModifyLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (await handleTrackPhysicalGiftCardOrderLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (
          await handleTrackPhysicalGiftCardOrderLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
            giftCardId: 'gc-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleTrackPhysicalGiftCardOrderLogic(buildDeps(), 'biz-1', {
            sessionCustomerId: 'c1',
            giftCardId: 'missing',
          })
        ).success,
      ).toBe(false);
      expect(
        (await handlePrivacyExportLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (await handlePrivacyDeleteLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
    });

    it('modify gift card with service credits and zendesk ticket id', async () => {
      const deps = buildDeps({
        giftCardRepo: {
          findOne: jest.fn(async () => ({
            id: 'gc-1',
            code: 'GIFT1234',
            cardType: 'service',
            deliveryMethod: 'digital',
            fulfillmentStatus: 'delivered',
            purchaseAmount: 80,
            balance: 80,
            serviceCredits: [{ serviceName: 'Massage', quantityRemaining: 2 }],
          })),
        } as any,
      });
      const named = await handleRequestGiftCardModifyLogic(deps, 'biz-1', {
        sessionCustomerId: 'c1',
        giftCardId: 'gc-1',
        modifyPayload: { recipientName: 'New Name' },
      });
      expect(named.success).toBe(true);

      const idOnlyDeps = buildDeps({
        giftCardRepo: {
          findOne: jest.fn(async () => ({
            id: 'gc-1',
            code: 'GIFT1234',
            cardType: 'service',
            deliveryMethod: 'digital',
            fulfillmentStatus: 'delivered',
            purchaseAmount: 80,
            balance: 80,
            serviceCredits: [{ serviceId: 's2', quantityRemaining: 1 }],
          })),
        } as any,
      });
      const byId = await handleRequestGiftCardModifyLogic(idOnlyDeps, 'biz-1', {
        sessionCustomerId: 'c1',
        giftCardId: 'gc-1',
      });
      expect(byId.success).toBe(true);
      expect(
        idOnlyDeps.zendeskService.createGiftCardChangeTicket,
      ).toHaveBeenCalled();

      const noCreditsDeps = buildDeps({
        giftCardRepo: {
          findOne: jest.fn(async () => ({
            id: 'gc-1',
            code: 'GIFT1234',
            cardType: 'monetary',
            deliveryMethod: 'digital',
            fulfillmentStatus: 'delivered',
            purchaseAmount: 50,
            balance: 50,
            serviceCredits: undefined,
          })),
        } as any,
      });
      expect(
        (
          await handleRequestGiftCardModifyLogic(noCreditsDeps, 'biz-1', {
            sessionCustomerId: 'c1',
            giftCardId: 'gc-1',
          })
        ).success,
      ).toBe(true);
    });

    it('tracks physical order with default processing status', async () => {
      const result = await handleTrackPhysicalGiftCardOrderLogic(
        buildDeps({
          giftCardOrderService: {
            listCustomerGiftCardAccount: jest.fn(async () => ({
              orders: [{ id: 'gc-1', deliveryMethod: 'physical' }],
              redeemed: [],
            })),
          } as any,
        }),
        'biz-1',
        { sessionCustomerId: 'c1' },
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('processing');
    });
  });
});

/**
 * e2e-bug.488 — a tie must name the candidates, not read as "who?".
 *
 * tech-debt D5-b stopped these handlers mutating the wrong namesake: when two
 * customers are called "Anna", the injected resolver returns `undefined` rather
 * than whichever row sorted first. Safe, but every handler rendered that as its
 * not-found clarify — "Specify which customer" — which tells the caller the
 * name is unknown when it actually matched twice, and withholds the only thing
 * that would let them choose.
 *
 * The two cases are pinned together on purpose: the fix must separate them, and
 * a guard that fired on a genuine miss too would be a regression, not a fix.
 */
describe('e2e-bug.488 — ambiguous customer names name their candidates', () => {
  const twoAnnas = [
    { id: 'cust-a', name: 'Anna Petrosyan', email: 'a@example.com' },
    { id: 'cust-b', name: 'Anna Sargsyan', email: 'b@example.com' },
  ] as any;

  /** Mirrors `resolveCustomerStrict`: refuse a tie, and say who tied. */
  const strictResolver = (list: any[], name: string, onAmbiguous?: any) => {
    const hits = list.filter((c) =>
      c.name.toLowerCase().includes(name.toLowerCase()),
    );
    if (hits.length > 1) {
      onAmbiguous?.({
        candidates: hits.map((c) => ({ id: c.id, name: c.name })),
        clarification: `Which customer did you mean by "${name}"?`,
      });
      return undefined;
    }
    return hits[0];
  };

  it('refuses with both names instead of the generic clarify', async () => {
    const result = await handleListCustomerSubscriptionsLogic(
      buildDeps(),
      'biz-1',
      { customerName: 'Anna' },
      twoAnnas,
      strictResolver,
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Anna');
    expect(result.summary).not.toContain('Specify which customer');
    expect(result.details?.candidates).toEqual([
      { id: 'cust-a', name: 'Anna Petrosyan' },
      { id: 'cust-b', name: 'Anna Sargsyan' },
    ]);
  });

  it('still refuses — it does not pick one of the namesakes', async () => {
    // The D5-b guarantee this sits on top of. If a future edit made the
    // resolver fall back to "first match" the message above would still look
    // fine, so assert the mutation did not happen rather than only the wording.
    const deps = buildDeps();
    const result = await handleListCustomerSubscriptionsLogic(
      deps,
      'biz-1',
      { customerName: 'Anna' },
      twoAnnas,
      strictResolver,
    );
    expect(result.success).toBe(false);
    expect(
      (deps.subscriptionsService.listCustomerSubscriptions as jest.Mock).mock
        .calls,
    ).toHaveLength(0);
  });

  it('leaves the genuine not-found message alone', async () => {
    // The guard must fire only on a tie. A name that matches nobody is a real
    // miss and keeps the handler's own wording, which names an example.
    const result = await handleListCustomerSubscriptionsLogic(
      buildDeps(),
      'biz-1',
      { customerName: 'Nobody' },
      twoAnnas,
      strictResolver,
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Specify which customer');
    expect(result.details?.candidates).toBeUndefined();
  });

  it('an unambiguous name still resolves', async () => {
    const result = await handleListCustomerSubscriptionsLogic(
      buildDeps(),
      'biz-1',
      { customerName: 'Anna Petrosyan' },
      twoAnnas,
      strictResolver,
    );
    expect(result.success).toBe(true);
  });
});
