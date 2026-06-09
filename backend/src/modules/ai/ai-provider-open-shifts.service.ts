import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { handleSuggestWaitlistForGapLogic } from './ai-provider-open-shifts.logic.js';
import {
  PROVIDER_OPEN_SHIFTS_INTENTS,
  rescueProviderOpenShiftsIntent,
} from './ai-provider-open-shifts.util.js';

@Injectable()
export class AiProviderOpenShiftsService {
  constructor(
    private businessService: BusinessService,
    @InjectRepository(SchedulingPeriod)
    private periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}

  rescueProviderOpenShiftsIntent(prompt: string, action: string) {
    return rescueProviderOpenShiftsIntent(prompt, action);
  }

  async handleIntent(
    businessId: string,
    action: string,
    prompt: string,
    params: Record<string, unknown>,
    employeeId?: string,
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
          {
            businessService: this.businessService,
            periodRepo: this.periodRepo,
            customerRepo: this.customerRepo,
          },
          businessId,
          employeeId,
          prompt,
          params,
        );
      default:
        return null;
    }
  }
}
