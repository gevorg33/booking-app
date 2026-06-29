import type { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import type { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import {
  handleExplainEmptyCatalogLogic,
  handleExplainStripeNotConnectedLogic,
  handleExplainVisibilityBlockLogic,
  loadEmptyStateGuideSnapshot,
  type EmptyStateGuideLogicDeps,
} from './ai-product-guide-empty-state.logic.js';

function buildDeps(input: {
  business: Partial<Business>;
  serviceCounts?: { total: number; active: number };
  employeeCounts?: { total: number; active: number };
  stripe?: Awaited<ReturnType<StripeIntegrationService['getPublicSettings']>>;
  employee?: Partial<Employee> | null;
}): EmptyStateGuideLogicDeps {
  return {
    businessRepo: {
      findOne: jest.fn().mockResolvedValue(input.business),
    } as unknown as Repository<Business>,
    serviceRepo: {
      count: jest
        .fn()
        .mockResolvedValueOnce(input.serviceCounts?.total ?? 0)
        .mockResolvedValueOnce(input.serviceCounts?.active ?? 0),
    } as unknown as Repository<Service>,
    employeeRepo: {
      count: jest
        .fn()
        .mockResolvedValueOnce(input.employeeCounts?.total ?? 0)
        .mockResolvedValueOnce(input.employeeCounts?.active ?? 0),
      findOne: jest.fn().mockResolvedValue(input.employee ?? null),
    } as unknown as Repository<Employee>,
    stripeIntegrationService: {
      getPublicSettings: jest.fn().mockResolvedValue(
        input.stripe ?? {
          configured: false,
          chargesEnabled: false,
          detailsSubmitted: false,
        },
      ),
    } as unknown as StripeIntegrationService,
  };
}

describe('ai-product-guide-empty-state.logic (ai-guide-1.8.9)', () => {
  it('loadEmptyStateGuideSnapshot reads live catalog + Stripe settings', async () => {
    const deps = buildDeps({
      business: {
        id: 'biz-1',
        name: 'Demo Salon',
        settings: { publicBooking: { enabled: true } },
      },
      serviceCounts: { total: 3, active: 2 },
      employeeCounts: { total: 2, active: 1 },
      stripe: {
        configured: true,
        connectAccountId: 'acct_123',
        chargesEnabled: true,
        detailsSubmitted: true,
      },
    });

    const snapshot = await loadEmptyStateGuideSnapshot(deps, {
      businessId: 'biz-1',
      surface: 'dashboard',
    });

    expect(snapshot).toMatchObject({
      businessName: 'Demo Salon',
      serviceCountTotal: 3,
      serviceCountActive: 2,
      employeeCountActive: 1,
      stripe: expect.objectContaining({ configured: true }),
    });
  });

  it('handleExplainEmptyCatalogLogic explains inactive catalog', async () => {
    const deps = buildDeps({
      business: {
        id: 'biz-1',
        name: 'Demo Salon',
        settings: { publicBooking: { enabled: true } },
      },
      serviceCounts: { total: 4, active: 0 },
      employeeCounts: { total: 1, active: 1 },
    });

    const result = await handleExplainEmptyCatalogLogic(deps, {
      businessId: 'biz-1',
      surface: 'public',
      locale: 'en',
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_empty_catalog');
    expect(result.summary).toContain('4 services exist but all are inactive');
    expect(result.details?.serviceCountActive).toBe(0);
  });

  it('handleExplainStripeNotConnectedLogic explains missing Connect account', async () => {
    const deps = buildDeps({
      business: {
        id: 'biz-1',
        name: 'Demo Salon',
        settings: { payments: { acceptCashPayments: true } },
      },
      stripe: {
        configured: false,
        chargesEnabled: false,
        detailsSubmitted: false,
      },
    });

    const result = await handleExplainStripeNotConnectedLogic(deps, {
      businessId: 'biz-1',
      surface: 'dashboard',
      locale: 'en',
    });

    expect(result.success).toBe(true);
    expect(result.summary).toContain('Stripe Connect is not linked yet');
    expect(result.guide?.steps[0].navigate).toEqual(
      expect.objectContaining({ path: '/dashboard/settings/integrations' }),
    );
  });

  it('handleExplainVisibilityBlockLogic cites staff provider team tab scope', async () => {
    const deps = buildDeps({
      business: { id: 'biz-1', name: 'Demo Salon', settings: {} },
      serviceCounts: { total: 1, active: 1 },
      employeeCounts: { total: 1, active: 1 },
    });

    const result = await handleExplainVisibilityBlockLogic(deps, {
      businessId: 'biz-1',
      surface: 'provider',
      role: 'staff',
      prompt: "Why can't I see the team schedule tab?",
      locale: 'en',
    });

    expect(result.success).toBe(true);
    expect(result.summary).toContain('staff tier');
    expect(result.details?.retrievalPath).toBe('empty-state-visibility');
  });
});
