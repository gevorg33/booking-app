import {
  handleBulkUpdateServiceCurrencyLogic,
  handleConfigureBusinessCurrencyLogic,
  handleExplainBusinessCurrencyLogic,
  handleExplainCheckoutCurrencyLogic,
  handleExplainTenantCurrencyLogic,
  handleExplainPackageCurrencyLogic,
  handleExplainNotificationCurrencyLogic,
  handleExplainStripeCurrencyWarningLogic,
  handleExplainStripeCheckoutCurrencyLogic,
  handleDiagnoseStripeCheckoutFailureLogic,
  handleExplainReportsCurrencyLogic,
  handleSummarizeRevenueKpisLogic,
  handleExplainProviderPaymentCurrencyLogic,
} from './ai-business-currency.logic.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { ServicePackage } from '../service-packages/entities/service-package.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

describe('ai-business-currency.logic (ai-cmd-curr-1..3)', () => {
  const business: Business = makeBusiness({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: { currency: 'USD' },
  });

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };

  const serviceRepo = {
    find: jest.fn(async () => [] as Service[]),
    update: jest.fn(async () => ({ affected: 1 })),
  };

  const packageRepo = {
    find: jest.fn(async () => [] as ServicePackage[]),
  };

  const dashboardService = {
    getOverview: jest.fn(async () => ({
      todaysBookings: 2,
      activeEmployees: 3,
      services: 5,
      totalCustomers: 40,
      utilizationPercent: 65,
      revenueThisMonth: 12000,
      taxCollectedThisMonth: 1200,
      netRevenueThisMonth: 10800,
      currency: 'USD',
      bookingsThisMonth: 18,
      noShowCount: 1,
      noShowRatePercent: 5,
      completedThisMonth: 15,
    })),
  };

  const analyticsService = {
    staffPerformance: jest.fn(async () => ({
      currency: 'USD',
      rows: [
        {
          employeeName: 'Alex',
          bookings: 10,
          revenue: 7000,
          utilizationPercent: 80,
        },
        {
          employeeName: 'Sam',
          bookings: 8,
          revenue: 5000,
          utilizationPercent: 70,
        },
      ],
    })),
    servicePopularity: jest.fn(async () => ({
      currency: 'USD',
      rows: [
        { serviceName: 'Cut', bookings: 12, revenue: 6000 },
        { serviceName: 'Color', bookings: 6, revenue: 6000 },
      ],
    })),
  };

  const deps = () => ({
    businessRepo,
    serviceRepo,
    packageRepo,
    dashboardService,
    analyticsService,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = { currency: 'USD' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([]);
    packageRepo.find.mockResolvedValue([]);
  });

  it('updates business default currency from prompt', async () => {
    const result = await handleConfigureBusinessCurrencyLogic(
      deps(),
      'biz-1',
      {},
      'Set default currency to AMD',
    );
    expect(result.success).toBe(true);
    expect(result.details?.currencyCode).toBe('AMD');
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          currency: 'AMD',
          defaultCurrency: 'AMD',
        }),
      }),
    );
  });

  it('parses euros and rubles wording', async () => {
    const euro = await handleConfigureBusinessCurrencyLogic(
      deps(),
      'biz-1',
      {},
      'Switch the salon to euros',
    );
    expect(euro.details?.currencyCode).toBe('EUR');

    const rub = await handleConfigureBusinessCurrencyLogic(
      deps(),
      'biz-1',
      {},
      'Use rubles for new services',
    );
    expect(rub.details?.currencyCode).toBe('RUB');
  });

  it('returns clarify when currency is missing', async () => {
    const result = await handleConfigureBusinessCurrencyLogic(
      deps(),
      'biz-1',
      {},
      'change our currency',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(businessRepo.save).not.toHaveBeenCalled();
  });

  it('explains default currency, stripe support, and aligned services', async () => {
    business.settings = { currency: 'AMD' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'AMD' },
      { id: 's2', name: 'Color', currency: 'AMD' },
    ] as Service[]);

    const result = await handleExplainBusinessCurrencyLogic(deps(), 'biz-1');

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_business_currency');
    expect(result.details?.defaultCurrency).toBe('AMD');
    expect(result.details?.stripeCurrencySupported).toBe(true);
    expect(result.details?.servicesOnDifferentCurrencyCount).toBe(0);
    expect(result.summary).toContain('Default business currency is AMD');
    expect(result.summary).toContain('Stripe supports online card payments');
    expect(result.summary).toContain(
      'All active services use the default currency',
    );
  });

  it('counts services on a different currency and flags unsupported stripe codes', async () => {
    business.settings = { currency: 'GEL' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'GEL' },
      { id: 's2', name: 'Color', currency: 'USD' },
      { id: 's3', name: 'Blowout', currency: 'EUR' },
      { id: 's4', name: 'Trim', currency: 'USD' },
    ] as Service[]);

    const result = await handleExplainBusinessCurrencyLogic(deps(), 'biz-1');

    expect(result.success).toBe(true);
    expect(result.details?.defaultCurrency).toBe('GEL');
    expect(result.details?.stripeCurrencySupported).toBe(true);
    expect(result.details?.servicesOnDifferentCurrencyCount).toBe(3);
    expect(result.details?.servicesByCurrency).toEqual({ USD: 2, EUR: 1 });
    expect(result.summary).toContain(
      '3 active services still use a different currency',
    );
  });

  it('requests confirmation before bulk aligning service currencies', async () => {
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'USD' },
      { id: 's2', name: 'Color', currency: 'EUR' },
      { id: 's3', name: 'Blowout', currency: 'USD' },
    ] as Service[]);

    const preview = await handleBulkUpdateServiceCurrencyLogic(
      deps(),
      'biz-1',
      {},
      'Align all services to business default currency',
      false,
    );

    expect(preview.success).toBe(true);
    expect(preview.details?.requiresExecutionConfirmation).toBe(true);
    expect(preview.details?.serviceCount).toBe(1);
    expect(preview.details?.targetCurrency).toBe('USD');
    expect(serviceRepo.update).not.toHaveBeenCalled();
  });

  it('updates mismatched services after confirmation', async () => {
    business.settings = { currency: 'AMD' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'AMD' },
      { id: 's2', name: 'Color', currency: 'USD' },
      { id: 's3', name: 'Blowout', currency: 'EUR' },
    ] as Service[]);

    const result = await handleBulkUpdateServiceCurrencyLogic(
      deps(),
      'biz-1',
      {},
      'Migrate legacy service currencies to match default',
      true,
    );

    expect(result.success).toBe(true);
    expect(result.details?.serviceCount).toBe(2);
    expect(result.details?.updatedServiceIds).toEqual(['s2', 's3']);
    expect(serviceRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'biz-1' }),
      { currency: 'AMD' },
    );
  });

  it('filters bulk migration to a specific source currency', async () => {
    business.settings = { currency: 'AMD' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'USD' },
      { id: 's2', name: 'Color', currency: 'EUR' },
    ] as Service[]);

    const result = await handleBulkUpdateServiceCurrencyLogic(
      deps(),
      'biz-1',
      {},
      'Bulk align services still on USD to our default',
      true,
    );

    expect(result.details?.serviceCount).toBe(1);
    expect(result.details?.updatedServiceIds).toEqual(['s1']);
    expect(result.details?.fromCurrency).toBe('USD');
  });

  it('explains booking-page currency with aligned services (ai-cmd-curr-5)', async () => {
    business.settings = { currency: 'EUR' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'EUR' },
      { id: 's2', name: 'Color', currency: 'EUR' },
    ] as Service[]);

    const result = await handleExplainCheckoutCurrencyLogic(deps(), 'biz-1');

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_checkout_currency');
    expect(result.details?.currencyCode).toBe('EUR');
    expect(result.details?.stripeCurrencySupported).toBe(true);
    expect(result.details?.servicesOnDifferentCurrencyCount).toBe(0);
    expect(result.summary).toContain('euros (€)');
    expect(result.summary).toContain(
      'All listed services use the same currency',
    );
  });

  it('notes legacy service currency mismatches on the booking page (ai-cmd-curr-5)', async () => {
    business.settings = { currency: 'AMD' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'AMD' },
      { id: 's2', name: 'Color', currency: 'USD' },
      { id: 's3', name: 'Blowout', currency: 'RUB' },
    ] as Service[]);

    const result = await handleExplainCheckoutCurrencyLogic(deps(), 'biz-1');

    expect(result.success).toBe(true);
    expect(result.details?.servicesOnDifferentCurrencyCount).toBe(2);
    expect(result.details?.servicesByCurrency).toEqual({ USD: 1, RUB: 1 });
    expect(result.summary).toContain('Armenian dram (֏)');
    expect(result.summary).toContain('mixed symbols');
  });

  it('returns failure when business is missing for checkout currency explain', async () => {
    businessRepo.findOne.mockResolvedValue(null);

    const result = await handleExplainCheckoutCurrencyLogic(
      deps(),
      'biz-missing',
    );

    expect(result.success).toBe(false);
    expect(result.action).toBe('explain_checkout_currency');
  });

  it('explains consumer app tenant currency with aligned services (ai-cmd-curr-6)', async () => {
    business.settings = { currency: 'AMD' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'AMD' },
      { id: 's2', name: 'Color', currency: 'AMD' },
    ] as Service[]);

    const result = await handleExplainTenantCurrencyLogic(deps(), 'biz-1');

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_tenant_currency');
    expect(result.details?.currencyCode).toBe('AMD');
    expect(result.details?.tenantId).toBe('biz-1');
    expect(result.summary).toContain('consumer app');
    expect(result.summary).toContain('Armenian dram (֏)');
    expect(result.summary).toContain(
      'All active services in this salon catalog use the same currency in the app',
    );
  });

  it('notes legacy service mismatches in the consumer app (ai-cmd-curr-6)', async () => {
    business.settings = { currency: 'EUR' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'EUR' },
      { id: 's2', name: 'Color', currency: 'USD' },
    ] as Service[]);

    const result = await handleExplainTenantCurrencyLogic(deps(), 'biz-1');

    expect(result.success).toBe(true);
    expect(result.details?.servicesOnDifferentCurrencyCount).toBe(1);
    expect(result.summary).toContain('another symbol on that item');
  });

  it('explains package and gift-card currency with aligned packages (ai-cmd-curr-7)', async () => {
    business.settings = {
      currency: 'AMD',
      giftCards: {
        purchaseEnabled: true,
        presetAmounts: [50000, 100000],
        purchasablePackages: [{ packageId: 'pkg-1' }],
        purchasableServices: [],
      },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });
    packageRepo.find.mockResolvedValue([
      {
        id: 'pkg-1',
        name: 'Spa Day',
        isActive: true,
        items: [{ serviceId: 's1', service: { currency: 'AMD' } }],
      },
    ] as ServicePackage[]);

    const result = await handleExplainPackageCurrencyLogic(deps(), 'biz-1');

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_package_currency');
    expect(result.details?.currencyCode).toBe('AMD');
    expect(result.details?.packagesOnDifferentCurrencyCount).toBe(0);
    expect(result.summary).toContain('Package and gift-card totals');
    expect(result.summary).toContain(
      'Monetary gift-card presets are always quoted in AMD',
    );
  });

  it('notes legacy package and gift-card product currencies (ai-cmd-curr-7)', async () => {
    business.settings = {
      currency: 'AMD',
      giftCards: {
        purchaseEnabled: true,
        presetAmounts: [50],
        purchasablePackages: [{ packageId: 'pkg-legacy' }],
        purchasableServices: [{ serviceId: 's-legacy' }],
      },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });
    packageRepo.find.mockResolvedValue([
      {
        id: 'pkg-legacy',
        name: 'Legacy Bundle',
        isActive: true,
        items: [{ serviceId: 's1', service: { currency: 'USD' } }],
      },
      {
        id: 'pkg-amd',
        name: 'Local Bundle',
        isActive: true,
        items: [{ serviceId: 's2', service: { currency: 'AMD' } }],
      },
    ] as ServicePackage[]);
    serviceRepo.find.mockResolvedValue([
      { id: 's-legacy', currency: 'EUR' },
    ] as Service[]);

    const result = await handleExplainPackageCurrencyLogic(deps(), 'biz-1');

    expect(result.success).toBe(true);
    expect(result.details?.packagesOnDifferentCurrencyCount).toBe(1);
    expect(result.details?.packageGiftProductsOnLegacyCurrencyCount).toBe(1);
    expect(result.details?.serviceGiftProductsOnLegacyCurrencyCount).toBe(1);
    expect(result.summary).toContain('legacy bundled service codes');
    expect(result.summary).toContain('Gift-card checkout quotes use AMD');
  });

  it('explains provider appointment and POS payment currency (ai-cmd-curr-8)', async () => {
    business.settings = { currency: 'EUR' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'EUR' },
      { id: 's2', name: 'Color', currency: 'EUR' },
    ] as Service[]);

    const result = await handleExplainProviderPaymentCurrencyLogic(
      deps(),
      'biz-1',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_provider_payment_currency');
    expect(result.details?.currencyCode).toBe('EUR');
    expect(result.details?.retailUsesAppointmentCurrency).toBe(true);
    expect(result.summary).toContain('provider app');
    expect(result.summary).toContain(
      'Retail POS add-ons have no separate currency',
    );
  });

  it('explains notification email and WhatsApp currency (ai-cmd-curr-9)', async () => {
    business.settings = { currency: 'EUR' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'EUR' },
      { id: 's2', name: 'Color', currency: 'EUR' },
    ] as Service[]);

    const result = await handleExplainNotificationCurrencyLogic(
      deps(),
      'biz-1',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_notification_currency');
    expect(result.details?.currencyCode).toBe('EUR');
    expect(result.details?.usesPaidAmountWhenAvailable).toBe(true);
    expect(result.details?.giftCardPresetUsesBusinessDefault).toBe(true);
    expect(result.summary).toContain('Confirmation emails');
    expect(result.summary).toContain('amount paid');
  });

  it('notes legacy service codes in notification messages (ai-cmd-curr-9)', async () => {
    business.settings = { currency: 'AMD' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'AMD' },
      { id: 's2', name: 'Color', currency: 'USD' },
    ] as Service[]);

    const result = await handleExplainNotificationCurrencyLogic(
      deps(),
      'biz-1',
    );

    expect(result.success).toBe(true);
    expect(result.details?.servicesOnDifferentCurrencyCount).toBe(1);
    expect(result.summary).toContain('legacy ISO code');
  });

  it('explains Stripe online checkout charge currency (ai-cmd-curr-11)', async () => {
    business.settings = {
      currency: 'EUR',
      publicBooking: { acceptCashPayments: true },
      integrations: { stripe: { connectAccountId: 'acct_test' } },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'EUR' },
    ] as Service[]);

    const result = await handleExplainStripeCheckoutCurrencyLogic(
      deps(),
      'biz-1',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_stripe_checkout_currency');
    expect(result.details?.currencyCode).toBe('EUR');
    expect(result.details?.stripeCurrencySupported).toBe(true);
    expect(result.details?.acceptCashPayments).toBe(true);
    expect(result.summary).toContain('Stripe checkout charges');
    expect(result.summary).toContain('pay-at-venue');
  });

  it('recommends cash when Stripe Connect is not linked (ai-cmd-curr-11)', async () => {
    business.settings = {
      currency: 'AMD',
      publicBooking: { acceptCashPayments: true },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleExplainStripeCheckoutCurrencyLogic(
      deps(),
      'biz-1',
    );

    expect(result.success).toBe(true);
    expect(result.details?.onlinePaymentsEnabled).toBe(false);
    expect(result.details?.acceptCashPayments).toBe(true);
    expect(result.summary).toContain('Stripe Connect is not linked');
    expect(result.summary).toContain('cash or pay-at-venue');
  });

  it('explains Settings Stripe Connect currency warning (ai-cmd-curr-10)', async () => {
    business.settings = {
      currency: 'EUR',
      integrations: { stripe: { connectAccountId: 'acct_test' } },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleExplainStripeCurrencyWarningLogic(
      deps(),
      'biz-1',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_stripe_currency_warning');
    expect(result.details?.currencyCode).toBe('EUR');
    expect(result.details?.stripeConnectReady).toBe(true);
    expect(result.details?.stripeCurrencySupported).toBe(true);
    expect(result.details?.settingsStripeWarningVisible).toBe(false);
    expect(result.details?.stripeChargeCurrencies).toContain('EUR');
    expect(result.summary).toContain('does not show a Stripe warning');
    expect(result.summary).toContain('Cash and pay-at-venue');
  });

  it('explains when Stripe Connect is not linked yet (ai-cmd-curr-10)', async () => {
    business.settings = { currency: 'AMD' };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleExplainStripeCurrencyWarningLogic(
      deps(),
      'biz-1',
    );

    expect(result.success).toBe(true);
    expect(result.details?.stripeConnectReady).toBe(false);
    expect(result.details?.settingsStripeWarningVisible).toBe(false);
    expect(result.summary).toContain('Stripe Connect is not linked yet');
  });

  it('diagnoses legacy catalog currency mismatch checkout failures (ai-cmd-curr-12)', async () => {
    business.settings = {
      currency: 'EUR',
      publicBooking: { acceptCashPayments: true },
      integrations: { stripe: { connectAccountId: 'acct_test' } },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'EUR' },
      { id: 's2', name: 'Color', currency: 'USD' },
    ] as Service[]);

    const result = await handleDiagnoseStripeCheckoutFailureLogic(
      deps(),
      'biz-1',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('diagnose_stripe_checkout_failure');
    expect(result.details?.stripeCurrencySupported).toBe(true);
    expect(result.details?.stripeConnectReady).toBe(true);
    expect(result.details?.servicesOnDifferentCurrencyCount).toBe(1);
    expect(result.details?.likelyCauses?.length).toBeGreaterThan(0);
    expect(result.details?.recommendedFixes?.length).toBeGreaterThan(0);
    expect(result.summary).toContain('legacy ISO codes');
    expect(result.summary).toContain('Cash or pay-at-venue');
  });

  it('diagnoses when Stripe Connect is not linked (ai-cmd-curr-12)', async () => {
    business.settings = { currency: 'EUR' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'EUR' },
    ] as Service[]);

    const result = await handleDiagnoseStripeCheckoutFailureLogic(
      deps(),
      'biz-1',
    );

    expect(result.success).toBe(true);
    expect(result.details?.stripeConnectReady).toBe(false);
    expect(result.summary).toContain('Stripe Connect is not linked');
    expect(result.summary).toContain('Dashboard → Billing');
  });

  it('summarizes dashboard and reports revenue KPIs in business currency (ai-cmd-curr-14)', async () => {
    business.settings = { currency: 'USD' };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleSummarizeRevenueKpisLogic(
      deps(),
      'biz-1',
      {},
      'Summarize revenue KPIs for this month',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('summarize_revenue_kpis');
    expect(result.details?.noFxConversion).toBe(true);
    expect(result.details?.defaultCurrency).toBe('USD');
    expect(result.details?.staffRevenueTotal).toBe(12000);
    expect(result.details?.serviceRevenueTotal).toBe(12000);
    expect(result.summary).toContain('Dashboard overview');
    expect(result.summary).toContain('Reports staff revenue');
    expect(result.summary).toContain('Reports service revenue');
    expect(result.summary).toContain('no FX conversion');
    expect(dashboardService.getOverview).toHaveBeenCalledWith('biz-1');
    expect(analyticsService.staffPerformance).toHaveBeenCalled();
    expect(analyticsService.servicePopularity).toHaveBeenCalled();
  });

  it('explains reports and P&L KPI currency without FX conversion (ai-cmd-curr-13)', async () => {
    business.settings = { currency: 'AMD' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'AMD' },
      { id: 's2', name: 'Color', currency: 'USD' },
    ] as Service[]);

    const result = await handleExplainReportsCurrencyLogic(deps(), 'biz-1');

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_reports_currency');
    expect(result.details?.defaultCurrency).toBe('AMD');
    expect(result.details?.noFxConversion).toBe(true);
    expect(result.details?.reportSurfaces).toContain('operations-pl');
    expect(result.summary).toContain('P&L KPIs');
    expect(result.summary).toContain('no FX conversion');
    expect(result.summary).toContain('legacy');
  });

  it('notes legacy service codes in provider payment breakdowns (ai-cmd-curr-8)', async () => {
    business.settings = { currency: 'AMD' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([
      { id: 's1', name: 'Cut', currency: 'AMD' },
      { id: 's2', name: 'Color', currency: 'USD' },
      { id: 's3', name: 'Blowout', currency: 'RUB' },
    ] as Service[]);

    const result = await handleExplainProviderPaymentCurrencyLogic(
      deps(),
      'biz-1',
    );

    expect(result.success).toBe(true);
    expect(result.details?.servicesOnDifferentCurrencyCount).toBe(2);
    expect(result.summary).toContain('legacy ISO codes');
    expect(result.summary).toContain('mixed symbols');
  });
});
