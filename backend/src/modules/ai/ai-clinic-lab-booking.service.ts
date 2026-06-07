import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { ClinicTestOrderBookingRequestService } from '../clinic-test-results/order/clinic-test-order-booking-request.service.js';
import { ClinicTestOrderService } from '../clinic-test-results/order/clinic-test-order.service.js';
import { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleBookLabCollectionLogic,
  handleListMyLabBookingRequestsLogic,
  handleListPatientPendingLabRequestsLogic,
  handlePushLabBookingToPatientLogic,
  handleStaffBookLabCollectionLogic,
  type ClinicLabBookingLogicDeps,
} from './ai-clinic-lab-booking.logic.js';

@Injectable()
export class AiClinicLabBookingService {
  private readonly deps: ClinicLabBookingLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    clinicTestOrderService: ClinicTestOrderService,
    clinicTestOrderBookingRequestService: ClinicTestOrderBookingRequestService,
    clinicLabAccessService: ClinicLabAccessService,
  ) {
    this.deps = {
      businessRepo,
      clinicTestOrderService,
      clinicTestOrderBookingRequestService,
      clinicLabAccessService,
    };
  }

  handlePushLabBookingToPatient(
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    confirmed = false,
  ): Promise<CommandResult> {
    return handlePushLabBookingToPatientLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
      confirmed,
    );
  }

  handleStaffBookLabCollection(
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    confirmed = false,
  ): Promise<CommandResult> {
    return handleStaffBookLabCollectionLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
      confirmed,
    );
  }

  handleListMyLabBookingRequests(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleListMyLabBookingRequestsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleBookLabCollection(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleBookLabCollectionLogic(this.deps, businessId, params, prompt);
  }

  handleListPatientPendingLabRequests(
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleListPatientPendingLabRequestsLogic(
      this.deps,
      businessId,
      userId,
      params,
    );
  }
}
