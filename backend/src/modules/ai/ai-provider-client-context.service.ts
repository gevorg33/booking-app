import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  dispatchProviderClientContextIntent,
  type ProviderClientContextLogicDeps,
} from './ai-provider-client-context.logic.js';
import { rescueProviderClientContextIntent } from './ai-provider-client-context.util.js';

@Injectable()
export class AiProviderClientContextService {
  private readonly deps: ProviderClientContextLogicDeps;

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>,
    private providerMobile: ProviderMobileService,
  ) {
    this.deps = {
      bookingRepo: this.bookingRepo,
      providerMobile: this.providerMobile,
      giftCardRepo: this.giftCardRepo,
    };
  }

  rescueProviderClientContextIntent(prompt: string, action: string) {
    return rescueProviderClientContextIntent(prompt, action);
  }

  handleIntent(
    businessId: string,
    userId: string,
    action: string,
    params: Record<string, unknown>,
    prompt?: string,
    context?: Record<string, unknown>,
  ): Promise<CommandResult | null> {
    return dispatchProviderClientContextIntent(
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
