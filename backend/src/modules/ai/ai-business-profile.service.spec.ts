import { describe, expect, it, jest } from '@jest/globals';
import { AiBusinessProfileService } from './ai-business-profile.service.js';

describe('AiBusinessProfileService (ai-cmd-dashboard-6.2)', () => {
  function buildService() {
    const businessService = {
      updateProfile: jest.fn(async (_id: string, dto: any) => ({
        id: 'biz-1',
        ...dto,
      })),
    };
    const dashboardService = {
      getOverview: jest.fn(async (_businessId: string) => ({
        todaysBookings: 1,
        activeEmployees: 1,
        services: 1,
        totalCustomers: 1,
        utilizationPercent: 1,
        revenueThisMonth: 1,
        taxCollectedThisMonth: 1,
        netRevenueThisMonth: 1,
        currency: 'USD',
        bookingsThisMonth: 1,
        noShowCount: 0,
        noShowRatePercent: 0,
        completedThisMonth: 1,
      })),
    };
    const service = new AiBusinessProfileService(
      businessService as any,
      dashboardService as any,
    );
    return { service, businessService, dashboardService };
  }

  it('handleGetDashboardOverview delegates to DashboardService', async () => {
    const { service, dashboardService } = buildService();
    const result = await service.handleGetDashboardOverview('biz-1');
    expect(result.action).toBe('get_dashboard_overview');
    expect(dashboardService.getOverview).toHaveBeenCalledWith('biz-1');
  });

  it('handleUpdateBusinessProfile delegates to BusinessService', async () => {
    const { service, businessService } = buildService();
    const result = await service.handleUpdateBusinessProfile('biz-1', {
      name: 'New Name',
    });
    expect(result.action).toBe('update_business_profile');
    expect(businessService.updateProfile).toHaveBeenCalledWith('biz-1', {
      name: 'New Name',
    });
  });

  it('exposes rescue + detector passthroughs', () => {
    const { service } = buildService();
    expect(
      service.rescueBusinessProfileIntent('business overview', 'unknown'),
    ).toEqual({ action: 'get_dashboard_overview', rescueReason: 'overview' });
    expect(service.isGetDashboardOverviewPrompt('dashboard overview')).toBe(
      true,
    );
    expect(service.isUpdateBusinessProfilePrompt('update business phone')).toBe(
      true,
    );
  });
});
