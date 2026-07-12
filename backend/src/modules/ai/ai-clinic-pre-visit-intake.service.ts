import { Injectable } from '@nestjs/common';
import { ClinicPreVisitIntakeService } from '../clinic-pre-visit-intakes/clinic-pre-visit-intake.service.js';
import {
  rescueClinicPreVisitIntakeIntent,
  isAssignPreVisitIntakeToBookingPrompt,
} from './ai-clinic-pre-visit-intake.util.js';
import {
  handleAssignPreVisitIntakeToBookingLogic,
  handleStaffSubmitIntakeAnswersLogic,
  type ClinicPreVisitIntakeLogicDeps,
} from './ai-clinic-pre-visit-intake.logic.js';
import type { CommandResult } from './command-completion.types.js';
import { dispatchClinicPreVisitIntakeLogicIntent } from './ai-clinic-pre-visit-intake-dispatch.util.js';
import type { ClinicPreVisitIntakeDispatchContext } from './ai-clinic-pre-visit-intake-dispatch.build.js';

@Injectable()
export class AiClinicPreVisitIntakeService {
  private readonly deps: ClinicPreVisitIntakeLogicDeps;

  constructor(intakeService: ClinicPreVisitIntakeService) {
    this.deps = { intakeService };
  }

  rescueClinicPreVisitIntakeIntent(prompt: string, action: string) {
    return rescueClinicPreVisitIntakeIntent(prompt, action);
  }

  isAssignPreVisitIntakeToBookingPrompt(prompt: string) {
    return isAssignPreVisitIntakeToBookingPrompt(prompt);
  }

  handleAssignPreVisitIntakeToBooking(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ) {
    return handleAssignPreVisitIntakeToBookingLogic(
      this.deps,
      businessId,
      userId,
      params,
    );
  }

  handleStaffSubmitIntakeAnswers(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ) {
    return handleStaffSubmitIntakeAnswersLogic(
      this.deps,
      businessId,
      userId,
      params,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a clinic-pre-visit-intake intent. */
  dispatchIntent(
    ctx: ClinicPreVisitIntakeDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchClinicPreVisitIntakeLogicIntent(this.deps, ctx);
  }
}
