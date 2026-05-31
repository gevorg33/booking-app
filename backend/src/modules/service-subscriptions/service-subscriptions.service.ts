import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import {
  SubscriptionPlan,
  CustomerSubscription,
  SubscriptionUsage,
  CustomerSubscriptionStatus,
  SubscriptionUsageAction,
  SubscriptionDiscountType,
} from './entities/subscription.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import {
  calculateSubscriptionPricing,
  addMonths,
  type SubscriptionDiscountType as DiscountType,
} from '../../common/utils/subscription-pricing.util.js';

export interface CreateSubscriptionPlanDto {
  name: string;
  serviceId: string;
  durationMonths: number;
  includedAppointments: number;
  discountType?: DiscountType;
  discountValue?: number;
}

@Injectable()
export class ServiceSubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(CustomerSubscription)
    private subscriptionRepo: Repository<CustomerSubscription>,
    @InjectRepository(SubscriptionUsage)
    private usageRepo: Repository<SubscriptionUsage>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async listPlans(businessId: string, serviceId?: string, includeInactive = false) {
    const where: Record<string, unknown> = { businessId };
    if (!includeInactive) where.isActive = true;
    if (serviceId) where.serviceId = serviceId;
    return this.planRepo.find({
      where,
      relations: { service: true },
      order: { durationMonths: 'ASC', includedAppointments: 'ASC' },
    });
  }

  async deactivatePlan(businessId: string, planId: string) {
    return this.updatePlan(businessId, planId, { isActive: false });
  }

  async activatePlan(businessId: string, planId: string) {
    const plan = await this.planRepo.findOne({ where: { id: planId, businessId } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (plan.isActive) {
      throw new BadRequestException('Subscription plan is already active');
    }
    await this.assertService(businessId, plan.serviceId);
    return this.updatePlan(businessId, planId, { isActive: true });
  }

  async deletePlan(businessId: string, planId: string) {
    const plan = await this.planRepo.findOne({ where: { id: planId, businessId } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (plan.isActive) {
      throw new BadRequestException('Deactivate the plan before deleting it');
    }
    const subscriptionsCount = await this.subscriptionRepo.count({
      where: { planId: plan.id, businessId },
    });
    if (subscriptionsCount > 0) {
      throw new ConflictException(
        'Cannot delete a plan that has customer subscriptions. Keep it deactivated instead.',
      );
    }
    await this.planRepo.remove(plan);
    return { deleted: true, id: planId };
  }

  async cancelSubscription(businessId: string, subscriptionId: string) {
    const sub = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId, businessId },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    sub.status = CustomerSubscriptionStatus.CANCELLED;
    return this.subscriptionRepo.save(sub);
  }

  async getPlanCheckoutDetails(businessId: string, planId: string) {
    const preview = await this.previewPlanPricing(businessId, planId);
    const plan = await this.planRepo.findOne({
      where: { id: planId, businessId, isActive: true },
      relations: { service: true },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return {
      amount: preview.pricing.subscriptionPrice,
      currency: plan.service.currency ?? 'USD',
      planName: plan.name,
      includedAppointments: plan.includedAppointments,
      durationMonths: plan.durationMonths,
      preview,
    };
  }

  async createPlan(businessId: string, dto: CreateSubscriptionPlanDto) {
    await this.assertService(businessId, dto.serviceId);
    if (dto.includedAppointments < 1) {
      throw new BadRequestException('includedAppointments must be at least 1');
    }
    if (dto.durationMonths < 1) {
      throw new BadRequestException('durationMonths must be at least 1');
    }

    const plan = this.planRepo.create({
      businessId,
      serviceId: dto.serviceId,
      name: dto.name.trim(),
      durationMonths: dto.durationMonths,
      includedAppointments: dto.includedAppointments,
      discountType: dto.discountType ?? SubscriptionDiscountType.PERCENT,
      discountValue: dto.discountValue ?? 0,
      isActive: true,
    });
    return this.planRepo.save(plan);
  }

  async updatePlan(
    businessId: string,
    planId: string,
    dto: Partial<CreateSubscriptionPlanDto & { isActive: boolean }>,
  ) {
    const plan = await this.planRepo.findOne({ where: { id: planId, businessId } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (dto.serviceId) await this.assertService(businessId, dto.serviceId);
    Object.assign(plan, {
      ...dto,
      name: dto.name?.trim() ?? plan.name,
    });
    return this.planRepo.save(plan);
  }

  async previewPlanPricing(businessId: string, planId: string) {
    const plan = await this.planRepo.findOne({
      where: { id: planId, businessId },
      relations: { service: true },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return this.previewFromPlan(plan, Number(plan.service.price));
  }

  previewFromPlan(plan: SubscriptionPlan, unitPrice: number) {
    return {
      plan: {
        id: plan.id,
        name: plan.name,
        serviceId: plan.serviceId,
        durationMonths: plan.durationMonths,
        includedAppointments: plan.includedAppointments,
      },
      pricing: calculateSubscriptionPricing(
        unitPrice,
        plan.includedAppointments,
        plan.discountType as DiscountType,
        Number(plan.discountValue),
      ),
    };
  }

  async assignSubscription(
    businessId: string,
    customerId: string,
    planId: string,
    options?: { startsAt?: Date; pricePaid?: number; currency?: string },
  ) {
    const plan = await this.planRepo.findOne({
      where: { id: planId, businessId, isActive: true },
      relations: { service: true },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId, isActive: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const startsAt = options?.startsAt ?? new Date();
    const expiresAt = addMonths(startsAt, plan.durationMonths);
    const preview = calculateSubscriptionPricing(
      Number(plan.service.price),
      plan.includedAppointments,
      plan.discountType as DiscountType,
      Number(plan.discountValue),
    );

    const subscription = this.subscriptionRepo.create({
      businessId,
      customerId,
      planId: plan.id,
      appointmentsIncluded: plan.includedAppointments,
      appointmentsRemaining: plan.includedAppointments,
      startsAt,
      expiresAt,
      status: CustomerSubscriptionStatus.ACTIVE,
      pricePaid: options?.pricePaid ?? preview.subscriptionPrice,
      currency: options?.currency ?? plan.service.currency ?? 'USD',
    });
    return this.subscriptionRepo.save(subscription);
  }

  async listCustomerSubscriptions(businessId: string, customerId: string) {
    const subs = await this.subscriptionRepo.find({
      where: { businessId, customerId },
      relations: { plan: { service: true } },
      order: { createdAt: 'DESC' },
    });
    return subs.map((s) => this.syncStatus(s));
  }

  async getActiveForCustomerService(
    businessId: string,
    customerId: string,
    serviceId: string,
  ) {
    const subs = await this.subscriptionRepo.find({
      where: {
        businessId,
        customerId,
        status: CustomerSubscriptionStatus.ACTIVE,
      },
      relations: { plan: true },
    });

    const now = new Date();
    for (const sub of subs) {
      this.syncStatus(sub, now);
      if (sub.status !== CustomerSubscriptionStatus.ACTIVE) continue;
      if (sub.plan.serviceId !== serviceId) continue;
      if (sub.appointmentsRemaining <= 0) continue;
      return sub;
    }
    return null;
  }

  async assertCanConsume(
    businessId: string,
    subscriptionId: string,
    customerId: string,
    serviceId: string,
  ): Promise<CustomerSubscription> {
    const sub = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId, businessId, customerId },
      relations: { plan: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    this.syncStatus(sub);
    if (sub.status !== CustomerSubscriptionStatus.ACTIVE) {
      throw new ConflictException('Subscription is not active');
    }
    if (sub.plan.serviceId !== serviceId) {
      throw new BadRequestException('Subscription does not apply to this service');
    }
    if (sub.appointmentsRemaining <= 0) {
      throw new ConflictException('Subscription has no remaining appointments');
    }
    return sub;
  }

  async consumeCreditInTransaction(
    manager: EntityManager,
    subscriptionId: string,
    bookingId: string,
    serviceId: string,
  ) {
    const sub = await manager.findOne(CustomerSubscription, {
      where: { id: subscriptionId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    this.syncStatus(sub);
    if (sub.status !== CustomerSubscriptionStatus.ACTIVE) {
      throw new ConflictException('Subscription is not active');
    }
    if (sub.appointmentsRemaining <= 0) {
      throw new ConflictException('Subscription has no remaining appointments');
    }

    sub.appointmentsRemaining -= 1;
    if (sub.appointmentsRemaining <= 0) {
      sub.status = CustomerSubscriptionStatus.EXHAUSTED;
    }
    await manager.save(CustomerSubscription, sub);

    const usage = manager.create(SubscriptionUsage, {
      subscriptionId: sub.id,
      bookingId,
      serviceId,
      action: SubscriptionUsageAction.CONSUME,
      appointmentsRemainingAfter: sub.appointmentsRemaining,
    });
    await manager.save(SubscriptionUsage, usage);
    return sub;
  }

  async restoreCreditForBooking(bookingId: string) {
    const consumeUsage = await this.usageRepo.findOne({
      where: { bookingId, action: SubscriptionUsageAction.CONSUME },
    });
    if (!consumeUsage) return null;

    const existingRestore = await this.usageRepo.findOne({
      where: { bookingId, action: SubscriptionUsageAction.RESTORE },
    });
    if (existingRestore) return null;

    const sub = await this.subscriptionRepo.findOne({
      where: { id: consumeUsage.subscriptionId },
    });
    if (!sub) return null;

    sub.appointmentsRemaining = Math.min(
      sub.appointmentsIncluded,
      sub.appointmentsRemaining + 1,
    );
    if (
      sub.status === CustomerSubscriptionStatus.EXHAUSTED &&
      sub.appointmentsRemaining > 0
    ) {
      sub.status = CustomerSubscriptionStatus.ACTIVE;
    }
    await this.subscriptionRepo.save(sub);

    const usage = this.usageRepo.create({
      subscriptionId: sub.id,
      bookingId,
      serviceId: consumeUsage.serviceId,
      action: SubscriptionUsageAction.RESTORE,
      appointmentsRemainingAfter: sub.appointmentsRemaining,
    });
    return this.usageRepo.save(usage);
  }

  async getUsageHistory(businessId: string, subscriptionId: string) {
    const sub = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId, businessId },
      relations: { plan: { service: true } },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    const usage = await this.usageRepo.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
    });
    return { subscription: this.syncStatus(sub), usage };
  }

  async getCustomerSubscriptionUsage(
    businessId: string,
    customerId: string,
    subscriptionId: string,
  ) {
    const sub = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId, businessId, customerId },
      relations: { plan: { service: true } },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    const usage = await this.usageRepo.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
    });
    return { subscription: this.syncStatus(sub), usage };
  }

  async serviceIdsWithActivePlans(businessId: string): Promise<string[]> {
    const plans = await this.planRepo.find({
      where: { businessId, isActive: true },
      select: { serviceId: true },
    });
    return [...new Set(plans.map((p) => p.serviceId))];
  }

  syncStatus(sub: CustomerSubscription, now = new Date()): CustomerSubscription {
    if (sub.status === CustomerSubscriptionStatus.CANCELLED) return sub;
    if (sub.expiresAt < now) {
      sub.status = CustomerSubscriptionStatus.EXPIRED;
    } else if (sub.appointmentsRemaining <= 0) {
      sub.status = CustomerSubscriptionStatus.EXHAUSTED;
    } else if (sub.startsAt <= now) {
      sub.status = CustomerSubscriptionStatus.ACTIVE;
    }
    return sub;
  }

  private async assertService(businessId: string, serviceId: string) {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId, isActive: true },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }
}
