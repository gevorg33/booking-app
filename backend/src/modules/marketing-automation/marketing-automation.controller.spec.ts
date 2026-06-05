import { ForbiddenException } from '@nestjs/common';
import { MarketingAutomationController } from './marketing-automation.controller.js';
import { MarketingAutomationService } from './marketing-automation.service.js';
import { BusinessService } from '../business/business.service.js';

describe('MarketingAutomationController', () => {
  const marketingAutomationService = {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    getSummary: jest.fn(),
  };
  const businessService = { getUserBusinesses: jest.fn() };

  const controller = new MarketingAutomationController(
    marketingAutomationService as unknown as MarketingAutomationService,
    businessService as unknown as BusinessService,
  );

  const user = { id: 'user-1' };
  const settings = {
    postVisitReviewEnabled: true,
    reEngagementEnabled: false,
    inactiveDaysThreshold: 90,
    reEngagementEmailEnabled: true,
    reEngagementSmsEnabled: false,
    minDaysBetweenReEngagement: 30,
    reEngagementPromoCode: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.getUserBusinesses.mockResolvedValue([
      { id: 'biz-1', name: 'Demo' },
    ]);
    marketingAutomationService.getSettings.mockResolvedValue(settings);
    marketingAutomationService.updateSettings.mockResolvedValue({
      ...settings,
      reEngagementEnabled: true,
    });
    marketingAutomationService.getSummary.mockResolvedValue({
      settings,
      eligibleInactiveCustomers: 4,
      reEngagementSentLast30Days: 1,
    });
  });

  it('returns settings for business members', async () => {
    const result = await controller.getSettings('biz-1', user);
    expect(marketingAutomationService.getSettings).toHaveBeenCalledWith(
      'biz-1',
    );
    expect(result.settings).toEqual(settings);
  });

  it('updates settings for business members', async () => {
    const dto = {
      reEngagementEnabled: true,
      reEngagementPromoCode: 'WINBACK10',
    };
    const result = await controller.updateSettings('biz-1', dto, user);
    expect(marketingAutomationService.updateSettings).toHaveBeenCalledWith(
      'biz-1',
      dto,
    );
    expect(result.settings.reEngagementEnabled).toBe(true);
  });

  it('returns summary stats for business members', async () => {
    const result = await controller.getSummary('biz-1', user);
    expect(marketingAutomationService.getSummary).toHaveBeenCalledWith('biz-1');
    expect(result.eligibleInactiveCustomers).toBe(4);
    expect(result.reEngagementSentLast30Days).toBe(1);
  });

  it('allows access when matching business is not first in membership list', async () => {
    businessService.getUserBusinesses.mockResolvedValue([
      { id: 'other-biz' },
      { id: 'biz-1', name: 'Demo' },
    ]);
    await expect(controller.getSettings('biz-1', user)).resolves.toEqual({
      settings,
    });
  });

  it('forbids access when user has no businesses', async () => {
    businessService.getUserBusinesses.mockResolvedValue([]);
    await expect(controller.getSettings('biz-1', user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('forbids settings update for non-members', async () => {
    businessService.getUserBusinesses.mockResolvedValue([]);
    await expect(
      controller.updateSettings('biz-1', { reEngagementEnabled: true }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids access when user is not a business member', async () => {
    businessService.getUserBusinesses.mockResolvedValue([{ id: 'other-biz' }]);
    await expect(controller.getSummary('biz-1', user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
