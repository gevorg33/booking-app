import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { BookingService } from '../booking/booking.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleSuggestWaitlistForGapLogic,
  handleDraftWaitlistOfferMessageLogic,
  handleListWaitlistForMyServicesLogic,
  handleListRebookingCandidatesLogic,
  handleBookWalkInGapLogic,
  type ProviderOpenShiftsLogicDeps,
} from './ai-provider-open-shifts.logic.js';
import {
  PROVIDER_OPEN_SHIFTS_INTENTS,
  rescueProviderOpenShiftsIntent,
} from './ai-provider-open-shifts.util.js';

@Injectable()
export class AiProviderOpenShiftsService {
  private readonly deps: ProviderOpenShiftsLogicDeps;

  constructor(
    private businessService: BusinessService,
    @InjectRepository(SchedulingPeriod)
    private periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private bookingService: BookingService,
  ) {
    this.deps = {
      businessService: this.businessService,
      periodRepo: this.periodRepo,
      customerRepo: this.customerRepo,
      bookingRepo: this.bookingRepo,
      serviceRepo: this.serviceRepo,
      employeeRepo: this.employeeRepo,
      bookingService: this.bookingService,
    };
  }

  rescueProviderOpenShiftsIntent(prompt: string, action: string) {
    return rescueProviderOpenShiftsIntent(prompt, action);
  }

  async handleIntent(
    businessId: string,
    action: string,
    prompt: string,
    params: Record<string, unknown>,
    employeeId?: string,
    userId?: string,
    context?: Record<string, unknown>,
  ): Promise<CommandResult | null> {
    if (
      !PROVIDER_OPEN_SHIFTS_INTENTS.includes(
        action as (typeof PROVIDER_OPEN_SHIFTS_INTENTS)[number],
      ) ||
      !employeeId
    ) {
      return null;
    }

    switch (action) {
      case 'suggest_waitlist_for_gap':
        return handleSuggestWaitlistForGapLogic(
          this.deps,
          businessId,
          employeeId,
          prompt,
          params,
        );
      case 'draft_waitlist_offer_message':
        return handleDraftWaitlistOfferMessageLogic(
          this.deps,
          businessId,
          employeeId,
          prompt,
          params,
        );
      case 'list_waitlist_for_my_services':
        return handleListWaitlistForMyServicesLogic(
          this.deps,
          businessId,
          employeeId,
          prompt,
          params,
        );
      case 'list_rebooking_candidates':
        return handleListRebookingCandidatesLogic(
          this.deps,
          businessId,
          employeeId,
          params,
          context,
        );
      case 'book_walk_in_gap':
        if (!userId) return null;
        return handleBookWalkInGapLogic(
          this.deps,
          businessId,
          employeeId,
          userId,
          prompt,
          params,
        );
      default:
        return null;
    }
  }
}
