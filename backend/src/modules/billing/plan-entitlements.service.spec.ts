import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlanEntitlementsService } from './plan-entitlements.service.js';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { AiUsageService } from '../integrations/openai/ai-usage.service.js';
import { PlanLimitExceededException } from './plan-limit.exception.js';
import { SubscriptionStatus } from './subscription-status.enum.js';

describe('PlanEntitlementsService', () => {
  const businessSolo = {
    id: 'biz-solo',
    subscriptionPlanId: null,
    subscriptionStatus: SubscriptionStatus.INACTIVE,
  };

  const businessStarter = {
    id: 'biz-starter',
    subscriptionPlanId: 'starter',
    subscriptionStatus: SubscriptionStatus.ACTIVE,
  };

  const businessRepo = {
    findOne: jest.fn(),
  };

  const employeeRepo = {
    count: jest.fn(),
  };

  const aiUsageService = {
    getMonthlySummary: jest.fn(),
  };

  const service = new PlanEntitlementsService(
    businessRepo as any,
    employeeRepo as any,
    aiUsageService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    employeeRepo.count.mockResolvedValue(0);
    aiUsageService.getMonthlySummary.mockResolvedValue({
      bySurface: [{ surface: 'dashboard', requests: 0 }],
    });
  });

  it('returns solo entitlements for inactive subscription', async () => {
    businessRepo.findOne.mockResolvedValue(businessSolo);
    const view = await service.getEntitlements('biz-solo');
    expect(view.tierId).toBe('solo');
    expect(view.isPaid).toBe(false);
    expect(view.limits.maxProviderSeats).toBe(1);
    expect(view.flags.promoCodes).toBe(false);
    expect(view.atLimit.providerSeats).toBe(false);
  });

  it('returns starter entitlements when subscription is active', async () => {
    businessRepo.findOne.mockResolvedValue(businessStarter);
    const view = await service.getEntitlements('biz-starter');
    expect(view.tierId).toBe('starter');
    expect(view.isPaid).toBe(true);
    expect(view.flags.stripeConnect).toBe(true);
    expect(view.flags.promoCodes).toBe(true);
  });

  it('marks provider seat and AI limits', async () => {
    businessRepo.findOne.mockResolvedValue(businessSolo);
    employeeRepo.count.mockResolvedValue(1);
    aiUsageService.getMonthlySummary.mockResolvedValue({
      bySurface: [{ surface: 'dashboard', requests: 25 }],
    });
    const view = await service.getEntitlements('biz-solo');
    expect(view.atLimit.providerSeats).toBe(true);
    expect(view.atLimit.aiCommands).toBe(true);
    expect(view.aiUsageWarning).toBe(false);
  });

  it('sets AI usage warning at 80% without hard block', async () => {
    businessRepo.findOne.mockResolvedValue(businessStarter);
    aiUsageService.getMonthlySummary.mockResolvedValue({
      bySurface: [{ surface: 'dashboard', requests: 120 }],
    });
    const view = await service.getEntitlements('biz-starter');
    expect(view.aiUsageWarning).toBe(true);
    expect(view.atLimit.aiCommands).toBe(false);
  });

  it('throws when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.getEntitlements('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('assertCanAddProviderSeat throws at limit', async () => {
    businessRepo.findOne.mockResolvedValue(businessSolo);
    employeeRepo.count.mockResolvedValue(1);
    await expect(service.assertCanAddProviderSeat('biz-solo')).rejects.toThrow(
      PlanLimitExceededException,
    );
  });

  it('assertCanRunDashboardAiCommand throws at limit', async () => {
    businessRepo.findOne.mockResolvedValue(businessSolo);
    aiUsageService.getMonthlySummary.mockResolvedValue({
      bySurface: [{ surface: 'dashboard', requests: 30 }],
    });
    await expect(
      service.assertCanRunDashboardAiCommand('biz-solo'),
    ).rejects.toThrow(PlanLimitExceededException);
  });

  it('assertFeature throws when flag disabled', async () => {
    businessRepo.findOne.mockResolvedValue(businessSolo);
    await expect(
      service.assertFeature('biz-solo', 'giftCards'),
    ).rejects.toThrow(PlanLimitExceededException);
  });

  it('assertFeature passes for starter promo codes', async () => {
    businessRepo.findOne.mockResolvedValue(businessStarter);
    await expect(
      service.assertFeature('biz-starter', 'promoCodes'),
    ).resolves.toBeUndefined();
  });

  it('treats canceled starter subscription as unpaid tier', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...businessStarter,
      subscriptionStatus: SubscriptionStatus.CANCELED,
    });
    const view = await service.getEntitlements('biz-starter');
    expect(view.tierId).toBe('solo');
    expect(view.isPaid).toBe(false);
  });

  it('treats trialing starter as paid', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...businessStarter,
      subscriptionStatus: SubscriptionStatus.TRIALING,
    });
    const view = await service.getEntitlements('biz-starter');
    expect(view.isPaid).toBe(true);
  });

  it('assertCanAddProviderSeat allows under cap', async () => {
    businessRepo.findOne.mockResolvedValue(businessStarter);
    employeeRepo.count.mockResolvedValue(4);
    await expect(
      service.assertCanAddProviderSeat('biz-starter'),
    ).resolves.toBeUndefined();
  });

  it('assertCanRunDashboardAiCommand allows under cap', async () => {
    businessRepo.findOne.mockResolvedValue(businessStarter);
    aiUsageService.getMonthlySummary.mockResolvedValue({
      bySurface: [{ surface: 'dashboard', requests: 10 }],
    });
    await expect(
      service.assertCanRunDashboardAiCommand('biz-starter'),
    ).resolves.toBeUndefined();
  });

  it('handles missing subscription status on business record', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-starter',
      subscriptionPlanId: 'starter',
      subscriptionStatus: undefined,
    });
    const view = await service.getEntitlements('biz-starter');
    expect(view.tierId).toBe('solo');
    expect(view.isPaid).toBe(false);
  });

  it('instantiates through Nest repository injection', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PlanEntitlementsService,
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(Employee), useValue: employeeRepo },
        { provide: AiUsageService, useValue: aiUsageService },
      ],
    }).compile();
    const injected = moduleRef.get(PlanEntitlementsService);
    businessRepo.findOne.mockResolvedValue(businessSolo);
    await expect(injected.getEntitlements('biz-solo')).resolves.toMatchObject({
      tierId: 'solo',
    });
    await moduleRef.close();
  });

  it('counts zero dashboard AI when surface missing', async () => {
    businessRepo.findOne.mockResolvedValue(businessSolo);
    aiUsageService.getMonthlySummary.mockResolvedValue({ bySurface: [] });
    const view = await service.getEntitlements('biz-solo');
    expect(view.usage.aiCommandsThisMonth).toBe(0);
  });
});
