import { Injectable } from '@nestjs/common';
import type { CommandResult } from './command-completion.types.js';
import { handleResumeBookingDraftLogic } from './ai-resume-booking-draft.logic.js';

@Injectable()
export class AiResumeBookingDraftService {
  handleResumeBookingDraft(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleResumeBookingDraftLogic(businessId, params, prompt);
  }
}
