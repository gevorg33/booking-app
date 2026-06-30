import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingCheckoutDraft } from '../booking/entities/booking-checkout-draft.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleResumePendingPaymentLogic,
  type ResumePendingPaymentLogicDeps,
} from './ai-resume-pending-payment.logic.js';

@Injectable()
export class AiResumePendingPaymentService {
  private readonly deps: ResumePendingPaymentLogicDeps;

  constructor(
    @InjectRepository(BookingCheckoutDraft)
    draftRepo: Repository<BookingCheckoutDraft>,
  ) {
    this.deps = { draftRepo };
  }

  handleResumePendingPayment(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleResumePendingPaymentLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
