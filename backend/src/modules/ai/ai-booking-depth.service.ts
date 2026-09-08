import { Injectable } from '@nestjs/common';
import type { NamedResolver } from './ai-name-resolution.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ServicePackage } from '../service-packages/entities/service-package.entity.js';
import { BookingService } from '../booking/booking.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { SchedulingResourcesService } from '../resources/scheduling-resources.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleAssignBookingResourceLogic,
  handleCancelMultiServiceGroupLogic,
  handleCancelPackageVisitLogic,
  handleCreateMultiServiceBookingLogic,
  handleCreatePackageBookingLogic,
  handleExplainBookingPolicyLogic,
  handleListCashPendingBookingsLogic,
  handleListMultiServiceBookingsLogic,
  handleListPackageBookingsLogic,
  handleMarkPaidLogic,
  handleRescheduleMultiServiceGroupLogic,
  handleReschedulePackageVisitLogic,
  prepareCashCreateParamsLogic,
  prepareSubscriptionCreditParamsLogic,
  type BookingDepthLogicDeps,
  type MarkPaidResolveContext,
} from './ai-booking-depth.logic.js';
import { rescueBookingDepthIntent } from './ai-booking-depth.util.js';
import { dispatchBookingDepthIntent } from './ai-booking-depth-dispatch.util.js';
import type { BookingDepthDispatchContext } from './ai-booking-depth-dispatch.build.js';

@Injectable()
export class AiBookingDepthService {
  private readonly deps: BookingDepthLogicDeps;

  constructor(
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(ServicePackage) packageRepo: Repository<ServicePackage>,
    bookingService: BookingService,
    subscriptionsService: ServiceSubscriptionsService,
    packagesService: ServicePackagesService,
    multiServiceBookingsService: MultiServiceBookingsService,
    resourcesService: SchedulingResourcesService,
  ) {
    this.deps = {
      bookingRepo,
      businessRepo,
      packageRepo,
      bookingService,
      subscriptionsService,
      packagesService,
      multiServiceBookingsService,
      resourcesService,
    };
  }

  rescueBookingIntent(prompt: string, action: string) {
    return rescueBookingDepthIntent(prompt, action);
  }

  prepareSubscriptionCreditParams(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    services: Service[],
    resolveCustomer: NamedResolver<Customer>,
    resolveService: (list: Service[], name: string) => Service | undefined,
  ) {
    return prepareSubscriptionCreditParamsLogic(
      this.deps,
      businessId,
      params,
      customers,
      services,
      resolveCustomer,
      resolveService,
    );
  }

  prepareCashCreateParams(
    params: Record<string, any>,
    businessSettings: Record<string, unknown> | null,
  ) {
    return prepareCashCreateParamsLogic(params, businessSettings);
  }

  handleListCashPending(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ) {
    return handleListCashPendingBookingsLogic(
      this.deps,
      businessId,
      prompt,
      params,
    );
  }

  handleListPackageBookings(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ) {
    return handleListPackageBookingsLogic(
      this.deps,
      businessId,
      prompt,
      params,
    );
  }

  handleListMultiServiceBookings(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ) {
    return handleListMultiServiceBookingsLogic(
      this.deps,
      businessId,
      prompt,
      params,
    );
  }

  handleExplainPolicy(businessId: string, params: Record<string, any>) {
    return handleExplainBookingPolicyLogic(this.deps, businessId, params);
  }

  handleCancelPackageVisit(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
  ) {
    return handleCancelPackageVisitLogic(this.deps, businessId, params, userId);
  }

  handleCancelMultiServiceGroup(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
  ) {
    return handleCancelMultiServiceGroupLogic(
      this.deps,
      businessId,
      params,
      userId,
    );
  }

  handleReschedulePackageVisit(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
  ) {
    return handleReschedulePackageVisitLogic(
      this.deps,
      businessId,
      params,
      userId,
    );
  }

  handleRescheduleMultiServiceGroup(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
  ) {
    return handleRescheduleMultiServiceGroupLogic(
      this.deps,
      businessId,
      params,
      userId,
    );
  }

  handleMarkPaid(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
    ctx?: MarkPaidResolveContext,
  ) {
    return handleMarkPaidLogic(this.deps, businessId, params, userId, ctx);
  }

  handleAssignResource(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
  ) {
    return handleAssignBookingResourceLogic(
      this.deps,
      businessId,
      params,
      userId,
    );
  }

  handleCreateMultiServiceBooking(
    businessId: string,
    params: Record<string, any>,
    business: Business,
    employees: Employee[],
    services: Service[],
    customers: Customer[],
    resolveEmployee: NamedResolver<Employee>,
    resolveServices: (list: Service[], p: Record<string, any>) => Service[],
    resolveCustomer: NamedResolver<Customer>,
    userId?: string,
  ): Promise<CommandResult> {
    return handleCreateMultiServiceBookingLogic(
      this.deps,
      businessId,
      params,
      business,
      employees,
      services,
      customers,
      resolveEmployee,
      resolveServices,
      resolveCustomer,
      userId,
    );
  }

  async handleCreatePackageBooking(
    businessId: string,
    params: Record<string, any>,
    business: Business,
    employees: Employee[],
    services: Service[],
    customers: Customer[],
    resolveEmployee: NamedResolver<Employee>,
    resolveCustomer: NamedResolver<Customer>,
    userId?: string,
  ): Promise<CommandResult> {
    const resolvePackage = async (name: string) => {
      const needle = name.toLowerCase();
      const packages = await this.deps.packageRepo.find({
        where: { businessId, isActive: true },
        relations: { items: { service: true } },
      });
      return (
        packages.find((p) => p.name.toLowerCase() === needle) ??
        packages.find((p) => p.name.toLowerCase().includes(needle)) ??
        null
      );
    };

    return handleCreatePackageBookingLogic(
      this.deps,
      businessId,
      params,
      business,
      employees,
      services,
      customers,
      resolveEmployee,
      resolveCustomer,
      resolvePackage,
      userId,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a booking-depth intent. */
  dispatchIntent(
    ctx: BookingDepthDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchBookingDepthIntent(this, ctx);
  }
}
