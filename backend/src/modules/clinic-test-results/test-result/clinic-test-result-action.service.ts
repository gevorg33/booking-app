import { Injectable } from '@nestjs/common';
import { ClinicTestResult } from '../entities/clinic-test-result.entity.js';
import { ClinicTestResultStatusService } from './clinic-test-result-status.service.js';

export interface MarkClinicTestResultReleasedInput {
  businessId: string;
  resultId: string;
  employeeId?: string | null;
  comment?: string | null;
}

export interface MarkClinicTestResultReviewedInput {
  businessId: string;
  resultId: string;
  employeeId?: string | null;
  comment?: string | null;
}

/** Pollin `TestResultActionService` — review/release mutations via state machine guards. */
@Injectable()
export class ClinicTestResultActionService {
  constructor(
    private readonly clinicTestResultStatusService: ClinicTestResultStatusService,
  ) {}

  async markAsReleased(
    input: MarkClinicTestResultReleasedInput,
  ): Promise<ClinicTestResult> {
    return this.clinicTestResultStatusService.transitionResultStatus({
      businessId: input.businessId,
      resultId: input.resultId,
      toStatus: 'Released',
      employeeId: input.employeeId,
      note: input.comment,
    });
  }

  async markAsReviewed(
    input: MarkClinicTestResultReviewedInput,
  ): Promise<ClinicTestResult> {
    return this.clinicTestResultStatusService.transitionResultStatus({
      businessId: input.businessId,
      resultId: input.resultId,
      toStatus: 'Reviewed',
      employeeId: input.employeeId,
      note: input.comment,
    });
  }
}
