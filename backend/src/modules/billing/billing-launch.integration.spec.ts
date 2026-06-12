import { PlanEntitlementsService } from './plan-entitlements.service.js';
import { PlanLimitExceededException } from './plan-limit.exception.js';
import { BillingService } from './billing.service.js';
import { EmployeeService } from '../employee/employee.service.js';
import { PromoCodesService } from '../promo-codes/promo-codes.service.js';
import { GiftCardsService } from '../gift-cards/gift-cards.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { StripeIntegrationService } from './stripe-integration.service.js';
import { AiGatewayService } from '../ai/ai-gateway.service.js';
import { LoyaltyController } from '../loyalty/loyalty.controller.js';
import { SubscriptionStatus } from './subscription-status.enum.js';
import { createAiGatewayPlatformMocks } from '../ai/ai-gateway.test-mocks.js';
import { PromoDiscountType } from '../promo-codes/entities/promo-code.entity.js';
import { SubscriptionDiscountType } from '../service-subscriptions/entities/subscription.entity.js';

/**
 * Sprint 12.a launch billing — integration flows across entitlements, checkout, and enforcement.
 */
describe('Sprint 12.a billing launch integration', () => {
  const businessSolo = {
    id: 'biz-solo',
    name: 'Solo Salon',
    email: 'solo@salon.com',
    settings: {},
    subscriptionPlanId: null,
    subscriptionStatus: SubscriptionStatus.INACTIVE,
  };

  const businessStarter = {
    id: 'biz-starter',
    name: 'Starter Salon',
    email: 'starter@salon.com',
    settings: { integrations: {} },
    subscriptionPlanId: 'starter',
    subscriptionStatus: SubscriptionStatus.ACTIVE,
  };

  const businessRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (b: Record<string, unknown>) => b),
  };

  const employeeRepo = {
    count: jest.fn(),
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(async (v: Record<string, unknown>) => ({
      id: 'emp-new',
      ...v,
    })),
    findOne: jest.fn(),
  };

  const serviceRepo = {
    count: jest.fn(async () => 0),
    findOne: jest.fn(),
  };

  const aiUsageService = {
    getMonthlySummary: jest.fn(async () => ({
      bySurface: [{ surface: 'dashboard', requests: 0 }],
    })),
  };

  const planEntitlements = new PlanEntitlementsService(
    businessRepo as any,
    employeeRepo as any,
    aiUsageService as any,
  );

  const eventStore = { publish: jest.fn(async () => undefined) };
  const tenantContactService = {
    assertEmailAvailableInTenant: jest.fn(async () => undefined),
    assertPhoneAvailableInTenant: jest.fn(async () => undefined),
  };

  const employeeService = new EmployeeService(
    employeeRepo as any,
    { findOne: jest.fn() } as any,
    serviceRepo as any,
    eventStore as any,
    tenantContactService as any,
    planEntitlements,
  );

  const promoRepo = {
    findOne: jest.fn(async () => null),
    save: jest.fn(async (v: Record<string, unknown>) => v),
    create: jest.fn((v: Record<string, unknown>) => v),
  };

  const promoCodesService = new PromoCodesService(
    promoRepo as any,
    planEntitlements,
  );

  const giftCardRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(async (v: Record<string, unknown>) => ({ id: 'gc-1', ...v })),
    find: jest.fn(async () => []),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const giftCardsService = new GiftCardsService(
    giftCardRepo as any,
    { create: jest.fn(), save: jest.fn() } as any,
    { create: jest.fn(), save: jest.fn() } as any,
    { create: jest.fn(), save: jest.fn() } as any,
    planEntitlements,
  );

  const planRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(async (v: Record<string, unknown>) => ({
      id: 'sub-plan-1',
      ...v,
    })),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const subscriptionsService = new ServiceSubscriptionsService(
    planRepo as any,
    {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    } as any,
    {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    } as any,
    {
      findOne: jest.fn(async () => ({
        id: 'svc-1',
        businessId: 'biz-starter',
        isActive: true,
        price: 50,
        durationMinutes: 60,
        currency: 'USD',
      })),
    } as any,
    { findOne: jest.fn() } as any,
    businessRepo as any,
    planEntitlements,
    { announceCatalogChange: jest.fn() } as any,
  );

  const stripeSessionsCreate = jest.fn();
  const stripeService = {
    isConfigured: true,
    isOAuthConfigured: jest.fn(() => false),
    frontendUrl: 'http://localhost:3000',
    webhookSecret: 'whsec',
    connectClientId: null,
    client: {
      customers: { create: jest.fn(async () => ({ id: 'cus_1' })) },
      checkout: { sessions: { create: stripeSessionsCreate } },
      subscriptions: { retrieve: jest.fn() },
      webhooks: { constructEvent: jest.fn() },
      accounts: { retrieve: jest.fn() },
      accountLinks: { create: jest.fn() },
    },
  };

  const billingService = new BillingService(
    businessRepo as any,
    stripeService as any,
    { handleCheckoutCompleted: jest.fn() } as any,
  );

  const stripeIntegration = new StripeIntegrationService(
    businessRepo as any,
    stripeService as any,
    planEntitlements,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockImplementation(
      async ({ where }: { where: { id: string } }) => {
        if (where.id === 'biz-solo') return { ...businessSolo };
        if (where.id === 'biz-starter')
          return { ...businessSolo, ...businessStarter, id: 'biz-starter' };
        return null;
      },
    );
    employeeRepo.count.mockResolvedValue(0);
    stripeSessionsCreate.mockResolvedValue({
      url: 'https://checkout.stripe.test/annual',
    });
  });

  describe('plan entitlements API shape', () => {
    it('solo tier blocks monetization flags', async () => {
      const view = await planEntitlements.getEntitlements('biz-solo');
      expect(view.tierId).toBe('solo');
      expect(view.flags.giftCards).toBe(false);
      expect(view.flags.promoCodes).toBe(false);
      expect(view.flags.stripeConnect).toBe(false);
    });

    it('starter tier unlocks stripe and promo', async () => {
      const view = await planEntitlements.getEntitlements('biz-starter');
      expect(view.tierId).toBe('starter');
      expect(view.isPaid).toBe(true);
      expect(view.flags.promoCodes).toBe(true);
      expect(view.flags.stripeConnect).toBe(true);
    });
  });

  describe('provider seat enforcement', () => {
    it('blocks second employee on solo plan', async () => {
      employeeRepo.count.mockResolvedValue(1);
      await expect(
        employeeService.create('biz-solo', {
          name: 'Second Chair',
          phone: '+37491123456',
          serviceIds: ['svc-1'],
        }),
      ).rejects.toThrow(PlanLimitExceededException);
    });

    it('allows additional employee on starter within seat cap', async () => {
      employeeRepo.count.mockResolvedValue(2);
      const created = await employeeService.create('biz-starter', {
        name: 'Third Chair',
        phone: '+37491123457',
        serviceIds: ['svc-1'],
      });
      expect(created.name).toBe('Third Chair');
    });
  });

  describe('monetization feature gates', () => {
    it('blocks promo code creation on solo', async () => {
      await expect(
        promoCodesService.create('biz-solo', {
          code: 'SAVE10',
          discountType: PromoDiscountType.PERCENT,
          discountValue: 10,
        }),
      ).rejects.toThrow(PlanLimitExceededException);
    });

    it('allows promo code creation on starter', async () => {
      const promo = await promoCodesService.create('biz-starter', {
        code: 'SAVE10',
        discountType: PromoDiscountType.PERCENT,
        discountValue: 10,
      });
      expect(promo.code).toBe('SAVE10');
    });

    it('blocks gift card issuance on solo', async () => {
      await expect(
        giftCardsService.create('biz-solo', { amount: 50 }),
      ).rejects.toThrow(PlanLimitExceededException);
    });

    it('blocks membership plan creation on starter (growth feature)', async () => {
      await expect(
        subscriptionsService.createPlan('biz-starter', {
          name: 'Monthly facial',
          serviceId: 'svc-1',
          durationMonths: 3,
          includedAppointments: 6,
          discountType: SubscriptionDiscountType.PERCENT,
          discountValue: 10,
        }),
      ).rejects.toThrow(PlanLimitExceededException);
    });
  });

  describe('Stripe Connect gating', () => {
    it('blocks connect onboarding on solo', async () => {
      await expect(stripeIntegration.startConnect('biz-solo')).rejects.toThrow(
        PlanLimitExceededException,
      );
    });
  });

  describe('annual vs monthly checkout', () => {
    it('creates annual stripe session with yearly interval and metadata', async () => {
      await billingService.createCheckoutSession(
        'biz-solo',
        'starter',
        'solo@salon.com',
        'year',
      );
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ billingInterval: 'year' }),
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                recurring: { interval: 'year' },
                unit_amount: 18200,
              }),
            }),
          ],
        }),
      );
    });

    it('defaults to monthly billing interval', async () => {
      await billingService.createCheckoutSession(
        'biz-solo',
        'starter',
        'solo@salon.com',
      );
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ billingInterval: 'month' }),
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({ unit_amount: 1900 }),
            }),
          ],
        }),
      );
    });
  });

  describe('AI command limit via gateway', () => {
    const promptSecurity = {
      preflightBlock: jest.fn(() => null),
    };
    const entityMemory = {
      buildMemoryContextBlock: jest.fn(async () => ''),
      getEntityMemory: jest.fn(async () => ({ aliases: {} })),
      learnFromCommand: jest.fn(),
    };
    const conversationSummary = {
      prepareHistoryForClassifier: jest.fn(async () => ({
        history: [],
        summaryBlock: '',
      })),
    };
    const rag = { buildRagContextBlock: jest.fn(async () => '') };
    const dashboardCommands = {
      executeCommand: jest.fn(async () => ({
        summary: 'ok',
        success: true,
        action: 'noop',
      })),
    };
    const { aiSettings, platform, commandTrace } = createAiGatewayPlatformMocks();

    const gateway = new AiGatewayService(
      dashboardCommands as any,
      { executeCommand: jest.fn() } as any,
      { executeCommand: jest.fn() } as any,
      entityMemory as any,
      conversationSummary as any,
      rag as any,
      promptSecurity as any,
      planEntitlements,
      aiSettings as any,
      platform as any,
      commandTrace as any,
    );

    it('blocks dashboard AI when monthly command cap reached', async () => {
      businessRepo.findOne.mockResolvedValue({ ...businessSolo });
      aiUsageService.getMonthlySummary.mockResolvedValue({
        bySurface: [{ surface: 'dashboard', requests: 25 }],
      });
      await expect(
        gateway.execute({
          surface: 'dashboard',
          businessId: 'biz-solo',
          prompt: 'cancel tomorrow',
          membershipRole: 'owner',
        }),
      ).rejects.toThrow(PlanLimitExceededException);
      expect(dashboardCommands.executeCommand).not.toHaveBeenCalled();
    });

    it('does not check dashboard AI limits on provider mobile surface', async () => {
      businessRepo.findOne.mockResolvedValue({ ...businessSolo });
      aiUsageService.getMonthlySummary.mockResolvedValue({
        bySurface: [{ surface: 'dashboard', requests: 25 }],
      });
      const providerCommands = {
        executeCommand: jest.fn(async () => ({
          summary: 'mobile ok',
          success: true,
        })),
      };
      const mobileGateway = new AiGatewayService(
        dashboardCommands as any,
        { executeCommand: jest.fn() } as any,
        providerCommands as any,
        entityMemory as any,
        conversationSummary as any,
        rag as any,
        promptSecurity as any,
        planEntitlements,
        aiSettings as any,
        platform as any,
        commandTrace as any,
      );
      await mobileGateway.execute({
        surface: 'provider',
        businessId: 'biz-solo',
        prompt: 'my schedule',
        membershipRole: 'staff',
        userId: 'user-1',
      });
      expect(providerCommands.executeCommand).toHaveBeenCalled();
    });
  });

  describe('loyalty settings gate', () => {
    const businessService = {
      ensureMember: jest.fn(async () => undefined),
      findOne: jest.fn(async (id: string) =>
        id === 'biz-solo'
          ? { ...businessSolo, settings: {} }
          : { ...businessStarter, settings: {} },
      ),
      update: jest.fn(async () => undefined),
    };

    const loyaltyController = new LoyaltyController(
      { getBalance: jest.fn(), adjust: jest.fn(), redeem: jest.fn() } as any,
      businessService as any,
      planEntitlements,
    );

    it('blocks loyalty settings update on solo', async () => {
      await expect(
        loyaltyController.updateSettings(
          'biz-solo',
          { earnPercentCashback: 5 },
          { id: 'user-1' },
        ),
      ).rejects.toThrow(PlanLimitExceededException);
    });
  });
});
