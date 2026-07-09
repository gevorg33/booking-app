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
}
