import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { BusinessService } from '../business/business.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  dispatchProviderExp3Intent,
  type ProviderExp3LogicDeps,
} from './ai-provider-exp-3.logic.js';
import { rescueProviderExp3Intent } from './ai-provider-exp-3.util.js';
import { AiRetailFinanceService } from './ai-retail-finance.service.js';
import { AiProviderTimeOffService } from './ai-provider-time-off.service.js';

@Injectable()
export class AiProviderExp3Service {
  private readonly deps: ProviderExp3LogicDeps;

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private businessService: BusinessService,
    private providerMobile: ProviderMobileService,
    private retailFinance: AiRetailFinanceService,
    private providerTimeOff: AiProviderTimeOffService,
    private notificationsService: NotificationsService,
  ) {
    this.deps = {
      bookingRepo: this.bookingRepo,
      businessService: this.businessService,
      providerMobile: this.providerMobile,
      retailFinance: this.retailFinance,
      providerTimeOff: this.providerTimeOff,
      notificationsService: this.notificationsService,
    };
  }

  rescueProviderExp3Intent(prompt: string, action: string) {
    return rescueProviderExp3Intent(prompt, action);
  }

  handleIntent(
    businessId: string,
    userId: string,
    action: string,
    params: Record<string, unknown>,
    prompt?: string,
    context?: Record<string, unknown>,
    employeeId?: string,
  ): Promise<CommandResult | null> {
    return dispatchProviderExp3Intent(
      this.deps,
      businessId,
      userId,
      action,
      params,
      prompt,
      context,
      employeeId,
    );
  }
}
