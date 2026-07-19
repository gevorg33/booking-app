import { ServiceSubscriptionsController } from './service-subscriptions.controller.js';
import { ServiceSubscriptionsService } from './service-subscriptions.service.js';
import { BusinessService } from '../business/business.service.js';

describe('ServiceSubscriptionsController', () => {
  const subscriptionsService = {
    listPlans: jest.fn(),
    previewFromPlan: jest.fn(),
    createPlan: jest.fn(),
    updatePlan: jest.fn(),
    deactivatePlan: jest.fn(),
    activatePlan: jest.fn(),
    deletePlan: jest.fn(),
    previewPlanPricing: jest.fn(),
    assignSubscription: jest.fn(),
    listCustomerSubscriptions: jest.fn(),
    getActiveForCustomerService: jest.fn(),
    cancelSubscription: jest.fn(),
    getUsageHistory: jest.fn(),
  };
  const businessService = { ensureMember: jest.fn() };

  const controller = new ServiceSubscriptionsController(
    subscriptionsService as unknown as ServiceSubscriptionsService,
    businessService as unknown as BusinessService,
  );

  const user = { id: 'user-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'owner' });
  });

  it('lists plans with previews and includeInactive flag', async () => {
    const plan = {
      id: 'plan-1',
      service: { price: 25 },
      includedAppointments: 6,
      discountType: 'percent',
      discountValue: 5,
    };
    subscriptionsService.listPlans.mockResolvedValue([plan]);
    subscriptionsService.previewFromPlan.mockReturnValue({
      pricing: { subscriptionPrice: 142.5 },
    });

    const result = await controller.listPlans('biz-1', 'svc-1', 'true', user);

    expect(subscriptionsService.listPlans).toHaveBeenCalledWith(
      'biz-1',
      'svc-1',
      true,
    );
    expect(result).toHaveLength(1);
    expect(result[0].preview).toEqual({
      pricing: { subscriptionPrice: 142.5 },
    });
  });

  it('creates plan after membership check', async () => {
    const dto = {
      name: 'Medium',
      serviceId: 'svc-1',
      durationMonths: 6,
      includedAppointments: 12,
    };
    subscriptionsService.createPlan.mockResolvedValue({ id: 'plan-1', ...dto });
    const result = await controller.createPlan('biz-1', dto, user);
    expect(subscriptionsService.createPlan).toHaveBeenCalledWith('biz-1', dto);
    expect(result.id).toBe('plan-1');
  });

  it('updates plan after membership check', async () => {
    const dto = { name: 'Updated' };
    subscriptionsService.updatePlan.mockResolvedValue({
      id: 'plan-1',
      name: 'Updated',
    });
    const result = await controller.updatePlan('biz-1', 'plan-1', dto, user);
    expect(subscriptionsService.updatePlan).toHaveBeenCalledWith(
      'biz-1',
      'plan-1',
      dto,
    );
    expect(result.name).toBe('Updated');
  });

  it('deactivates plan after membership check', async () => {
    subscriptionsService.deactivatePlan.mockResolvedValue({
      id: 'plan-1',
      isActive: false,
    });
    const result = await controller.deactivatePlan('biz-1', 'plan-1', user);
    expect(subscriptionsService.deactivatePlan).toHaveBeenCalledWith(
      'biz-1',
      'plan-1',
    );
    expect(result.isActive).toBe(false);
  });

  it('activates plan after membership check', async () => {
    subscriptionsService.activatePlan.mockResolvedValue({
      id: 'plan-1',
      isActive: true,
    });
    const result = await controller.activatePlan('biz-1', 'plan-1', user);
    expect(subscriptionsService.activatePlan).toHaveBeenCalledWith(
      'biz-1',
      'plan-1',
    );
    expect(result.isActive).toBe(true);
  });

  it('deletes plan after membership check', async () => {
    subscriptionsService.deletePlan.mockResolvedValue({
      deleted: true,
      id: 'plan-1',
    });
    const result = await controller.deletePlan('biz-1', 'plan-1', user);
    expect(subscriptionsService.deletePlan).toHaveBeenCalledWith(
      'biz-1',
      'plan-1',
    );
    expect(result).toEqual({ deleted: true, id: 'plan-1' });
  });

  it('previews plan pricing', async () => {
    subscriptionsService.previewPlanPricing.mockResolvedValue({
      pricing: { subscriptionPrice: 100 },
    });
    const result = await controller.previewPlan('biz-1', 'plan-1', user);
    expect(subscriptionsService.previewPlanPricing).toHaveBeenCalledWith(
      'biz-1',
      'plan-1',
    );
    expect(result.pricing.subscriptionPrice).toBe(100);
  });

  it('assigns subscription without startsAt', async () => {
    subscriptionsService.assignSubscription.mockResolvedValue({ id: 'sub-1' });
    const dto = { customerId: 'cust-1', planId: 'plan-1' };
    const result = await controller.assign('biz-1', dto, user);
    expect(subscriptionsService.assignSubscription).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
      'plan-1',
      undefined,
    );
    expect(result.id).toBe('sub-1');
  });

  it('assigns subscription with startsAt', async () => {
    subscriptionsService.assignSubscription.mockResolvedValue({ id: 'sub-1' });
    const dto = {
      customerId: 'cust-1',
      planId: 'plan-1',
      startsAt: '2026-06-01T00:00:00.000Z',
    };
    await controller.assign('biz-1', dto, user);
    expect(subscriptionsService.assignSubscription).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
      'plan-1',
      { startsAt: new Date('2026-06-01T00:00:00.000Z') },
    );
  });

  it('lists customer subscriptions', async () => {
    subscriptionsService.listCustomerSubscriptions.mockResolvedValue([
      { id: 'sub-1' },
    ]);
    const result = await controller.customerSubscriptions(
      'biz-1',
      'cust-1',
      user,
    );
    expect(subscriptionsService.listCustomerSubscriptions).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
    );
    expect(result).toHaveLength(1);
  });

  it('returns active subscription for service', async () => {
    subscriptionsService.getActiveForCustomerService.mockResolvedValue({
      id: 'sub-1',
    });
    const result = await controller.activeForService(
      'biz-1',
      'cust-1',
      'svc-1',
      user,
    );
    expect(
      subscriptionsService.getActiveForCustomerService,
    ).toHaveBeenCalledWith('biz-1', 'cust-1', 'svc-1');
    expect(result).toEqual({ subscription: { id: 'sub-1' } });
  });

  it('cancels customer subscription', async () => {
    subscriptionsService.cancelSubscription.mockResolvedValue({
      subscription: { id: 'sub-1', status: 'cancelled' },
      refundStatus: undefined,
    });
    const result = await controller.cancelSubscription('biz-1', 'sub-1', user);
    expect(subscriptionsService.cancelSubscription).toHaveBeenCalledWith(
      'biz-1',
      'sub-1',
    );
    expect(result.subscription.status).toBe('cancelled');
  });

  it('returns usage history', async () => {
    subscriptionsService.getUsageHistory.mockResolvedValue({
      subscription: { id: 'sub-1' },
      usage: [],
    });
    const result = await controller.usageHistory('biz-1', 'sub-1', user);
    expect(subscriptionsService.getUsageHistory).toHaveBeenCalledWith(
      'biz-1',
      'sub-1',
    );
    expect(result.usage).toEqual([]);
  });
});
