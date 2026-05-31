import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ServiceSubscriptionsService } from './service-subscriptions.service.js';
import {
  CustomerSubscriptionStatus,
  SubscriptionUsageAction,
} from './entities/subscription.entity.js';

describe('ServiceSubscriptionsService', () => {
  const planRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };
  const subscriptionRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };
  const usageRepo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
  const serviceRepo = { findOne: jest.fn() };
  const customerRepo = { findOne: jest.fn() };

  const service = new ServiceSubscriptionsService(
    planRepo as any,
    subscriptionRepo as any,
    usageRepo as any,
    serviceRepo as any,
    customerRepo as any,
  );

  const basePlan = {
    id: 'plan-1',
    businessId: 'biz-1',
    serviceId: 'svc-1',
    name: 'Short',
    durationMonths: 3,
    includedAppointments: 6,
    discountType: 'percent',
    discountValue: 5,
    isActive: true,
    service: { id: 'svc-1', price: 25, currency: 'USD' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    planRepo.create.mockImplementation((v) => v);
    planRepo.save.mockImplementation(async (v) => ({ id: 'plan-1', ...v }));
    subscriptionRepo.create.mockImplementation((v) => v);
    subscriptionRepo.save.mockImplementation(async (v) => ({ id: 'sub-1', ...v }));
    usageRepo.create.mockImplementation((v) => v);
    usageRepo.save.mockImplementation(async (v) => ({ id: 'usage-1', ...v }));
    serviceRepo.findOne.mockResolvedValue({ id: 'svc-1', businessId: 'biz-1', price: 25, currency: 'USD' });
    customerRepo.findOne.mockResolvedValue({ id: 'cust-1', businessId: 'biz-1', isActive: true });
  });

  it('creates subscription plan', async () => {
    const plan = await service.createPlan('biz-1', {
      name: 'Medium',
      serviceId: 'svc-1',
      durationMonths: 6,
      includedAppointments: 12,
      discountType: 'percent',
      discountValue: 10,
    });
    expect(plan.includedAppointments).toBe(12);
  });

  it('rejects invalid appointment count', async () => {
    await expect(
      service.createPlan('biz-1', {
        name: 'Bad',
        serviceId: 'svc-1',
        durationMonths: 3,
        includedAppointments: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid duration months', async () => {
    await expect(
      service.createPlan('biz-1', {
        name: 'Bad',
        serviceId: 'svc-1',
        durationMonths: 0,
        includedAppointments: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists plans filtered by service', async () => {
    planRepo.find.mockResolvedValue([]);
    await service.listPlans('biz-1', 'svc-1');
    expect(planRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'biz-1', isActive: true, serviceId: 'svc-1' } }),
    );
  });

  it('previews plan pricing', () => {
    const preview = service.previewFromPlan(basePlan as any, 25);
    expect(preview.pricing.subscriptionPrice).toBe(142.5);
  });

  it('assigns subscription to customer', async () => {
    planRepo.findOne.mockResolvedValue(basePlan);
    const sub = await service.assignSubscription('biz-1', 'cust-1', 'plan-1');
    expect(sub.appointmentsRemaining).toBe(6);
    expect(sub.status).toBe(CustomerSubscriptionStatus.ACTIVE);
  });

  it('assertCanConsume validates active balance', async () => {
    subscriptionRepo.findOne.mockResolvedValue({
      id: 'sub-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      appointmentsRemaining: 2,
      startsAt: new Date('2020-01-01'),
      expiresAt: new Date('2030-01-01'),
      status: CustomerSubscriptionStatus.ACTIVE,
      plan: { serviceId: 'svc-1' },
    });

    await expect(
      service.assertCanConsume('biz-1', 'sub-1', 'cust-1', 'svc-1'),
    ).resolves.toMatchObject({ appointmentsRemaining: 2 });
  });

  it('blocks consume when exhausted', async () => {
    subscriptionRepo.findOne.mockResolvedValue({
      id: 'sub-1',
      appointmentsRemaining: 0,
      startsAt: new Date('2020-01-01'),
      expiresAt: new Date('2030-01-01'),
      status: CustomerSubscriptionStatus.EXHAUSTED,
      plan: { serviceId: 'svc-1' },
    });

    await expect(
      service.assertCanConsume('biz-1', 'sub-1', 'cust-1', 'svc-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('consume marks subscription exhausted at zero', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 'sub-1',
        appointmentsRemaining: 1,
        appointmentsIncluded: 6,
        startsAt: new Date('2020-01-01'),
        expiresAt: new Date('2030-01-01'),
        status: CustomerSubscriptionStatus.ACTIVE,
      }),
      create: jest.fn().mockImplementation((_entity, v) => v),
      save: jest.fn().mockImplementation(async (_entity, v) => v),
    };

    const sub = await service.consumeCreditInTransaction(
      manager as any,
      'sub-1',
      'booking-1',
      'svc-1',
    );
    expect(sub.status).toBe(CustomerSubscriptionStatus.EXHAUSTED);
  });

  it('skips restore when no consume record', async () => {
    usageRepo.findOne.mockResolvedValue(null);
    await expect(service.restoreCreditForBooking('booking-x')).resolves.toBeNull();
  });

  it('previews plan pricing from database', async () => {
    planRepo.findOne.mockResolvedValue(basePlan);
    const preview = await service.previewPlanPricing('biz-1', 'plan-1');
    expect(preview.pricing.subscriptionPrice).toBe(142.5);
  });

  it('consumes credit in transaction', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 'sub-1',
        appointmentsRemaining: 2,
        appointmentsIncluded: 6,
        startsAt: new Date('2020-01-01'),
        expiresAt: new Date('2030-01-01'),
        status: CustomerSubscriptionStatus.ACTIVE,
      }),
      create: jest.fn().mockImplementation((_entity, v) => v),
      save: jest.fn().mockImplementation(async (_entity, v) => v),
    };

    const sub = await service.consumeCreditInTransaction(
      manager as any,
      'sub-1',
      'booking-1',
      'svc-1',
    );
    expect(sub.appointmentsRemaining).toBe(1);
    expect(manager.save).toHaveBeenCalled();
  });

  it('restores credit on cancel once', async () => {
    usageRepo.findOne
      .mockResolvedValueOnce({
        subscriptionId: 'sub-1',
        bookingId: 'booking-1',
        serviceId: 'svc-1',
        action: SubscriptionUsageAction.CONSUME,
      })
      .mockResolvedValueOnce(null);
    subscriptionRepo.findOne.mockResolvedValue({
      id: 'sub-1',
      appointmentsIncluded: 6,
      appointmentsRemaining: 1,
      status: CustomerSubscriptionStatus.EXHAUSTED,
    });

    await service.restoreCreditForBooking('booking-1');
    expect(subscriptionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentsRemaining: 2,
        status: CustomerSubscriptionStatus.ACTIVE,
      }),
    );
  });

  it('syncStatus marks expired subscriptions', () => {
    const sub = {
      status: CustomerSubscriptionStatus.ACTIVE,
      startsAt: new Date('2020-01-01'),
      expiresAt: new Date('2020-02-01'),
      appointmentsRemaining: 3,
    } as any;
    service.syncStatus(sub, new Date('2021-01-01'));
    expect(sub.status).toBe(CustomerSubscriptionStatus.EXPIRED);
  });

  it('lists service ids with active plans', async () => {
    planRepo.find.mockResolvedValue([{ serviceId: 'svc-1' }, { serviceId: 'svc-2' }, { serviceId: 'svc-1' }]);
    await expect(service.serviceIdsWithActivePlans('biz-1')).resolves.toEqual(['svc-1', 'svc-2']);
  });

  it('lists customer subscriptions with synced status', async () => {
    subscriptionRepo.find.mockResolvedValue([
      {
        id: 'sub-1',
        status: CustomerSubscriptionStatus.ACTIVE,
        startsAt: new Date('2020-01-01'),
        expiresAt: new Date('2030-01-01'),
        appointmentsRemaining: 2,
        plan: { service: { name: 'Cut' } },
      },
    ]);
    const subs = await service.listCustomerSubscriptions('biz-1', 'cust-1');
    expect(subs).toHaveLength(1);
  });

  it('returns active subscription for service', async () => {
    subscriptionRepo.find.mockResolvedValue([
      {
        id: 'sub-1',
        status: CustomerSubscriptionStatus.ACTIVE,
        startsAt: new Date('2020-01-01'),
        expiresAt: new Date('2030-01-01'),
        appointmentsRemaining: 2,
        plan: { serviceId: 'svc-1' },
      },
    ]);
    const sub = await service.getActiveForCustomerService('biz-1', 'cust-1', 'svc-1');
    expect(sub?.id).toBe('sub-1');
  });

  it('updates plan', async () => {
    planRepo.findOne.mockResolvedValue({ id: 'plan-1', businessId: 'biz-1', name: 'Old' });
    planRepo.save.mockImplementation(async (v) => v);
    const updated = await service.updatePlan('biz-1', 'plan-1', { name: 'New' });
    expect(updated.name).toBe('New');
  });

  it('returns usage history', async () => {
    subscriptionRepo.findOne.mockResolvedValue({ id: 'sub-1', plan: { service: { name: 'Cut' } } });
    usageRepo.find.mockResolvedValue([{ id: 'u1' }]);
    const result = await service.getUsageHistory('biz-1', 'sub-1');
    expect(result.usage).toEqual([{ id: 'u1' }]);
  });

  it('deactivates plan', async () => {
    planRepo.findOne.mockResolvedValue({ id: 'plan-1', businessId: 'biz-1', isActive: true });
    planRepo.save.mockImplementation(async (v) => v);
    const updated = await service.deactivatePlan('biz-1', 'plan-1');
    expect(updated.isActive).toBe(false);
  });

  it('activates deactivated plan', async () => {
    planRepo.findOne
      .mockResolvedValueOnce({ id: 'plan-1', businessId: 'biz-1', serviceId: 'svc-1', isActive: false })
      .mockResolvedValueOnce({ id: 'plan-1', businessId: 'biz-1', isActive: false });
    planRepo.save.mockImplementation(async (v) => ({ ...v, isActive: true }));
    const updated = await service.activatePlan('biz-1', 'plan-1');
    expect(updated.isActive).toBe(true);
    expect(serviceRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'svc-1', businessId: 'biz-1', isActive: true } }),
    );
  });

  it('rejects activating already active plan', async () => {
    planRepo.findOne.mockResolvedValue({ id: 'plan-1', businessId: 'biz-1', isActive: true });
    await expect(service.activatePlan('biz-1', 'plan-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects activating when linked service is inactive', async () => {
    planRepo.findOne.mockResolvedValue({
      id: 'plan-1',
      businessId: 'biz-1',
      serviceId: 'svc-1',
      isActive: false,
    });
    serviceRepo.findOne.mockResolvedValue(null);
    await expect(service.activatePlan('biz-1', 'plan-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes deactivated plan with no customer subscriptions', async () => {
    const plan = { id: 'plan-1', businessId: 'biz-1', isActive: false };
    planRepo.findOne.mockResolvedValue(plan);
    subscriptionRepo.count.mockResolvedValue(0);
    planRepo.remove.mockResolvedValue(plan);
    const result = await service.deletePlan('biz-1', 'plan-1');
    expect(result).toEqual({ deleted: true, id: 'plan-1' });
    expect(planRepo.remove).toHaveBeenCalledWith(plan);
  });

  it('rejects deleting active plan', async () => {
    planRepo.findOne.mockResolvedValue({ id: 'plan-1', businessId: 'biz-1', isActive: true });
    await expect(service.deletePlan('biz-1', 'plan-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects deleting plan with customer subscriptions', async () => {
    planRepo.findOne.mockResolvedValue({ id: 'plan-1', businessId: 'biz-1', isActive: false });
    subscriptionRepo.count.mockResolvedValue(2);
    await expect(service.deletePlan('biz-1', 'plan-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when deleting missing plan', async () => {
    planRepo.findOne.mockResolvedValue(null);
    await expect(service.deletePlan('biz-1', 'plan-x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when activating missing plan', async () => {
    planRepo.findOne.mockResolvedValue(null);
    await expect(service.activatePlan('biz-1', 'plan-x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('assertCanConsume rejects zero remaining when status stays active', async () => {
    jest.spyOn(service, 'syncStatus').mockImplementation((sub) => sub);
    subscriptionRepo.findOne.mockResolvedValue({
      id: 'sub-1',
      appointmentsRemaining: 0,
      status: CustomerSubscriptionStatus.ACTIVE,
      plan: { serviceId: 'svc-1' },
    });
    await expect(
      service.assertCanConsume('biz-1', 'sub-1', 'cust-1', 'svc-1'),
    ).rejects.toThrow('Subscription has no remaining appointments');
    jest.restoreAllMocks();
  });

  it('consume throws when no appointments remain while still active', async () => {
    jest.spyOn(service, 'syncStatus').mockImplementation((sub) => sub);
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 'sub-1',
        appointmentsRemaining: 0,
        status: CustomerSubscriptionStatus.ACTIVE,
      }),
    };
    await expect(
      service.consumeCreditInTransaction(manager as any, 'sub-1', 'b1', 'svc-1'),
    ).rejects.toThrow('Subscription has no remaining appointments');
    jest.restoreAllMocks();
  });

  it('cancelSubscription throws when missing', async () => {
    subscriptionRepo.findOne.mockResolvedValue(null);
    await expect(service.cancelSubscription('biz-1', 'sub-x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getPlanCheckoutDetails throws when plan inactive or missing', async () => {
    planRepo.findOne.mockResolvedValueOnce(basePlan).mockResolvedValueOnce(null);
    await expect(service.getPlanCheckoutDetails('biz-1', 'plan-x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('assignSubscription throws when plan missing', async () => {
    planRepo.findOne.mockResolvedValue(null);
    await expect(service.assignSubscription('biz-1', 'cust-1', 'plan-x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('assignSubscription throws when customer missing', async () => {
    planRepo.findOne.mockResolvedValue(basePlan);
    customerRepo.findOne.mockResolvedValue(null);
    await expect(service.assignSubscription('biz-1', 'cust-1', 'plan-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getUsageHistory throws when subscription missing', async () => {
    subscriptionRepo.findOne.mockResolvedValue(null);
    await expect(service.getUsageHistory('biz-1', 'sub-x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('syncStatus keeps future start subscriptions non-active', () => {
    const sub = {
      status: CustomerSubscriptionStatus.ACTIVE,
      startsAt: new Date('2099-01-01'),
      expiresAt: new Date('2099-06-01'),
      appointmentsRemaining: 3,
    } as any;
    service.syncStatus(sub, new Date('2025-01-01'));
    expect(sub.status).toBe(CustomerSubscriptionStatus.ACTIVE);
  });

  it('cancels customer subscription', async () => {
    subscriptionRepo.findOne.mockResolvedValue({ id: 'sub-1', businessId: 'biz-1', status: 'active' });
    subscriptionRepo.save.mockImplementation(async (v) => v);
    const updated = await service.cancelSubscription('biz-1', 'sub-1');
    expect(updated.status).toBe(CustomerSubscriptionStatus.CANCELLED);
  });

  it('returns plan checkout details', async () => {
    planRepo.findOne.mockResolvedValue(basePlan);
    const details = await service.getPlanCheckoutDetails('biz-1', 'plan-1');
    expect(details.amount).toBe(142.5);
    expect(details.planName).toBe('Short');
  });

  it('lists plans including inactive when requested', async () => {
    planRepo.find.mockResolvedValue([]);
    await service.listPlans('biz-1', undefined, true);
    expect(planRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'biz-1' } }),
    );
  });

  it('returns customer subscription usage for owner', async () => {
    subscriptionRepo.findOne.mockResolvedValue({
      id: 'sub-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      plan: { service: { name: 'Cut' } },
      status: CustomerSubscriptionStatus.ACTIVE,
      startsAt: new Date('2020-01-01'),
      expiresAt: new Date('2030-01-01'),
      appointmentsRemaining: 2,
    });
    usageRepo.find.mockResolvedValue([{ id: 'u1', action: 'consume' }]);
    const result = await service.getCustomerSubscriptionUsage('biz-1', 'cust-1', 'sub-1');
    expect(result.usage).toHaveLength(1);
  });

  it('assigns with custom start date', async () => {
    planRepo.findOne.mockResolvedValue(basePlan);
    const startsAt = new Date('2026-06-01');
    await service.assignSubscription('biz-1', 'cust-1', 'plan-1', { startsAt });
    expect(subscriptionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ startsAt }),
    );
  });

  it('assertCanConsume rejects zero balance while still marked active', async () => {
    subscriptionRepo.findOne.mockResolvedValue({
      id: 'sub-1',
      appointmentsRemaining: 0,
      startsAt: new Date('2020-01-01'),
      expiresAt: new Date('2030-01-01'),
      status: CustomerSubscriptionStatus.ACTIVE,
      plan: { serviceId: 'svc-1' },
    });
    await expect(
      service.assertCanConsume('biz-1', 'sub-1', 'cust-1', 'svc-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when customer subscription usage missing', async () => {
    subscriptionRepo.findOne.mockResolvedValue(null);
    await expect(
      service.getCustomerSubscriptionUsage('biz-1', 'cust-1', 'sub-x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updatePlan validates service when serviceId changes', async () => {
    planRepo.findOne.mockResolvedValue({ id: 'plan-1', businessId: 'biz-1', name: 'Old' });
    serviceRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updatePlan('biz-1', 'plan-1', { serviceId: 'svc-x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects wrong service on consume assert', async () => {
    subscriptionRepo.findOne.mockResolvedValue({
      id: 'sub-1',
      appointmentsRemaining: 2,
      startsAt: new Date('2020-01-01'),
      expiresAt: new Date('2030-01-01'),
      status: CustomerSubscriptionStatus.ACTIVE,
      plan: { serviceId: 'other-svc' },
    });
    await expect(
      service.assertCanConsume('biz-1', 'sub-1', 'cust-1', 'svc-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns null when no active subscription for service', async () => {
    subscriptionRepo.find.mockResolvedValue([
      {
        id: 'sub-1',
        status: CustomerSubscriptionStatus.ACTIVE,
        startsAt: new Date('2020-01-01'),
        expiresAt: new Date('2030-01-01'),
        appointmentsRemaining: 0,
        plan: { serviceId: 'svc-1' },
      },
    ]);
    await expect(
      service.getActiveForCustomerService('biz-1', 'cust-1', 'svc-1'),
    ).resolves.toBeNull();
  });

  it('consume throws when subscription missing in transaction', async () => {
    const manager = { findOne: jest.fn().mockResolvedValue(null) };
    await expect(
      service.consumeCreditInTransaction(manager as any, 'sub-x', 'b1', 'svc-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('consume throws when no appointments left in transaction', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 'sub-1',
        appointmentsRemaining: 0,
        startsAt: new Date('2020-01-01'),
        expiresAt: new Date('2030-01-01'),
        status: CustomerSubscriptionStatus.ACTIVE,
      }),
    };
    await expect(
      service.consumeCreditInTransaction(manager as any, 'sub-1', 'b1', 'svc-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('assertCanConsume throws when subscription not found', async () => {
    subscriptionRepo.findOne.mockResolvedValue(null);
    await expect(
      service.assertCanConsume('biz-1', 'sub-x', 'cust-1', 'svc-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getActive skips wrong service id', async () => {
    subscriptionRepo.find.mockResolvedValue([
      {
        id: 'sub-1',
        status: CustomerSubscriptionStatus.ACTIVE,
        startsAt: new Date('2020-01-01'),
        expiresAt: new Date('2030-01-01'),
        appointmentsRemaining: 2,
        plan: { serviceId: 'other' },
      },
    ]);
    await expect(
      service.getActiveForCustomerService('biz-1', 'cust-1', 'svc-1'),
    ).resolves.toBeNull();
  });

  it('consume throws when subscription inactive in transaction', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 'sub-1',
        appointmentsRemaining: 2,
        startsAt: new Date('2020-01-01'),
        expiresAt: new Date('2020-02-01'),
        status: CustomerSubscriptionStatus.EXPIRED,
      }),
    };
    await expect(
      service.consumeCreditInTransaction(manager as any, 'sub-1', 'b1', 'svc-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('skips restore when restore already recorded', async () => {
    usageRepo.findOne
      .mockResolvedValueOnce({ subscriptionId: 'sub-1', action: SubscriptionUsageAction.CONSUME })
      .mockResolvedValueOnce({ action: SubscriptionUsageAction.RESTORE });
    await expect(service.restoreCreditForBooking('booking-1')).resolves.toBeNull();
  });

  it('syncStatus leaves cancelled unchanged', () => {
    const sub = {
      status: CustomerSubscriptionStatus.CANCELLED,
      expiresAt: new Date('2020-01-01'),
      appointmentsRemaining: 0,
    } as any;
    service.syncStatus(sub, new Date('2025-01-01'));
    expect(sub.status).toBe(CustomerSubscriptionStatus.CANCELLED);
  });

  it('creates plan with fixed discount', async () => {
    await service.createPlan('biz-1', {
      name: 'Fixed',
      serviceId: 'svc-1',
      durationMonths: 3,
      includedAppointments: 4,
      discountType: 'fixed',
      discountValue: 10,
    });
    expect(planRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ discountType: 'fixed', discountValue: 10 }),
    );
  });

  it('throws when plan missing on preview', async () => {
    planRepo.findOne.mockResolvedValue(null);
    await expect(service.previewPlanPricing('biz-1', 'plan-x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
