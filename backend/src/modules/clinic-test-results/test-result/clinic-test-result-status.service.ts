import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  canTransitionClinicTestResult,
  type ClinicTestResultStatus,
} from '../../../common/utils/clinic-lab-state.util.js';
import { BusinessService } from '../../business/business.service.js';
import { EventStoreService } from '../../../events/store/event-store.service.js';
import { EventType } from '../../../events/event-types.js';
import { ClinicTestResult } from '../entities/clinic-test-result.entity.js';
import { ClinicTestResultStatusHistory } from '../entities/clinic-test-result-status-history.entity.js';
import { ClinicLabPhiService } from '../shared/clinic-lab-phi.service.js';
import type { PhiStaffContext } from '../../compliance/phi-field.service.js';
import { ClinicTaskAutoService } from '../../clinic-tasks/clinic-task-auto.service.js';

export interface TransitionClinicTestResultInput {
  businessId: string;
  resultId: string;
  toStatus: ClinicTestResultStatus;
  employeeId?: string | null;
  note?: string | null;
  staff?: PhiStaffContext;
}

@Injectable()
export class ClinicTestResultStatusService {
  constructor(
    @InjectRepository(ClinicTestResult)
    private readonly resultRepo: Repository<ClinicTestResult>,
    @InjectRepository(ClinicTestResultStatusHistory)
    private readonly historyRepo: Repository<ClinicTestResultStatusHistory>,
    private readonly businessService: BusinessService,
    private readonly clinicLabPhiService: ClinicLabPhiService,
    private readonly eventStore: EventStoreService,
    @Optional() private readonly clinicTaskAutoService?: ClinicTaskAutoService,
  ) {}

  private applyTransitionComment(
    result: ClinicTestResult,
    toStatus: ClinicTestResultStatus,
    note: string | null | undefined,
  ): void {
    const trimmed = note?.trim();
    if (!trimmed) return;
    if (toStatus === 'Reviewed' || toStatus === 'AutomaticallyReviewed') {
      result.reviewComment = trimmed;
      return;
    }
    if (toStatus === 'Released') {
      result.releaseComment = trimmed;
      return;
    }
    result.comment = trimmed;
  }

  async transitionResultStatus(
    input: TransitionClinicTestResultInput,
  ): Promise<ClinicTestResult> {
    const result = await this.resultRepo.findOne({
      where: { id: input.resultId, businessId: input.businessId },
    });
    if (!result) {
      throw new NotFoundException('Clinic test result not found');
    }

    const beforePhi = {
      comment: result.comment,
      reviewComment: result.reviewComment,
      releaseComment: result.releaseComment,
    };

    const fromStatus = result.status;
    if (fromStatus === input.toStatus) {
      return result;
    }

    if (!canTransitionClinicTestResult(fromStatus, input.toStatus)) {
      throw new BadRequestException(
        `Invalid clinic test result transition: ${fromStatus} → ${input.toStatus}`,
      );
    }

    result.status = input.toStatus;
    const now = new Date();
    if (input.toStatus === 'Completed') {
      result.completedAt = now;
    } else if (
      input.toStatus === 'Reviewed' ||
      input.toStatus === 'AutomaticallyReviewed'
    ) {
      result.reviewedAt = now;
    } else if (input.toStatus === 'Released') {
      result.releasedAt = now;
      result.patientVisibility = 'New';
    }

    this.applyTransitionComment(result, input.toStatus, input.note);

    const business = await this.businessService.findOne(input.businessId);
    const encryptedResult =
      await this.clinicLabPhiService.encryptTestResultForStorage(
        business,
        result,
      );
    Object.assign(result, encryptedResult);

    await this.resultRepo.save(result);
    if (input.staff) {
      await this.clinicLabPhiService.auditTestResultPhiWrite(
        business,
        result,
        beforePhi,
        input.staff,
      );
    }
    const encryptedNote =
      await this.clinicLabPhiService.encryptStatusHistoryNoteForStorage(
        business,
        input.note,
      );

    await this.historyRepo.save(
      this.historyRepo.create({
        resultId: result.id,
        status: input.toStatus,
        previousStatus: fromStatus,
        employeeId: input.employeeId ?? null,
        note: encryptedNote ?? null,
      }),
    );

    if (input.toStatus === 'Released') {
      await this.eventStore.publish({
        eventType: EventType.TEST_RESULT_RELEASED,
        aggregateType: 'clinic_test_result',
        aggregateId: result.id,
        businessId: input.businessId,
        payload: {
          resultId: result.id,
          businessId: input.businessId,
          customerId: result.customerId,
          bookingId: result.bookingId ?? null,
          orderId: result.orderId ?? null,
          testTypeId: result.testTypeId ?? null,
          previousStatus: fromStatus,
          releasedAt: result.releasedAt?.toISOString() ?? now.toISOString(),
        },
        userId: input.employeeId ?? undefined,
      });
    }

    await this.clinicTaskAutoService?.handleResultStatusTransition(
      input.businessId,
      result.id,
      fromStatus,
      input.toStatus,
    );

    return result;
  }
}
