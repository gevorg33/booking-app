import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  handleBulkUpdateServiceCurrencyLogic,
  handleConfigureBusinessCurrencyLogic,
  handleExplainBusinessCurrencyLogic,
  handleExplainStripeCurrencyWarningLogic,
  handleDiagnoseStripeCheckoutFailureLogic,
  handleExplainReportsCurrencyLogic,
  handleSummarizeRevenueKpisLogic,
} from './ai-business-currency.logic.js';
import {
  BULK_UPDATE_SERVICE_CURRENCY_PROMPTS,
  CONFIGURE_BUSINESS_CURRENCY_PROMPTS,
  EXPLAIN_BUSINESS_CURRENCY_PROMPTS,
} from './ai-business-currency.fixtures.js';
import { EXPLAIN_STRIPE_CURRENCY_WARNING_PROMPTS } from './ai-stripe-currency-warning.fixtures.js';
import { DIAGNOSE_STRIPE_CHECKOUT_FAILURE_PROMPTS } from './ai-stripe-checkout-failure.fixtures.js';
import { EXPLAIN_REPORTS_CURRENCY_PROMPTS } from './ai-reports-currency.fixtures.js';
import { SUMMARIZE_REVENUE_KPIS_PROMPTS } from './ai-revenue-kpis.fixtures.js';
import { parseCurrencyFromPrompt } from './ai-business-currency.util.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';

describe('ai business currency integration (ai-cmd-curr-1..3)', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: { currency: 'USD' },
  } as Business;

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };

  const serviceRepo = {
    find: jest.fn(async () => [] as Service[]),
    update: jest.fn(async () => ({ affected: 1 })),
  };

  const packageRepo = {
    find: jest.fn(async () => []),
  };

  const dashboardService = {
    getOverview: jest.fn(async () => ({
      todaysBookings: 1,
      activeEmployees: 2,
      services: 4,
      totalCustomers: 20,
      utilizationPercent: 50,
      revenueThisMonth: 5000,
      taxCollectedThisMonth: 500,
      netRevenueThisMonth: 4500,
      currency: 'USD',
      bookingsThisMonth: 8,
      noShowCount: 0,
      noShowRatePercent: 0,
      completedThisMonth: 8,
    })),
  };

  const analyticsService = {
    staffPerformance: jest.fn(async () => ({
      currency: 'USD',
      rows: [{ employeeName: 'Alex', bookings: 5, revenue: 3000, utilizationPercent: 60 }],
    })),
    servicePopularity: jest.fn(async () => ({
      currency: 'USD',
      rows: [{ serviceName: 'Cut', bookings: 5, revenue: 3000 }],
    })),
  };

  const deps = () => ({
    businessRepo,
    serviceRepo,
    packageRepo,
    dashboardService,
    analyticsService,
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = { currency: 'USD' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue([]);
    packageRepo.find.mockResolvedValue([]);
    rescue = new AiIntentRescueService();
  });

  it.each(CONFIGURE_BUSINESS_CURRENCY_PROMPTS)(
    'rescues and validates configure $id',
    async ({ prompt, currencyCode }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('configure_business_currency');

      const validation = validateCommand({
        action: 'configure_business_currency',
        params: { currencyCode },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
      });
      expect(validation.ok).toBe(true);

      const result = await handleConfigureBusinessCurrencyLogic(
        deps(),
        'biz-1',
        { currencyCode },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.details?.currencyCode).toBe(currencyCode);
    },
  );

  it.each(EXPLAIN_BUSINESS_CURRENCY_PROMPTS)(
    'rescues and executes explain $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_business_currency');

      const validation = validateCommand({
        action: 'explain_business_currency',
        params: {},
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
      });
      expect(validation.ok).toBe(true);

      const result = await handleExplainBusinessCurrencyLogic(
        deps(),
        'biz-1',
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_business_currency');
      expect(result.details?.defaultCurrency).toBe('USD');
    },
  );

  it.each(EXPLAIN_STRIPE_CURRENCY_WARNING_PROMPTS)(
    'rescues and executes stripe currency warning $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_stripe_currency_warning');

      const result = await handleExplainStripeCurrencyWarningLogic(
        deps(),
        'biz-1',
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_stripe_currency_warning');
      expect(result.details?.stripeChargeCurrencies?.length).toBeGreaterThan(0);
    },
  );

  it.each(DIAGNOSE_STRIPE_CHECKOUT_FAILURE_PROMPTS)(
    'rescues and executes stripe checkout failure diagnosis $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('diagnose_stripe_checkout_failure');

      const result = await handleDiagnoseStripeCheckoutFailureLogic(
        deps(),
        'biz-1',
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('diagnose_stripe_checkout_failure');
      expect(result.details?.likelyCauses?.length).toBeGreaterThan(0);
    },
  );

  it.each(EXPLAIN_REPORTS_CURRENCY_PROMPTS)(
    'rescues and executes reports currency explain $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_reports_currency');

      const result = await handleExplainReportsCurrencyLogic(deps(), 'biz-1');
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_reports_currency');
      expect(result.details?.noFxConversion).toBe(true);
    },
  );

  it.each(SUMMARIZE_REVENUE_KPIS_PROMPTS)(
    'rescues and executes revenue KPI summary $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('summarize_revenue_kpis');

      const result = await handleSummarizeRevenueKpisLogic(
        deps(),
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('summarize_revenue_kpis');
      expect(result.details?.noFxConversion).toBe(true);
    },
  );

  it.each(BULK_UPDATE_SERVICE_CURRENCY_PROMPTS)(
    'rescues bulk update $id',
    async ({ prompt }) => {
      serviceRepo.find.mockResolvedValue([
        { id: 's1', name: 'Cut', currency: 'EUR' },
      ] as Service[]);

      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('bulk_update_service_currency');

      const validation = validateCommand({
        action: 'bulk_update_service_currency',
        params: {},
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
      });
      expect(validation.ok).toBe(true);

      const preview = await handleBulkUpdateServiceCurrencyLogic(
        deps(),
        'biz-1',
        {},
        prompt,
        false,
      );
      expect(preview.details?.requiresExecutionConfirmation).toBe(true);

      const executed = await handleBulkUpdateServiceCurrencyLogic(
        deps(),
        'biz-1',
        {},
        prompt,
        true,
      );
      expect(executed.success).toBe(true);
      expect(serviceRepo.update).toHaveBeenCalled();
    },
  );

  it('extracts currency from natural-language without explicit ISO code', () => {
    expect(parseCurrencyFromPrompt('Switch the salon to euros')).toBe('EUR');
    expect(parseCurrencyFromPrompt('Use rubles for new services')).toBe('RUB');
  });
});
