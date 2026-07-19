import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { ClinicTestPanel } from '../clinic-test-results/entities/clinic-test-panel.entity.js';
import { ClinicTestType } from '../clinic-test-results/entities/clinic-test-type.entity.js';
import { ClinicTestOrderService } from '../clinic-test-results/order/clinic-test-order.service.js';
import { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleCreateTestOrderLogic,
  handleListTestOrdersLogic,
  type ClinicTestOrderLogicDeps,
} from './ai-clinic-test-order.logic.js';
import { dispatchClinicTestOrderLogicIntent } from './ai-clinic-test-order-dispatch.util.js';
import type { ClinicTestOrderDispatchContext } from './ai-clinic-test-order-dispatch.build.js';

@Injectable()
export class AiClinicTestOrderService {
  private readonly deps: ClinicTestOrderLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(ClinicTestType) testTypeRepo: Repository<ClinicTestType>,
    @InjectRepository(ClinicTestPanel)
    testPanelRepo: Repository<ClinicTestPanel>,
    clinicTestOrderService: ClinicTestOrderService,
    clinicLabAccessService: ClinicLabAccessService,
  ) {
    this.deps = {
      businessRepo,
      bookingRepo,
      testTypeRepo,
      testPanelRepo,
      clinicTestOrderService,
      clinicLabAccessService,
    };
  }

  handleCreateTestOrder(
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    confirmed = false,
  ): Promise<CommandResult> {
    return handleCreateTestOrderLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
      confirmed,
    );
  }

  handleListTestOrders(
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleListTestOrdersLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a clinic-test-order intent. */
  dispatchIntent(
    ctx: ClinicTestOrderDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchClinicTestOrderLogicIntent(this.deps, ctx);
  }
}
