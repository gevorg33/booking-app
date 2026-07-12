import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { BusinessService } from '../business/business.service.js';
import { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  dispatchProviderExp2Intent,
  type ProviderExp2LogicDeps,
} from './ai-provider-exp-2.logic.js';
import { rescueProviderExp2Intent } from './ai-provider-exp-2.util.js';

@Injectable()
export class AiProviderExp2Service {
  private readonly deps: ProviderExp2LogicDeps;

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private businessService: BusinessService,
    private providerMobile: ProviderMobileService,
    private reviewsService: ReviewsService,
    private configService: ConfigService,
  ) {
    this.deps = {
      bookingRepo: this.bookingRepo,
      businessService: this.businessService,
      providerMobile: this.providerMobile,
      reviewsService: this.reviewsService,
      configService: this.configService,
    };
  }

  rescueProviderExp2Intent(prompt: string, action: string) {
    return rescueProviderExp2Intent(prompt, action);
  }

  handleIntent(
    businessId: string,
    userId: string,
    action: string,
    params: Record<string, unknown>,
    prompt?: string,
    context?: Record<string, unknown>,
  ): Promise<CommandResult | null> {
    return dispatchProviderExp2Intent(
      this.deps,
      businessId,
      userId,
      action,
      params,
      prompt,
      context,
    );
  }
}
