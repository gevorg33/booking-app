import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Booking,
} from '../booking/entities/booking.entity.js';
import { CommissionsService } from '../commissions/commissions.service.js';
import { BusinessService } from '../business/business.service.js';
import { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  dispatchProviderEarningsIntent,
  type ProviderEarningsLogicDeps,
} from './ai-provider-earnings.logic.js';
import { rescueProviderEarningsIntent } from './ai-provider-earnings.util.js';

@Injectable()
export class AiProviderEarningsService {
  private readonly deps: ProviderEarningsLogicDeps;

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private commissionsService: CommissionsService,
    private businessService: BusinessService,
    private providerMobile: ProviderMobileService,
  ) {
    this.deps = {
      bookingRepo: this.bookingRepo,
      commissionsService: this.commissionsService,
      businessService: this.businessService,
      providerMobile: this.providerMobile,
    };
  }

  rescueProviderEarningsIntent(prompt: string, action: string) {
    return rescueProviderEarningsIntent(prompt, action);
  }

  handleIntent(
    businessId: string,
    userId: string,
    action: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult | null> {
    return dispatchProviderEarningsIntent(
      this.deps,
      businessId,
      userId,
      action,
      params,
      prompt,
    );
  }
}
