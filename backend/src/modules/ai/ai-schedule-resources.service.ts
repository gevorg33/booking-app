import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { SchedulingResource } from '../resources/entities/scheduling-resource.entity.js';
import { SchedulingResourcesService } from '../resources/scheduling-resources.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeScheduleResourceCompoundPrompt,
  isScheduleResourceCompoundPrompt,
  rescueScheduleResourceIntent,
} from './ai-schedule-resources.util.js';
import {
  handleAssignResourceHoursLogic,
  handleBlockResourceUnavailableLogic,
  handleCheckMultiServiceBlockAvailabilityLogic,
  handleCheckPackageLineAvailabilityLogic,
  handleConfigureMultiServiceSchedulingModeLogic,
  handleCreateResourceLogic,
  handleDeactivateResourceLogic,
  handleEarliestSlotAllServicesLogic,
  handleExplainResourceConflictLogic,
  handleExplainWhyNoSlotsLogic,
  handleListResourceConflictsLogic,
  handleListSchedulingResourcesLogic,
  handleMyResourceAssignmentsLogic,
  handleProvidersAvailableLaterDaysLogic,
  handleScheduleResourceCompoundLogic,
  handleUpdateResourceLogic,
  type Sprint29ScheduleResourceLogicDeps,
} from './ai-schedule-resources.logic.js';

@Injectable()
export class AiScheduleResourcesService {
  private readonly deps: Sprint29ScheduleResourceLogicDeps;

  constructor(
    resourcesService: SchedulingResourcesService,
    multiServiceBookingsService: MultiServiceBookingsService,
    publicBookingService: PublicBookingService,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
    @InjectRepository(SchedulingResource)
    resourceRepo: Repository<SchedulingResource>,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
  ) {
    this.deps = {
      resourcesService,
      multiServiceBookingsService,
      publicBookingService,
      businessRepo,
      serviceRepo,
      resourceRepo,
      bookingRepo,
    };
  }

  rescueScheduleResourceIntent(prompt: string, action: string) {
    return rescueScheduleResourceIntent(prompt, action);
  }

  isScheduleResourceCompound(prompt: string) {
    return isScheduleResourceCompoundPrompt(prompt);
  }

  decomposeScheduleResourceCompound(prompt: string) {
    return decomposeScheduleResourceCompoundPrompt(prompt);
  }

  handleListSchedulingResources(businessId: string) {
    return handleListSchedulingResourcesLogic(this.deps, businessId);
  }

  handleCreateResource(businessId: string, params: Record<string, any>) {
    return handleCreateResourceLogic(this.deps, businessId, params);
  }

  handleUpdateResource(businessId: string, params: Record<string, any>) {
    return handleUpdateResourceLogic(this.deps, businessId, params);
  }

  handleDeactivateResource(businessId: string, params: Record<string, any>) {
    return handleDeactivateResourceLogic(this.deps, businessId, params);
  }

  handleAssignResourceHours(
    businessId: string,
    params: Record<string, any>,
    services: Service[],
  ) {
    return handleAssignResourceHoursLogic(
      this.deps,
      businessId,
      params,
      services,
    );
  }

  handleListResourceConflicts(businessId: string, params: Record<string, any>) {
    return handleListResourceConflictsLogic(this.deps, businessId, params);
  }

  handleExplainResourceConflict(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleExplainResourceConflictLogic(this.deps, businessId, params);
  }

  handleConfigureMultiServiceSchedulingMode(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleConfigureMultiServiceSchedulingModeLogic(
      this.deps,
      businessId,
      params,
    );
  }

  handleMyResourceAssignments(businessId: string, params: Record<string, any>) {
    return handleMyResourceAssignmentsLogic(this.deps, businessId, params);
  }

  handleBlockResourceUnavailable(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleBlockResourceUnavailableLogic(this.deps, businessId, params);
  }

  handleCheckMultiServiceBlockAvailability(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleCheckMultiServiceBlockAvailabilityLogic(
      this.deps,
      businessId,
      params,
    );
  }

  handleCheckPackageLineAvailability(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleCheckPackageLineAvailabilityLogic(
      this.deps,
      businessId,
      params,
    );
  }

  handleEarliestSlotAllServices(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleEarliestSlotAllServicesLogic(this.deps, businessId, params);
  }

  handleProvidersAvailableLaterDays(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleProvidersAvailableLaterDaysLogic(
      this.deps,
      businessId,
      params,
    );
  }

  handleExplainWhyNoSlots(businessId: string, params: Record<string, any>) {
    return handleExplainWhyNoSlotsLogic(this.deps, businessId, params);
  }

  handleScheduleResourceCompound(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    return handleScheduleResourceCompoundLogic(
      this.deps,
      businessId,
      prompt,
      params,
      services,
      userId,
    );
  }
}
