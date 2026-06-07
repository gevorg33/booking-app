import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  canTransitionClinicSpecimen,
  type ClinicSpecimenStatus,
} from '../../../common/utils/clinic-lab-state.util.js';
import { BusinessService } from '../../business/business.service.js';
import { ClinicSpecimen } from '../entities/clinic-specimen.entity.js';
import { ClinicSpecimenStatusHistory } from '../entities/clinic-specimen-status-history.entity.js';
import { ClinicLabPhiService } from '../shared/clinic-lab-phi.service.js';
import { ClinicTaskAutoService } from '../../clinic-tasks/clinic-task-auto.service.js';

export interface TransitionClinicSpecimenInput {
  businessId: string;
  specimenId: string;
  toStatus: ClinicSpecimenStatus;
  employeeId?: string | null;
  note?: string | null;
  v1ShortPath?: boolean;
}

@Injectable()
export class ClinicSpecimenStatusService {
  constructor(
    @InjectRepository(ClinicSpecimen)
    private readonly specimenRepo: Repository<ClinicSpecimen>,
    @InjectRepository(ClinicSpecimenStatusHistory)
    private readonly historyRepo: Repository<ClinicSpecimenStatusHistory>,
    private readonly businessService: BusinessService,
    private readonly clinicLabPhiService: ClinicLabPhiService,
    @Optional() private readonly clinicTaskAutoService?: ClinicTaskAutoService,
  ) {}

  async transitionSpecimenStatus(
    input: TransitionClinicSpecimenInput,
  ): Promise<ClinicSpecimen> {
    const specimen = await this.specimenRepo.findOne({
      where: { id: input.specimenId, businessId: input.businessId },
    });
    if (!specimen) {
      throw new NotFoundException('Clinic specimen not found');
    }

    const fromStatus = specimen.status;
    if (fromStatus === input.toStatus) {
      return specimen;
    }

    if (
      !canTransitionClinicSpecimen(fromStatus, input.toStatus, {
        v1ShortPath: input.v1ShortPath,
      })
    ) {
      throw new BadRequestException(
        `Invalid clinic specimen transition: ${fromStatus} → ${input.toStatus}`,
      );
    }

    specimen.status = input.toStatus;
    const now = new Date();
    if (input.toStatus === 'Collected') {
      specimen.collectedAt = now;
      specimen.collectedByEmployeeId = input.employeeId ?? null;
    } else if (input.toStatus === 'ReceivedInLab') {
      specimen.receivedInLabAt = now;
    } else if (input.toStatus === 'Rejected') {
      specimen.rejectedAt = now;
    }

    await this.specimenRepo.save(specimen);

    const business = await this.businessService.findOne(input.businessId);
    const encryptedNote =
      await this.clinicLabPhiService.encryptStatusHistoryNoteForStorage(
        business,
        input.note,
      );

    await this.historyRepo.save(
      this.historyRepo.create({
        specimenId: specimen.id,
        status: input.toStatus,
        previousStatus: fromStatus,
        employeeId: input.employeeId ?? null,
        note: encryptedNote ?? null,
      }),
    );

    await this.clinicTaskAutoService?.handleSpecimenStatusTransition(
      input.businessId,
      specimen.id,
      fromStatus,
      input.toStatus,
    );

    return specimen;
  }
}
