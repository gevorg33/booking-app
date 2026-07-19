import { describe, expect, it, jest } from '@jest/globals';
import {
  handleGetDashboardOverviewLogic,
  handleUpdateBusinessProfileLogic,
  type BusinessProfileLogicDeps,
} from './ai-business-profile.logic.js';

function buildDeps(overrides: Record<string, any> = {}): BusinessProfileLogicDeps {
  return {
    businessService: {
      updateProfile: jest.fn(async (_id: string, dto: any) => ({
        id: 'biz-1',
        ...dto,
      })),
      ...overrides.businessService,
    },
    dashboardService: {
      getOverview: jest.fn(async (_businessId: string) => ({
        todaysBookings: 3,
        activeEmployees: 2,
        services: 5,
        totalCustomers: 40,
        utilizationPercent: 55,
        revenueThisMonth: 1000,
        taxCollectedThisMonth: 80,
        netRevenueThisMonth: 920,
        currency: 'USD',
        bookingsThisMonth: 30,
        noShowCount: 1,
        noShowRatePercent: 3.3,
        completedThisMonth: 28,
      })),
      ...overrides.dashboardService,
    },
  } as any;
}

describe('ai-business-profile.logic (ai-cmd-dashboard-6.2)', () => {
  describe('handleGetDashboardOverviewLogic', () => {
    it('returns the overview with a KPI summary', async () => {
      const deps = buildDeps();
      const result = await handleGetDashboardOverviewLogic(deps, 'biz-1');
      expect(result.success).toBe(true);
      expect(result.summary).toContain('3 booking(s) today');
      expect(result.details).toMatchObject({
        overview: { revenueThisMonth: 1000 },
      });
    });
  });

  describe('handleUpdateBusinessProfileLogic', () => {
    it('asks for clarification when no fields are given', async () => {
      const deps = buildDeps();
      const result = await handleUpdateBusinessProfileLogic(deps, 'biz-1', {});
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('updates the given fields', async () => {
      const deps = buildDeps();
      const result = await handleUpdateBusinessProfileLogic(deps, 'biz-1', {
        phone: '555-0100',
        name: 'New Salon Name',
      });
      expect(result.success).toBe(true);
      expect(deps.businessService.updateProfile).toHaveBeenCalledWith('biz-1', {
        phone: '555-0100',
        name: 'New Salon Name',
      });
      expect(result.details).toMatchObject({
        updatedFields: ['name', 'phone'],
      });
    });

    it('ignores unsupported fields', async () => {
      const deps = buildDeps();
      const result = await handleUpdateBusinessProfileLogic(deps, 'biz-1', {
        branding: { logoUrl: 'x' },
      });
      expect(result.success).toBe(false);
      expect(deps.businessService.updateProfile).not.toHaveBeenCalled();
    });
  });
});
