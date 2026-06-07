import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  adaptInboundClinicLabSyncObservationRequest,
  mapAbnormalFlagToMeasurementFlag,
  matchObservationToMeasurementByCode,
  type AdaptedClinicLabSyncObservationRequest,
} from '../../common/utils/clinic-lab-sync-observation.adapter.util.js';
import {
  canIngestClinicLabSyncObservations,
  canLinkClinicLabSyncObservations,
  canListClinicLabRegistry,
} from '../../common/utils/clinic-lab-sync-access.util.js';
import type { ClinicLabStaffContext } from '../../common/utils/clinic-lab-access.util.js';
import type { ClinicResultMeasurementFlag } from '../../common/utils/clinic-lab-state.util.js';
import { BusinessService } from '../business/business.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { ClinicTestResultMeasurement } from '../clinic-test-results/entities/clinic-test-result-measurement.entity.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { mapClinicLabSyncObservationRequestView } from './clinic-lis-map.util.js';
import type {
  IngestClinicLabSyncObservationRequestDto,
  LinkClinicLabSyncObservationRequestDto,
  ListClinicLabSyncObservationRequestsQueryDto,
} from './dto/clinic-lis.dto.js';
import { ClinicLabInfo } from './entities/clinic-lab-info.entity.js';
import { ClinicLabSyncObservationRequest } from './entities/clinic-lab-sync-observation-request.entity.js';
import { ClinicLabSyncObservationResult } from './entities/clinic-lab-sync-observation-result.entity.js';

@Injectable()
export class ClinicLabSyncObservationService {
  constructor(
    @InjectRepository(ClinicLabSyncObservationRequest)
    private readonly requestRepo: Repository<ClinicLabSyncObservationRequest>,
    @InjectRepository(ClinicLabSyncObservationResult)
    private readonly resultRepo: Repository<ClinicLabSyncObservationResult>,
    @InjectRepository(ClinicLabInfo)
    private readonly labInfoRepo: Repository<ClinicLabInfo>,
    @InjectRepository(ClinicTestResult)
    private readonly clinicTestResultRepo: Repository<ClinicTestResult>,
    @InjectRepository(ClinicTestResultMeasurement)
    private readonly measurementRepo: Repository<ClinicTestResultMeasurement>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly businessService: BusinessService,
  ) {}

  private async assertEnabled(businessId: string) {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  private async resolveStaffContext(
    businessId: string,
    userId: string,
  ): Promise<ClinicLabStaffContext> {
    const membership = await this.businessService.ensureMember(
      businessId,
      userId,
    );
    const employee = await this.employeeRepo.findOne({
      where: { businessId, userId, isActive: true },
      select: { id: true },
    });
    return {
      userId,
      membershipRole: membership.role,
      employeeId: employee?.id ?? null,
    };
  }

  private async assertListAccess(businessId: string, userId: string) {
    await this.assertEnabled(businessId);
    const ctx = await this.resolveStaffContext(businessId, userId);
    if (!canListClinicLabRegistry(ctx)) {
      throw new ForbiddenException(
        'You do not have access to clinic lab sync records',
      );
    }
    return ctx;
  }

  async listObservationRequests(
    businessId: string,
    userId: string,
    query: ListClinicLabSyncObservationRequestsQueryDto,
  ) {
    await this.assertListAccess(businessId, userId);
    const where: Record<string, unknown> = { businessId };
    if (query.status) where.status = query.status;

    const requests = await this.requestRepo.find({
      where,
      relations: { observations: true },
      order: { systemReceivedOn: 'DESC' },
      take: 100,
    });
    return requests.map(mapClinicLabSyncObservationRequestView);
  }

  async ingestObservationRequest(
    businessId: string,
    userId: string,
    dto: IngestClinicLabSyncObservationRequestDto,
  ) {
    const ctx = await this.assertListAccess(businessId, userId);
    if (!canIngestClinicLabSyncObservations(ctx)) {
      throw new ForbiddenException(
        'You do not have permission to ingest lab sync observations',
      );
    }

    let adapted;
    try {
      adapted = adaptInboundClinicLabSyncObservationRequest(dto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Invalid lab sync observation payload',
      );
    }

    const savedRequest = await this.ingestAdaptedObservationRequest(
      businessId,
      adapted,
    );
    return mapClinicLabSyncObservationRequestView(savedRequest);
  }

  async ingestAdaptedObservationRequest(
    businessId: string,
    adapted: AdaptedClinicLabSyncObservationRequest,
  ) {
    await this.assertEnabled(businessId);

    if (adapted.labInfoId) {
      const lab = await this.labInfoRepo.findOne({
        where: { id: adapted.labInfoId, businessId },
      });
      if (!lab)
        throw new BadRequestException('Lab not found for sync observation');
    }

    const savedRequest = await this.requestRepo.save(
      this.requestRepo.create({
        businessId,
        labInfoId: adapted.labInfoId,
        testName: adapted.testName,
        universalCode: adapted.universalCode,
        patientFirstName: adapted.patientFirstName,
        patientMiddleName: adapted.patientMiddleName,
        patientLastName: adapted.patientLastName,
        patientDateOfBirth: adapted.patientDateOfBirth,
        patientExternalId: adapted.patientExternalId,
        patientAddress: adapted.patientAddress,
        patientPostalCode: adapted.patientPostalCode,
        patientPhone: adapted.patientPhone,
        patientSexAtBirth: adapted.patientSexAtBirth,
        systemReceivedOn: adapted.systemReceivedOn,
        specimenReceivedOn: adapted.specimenReceivedOn,
        observationDate: adapted.observationDate,
        placerOrderNumber: adapted.placerOrderNumber,
        orderingProvider: adapted.orderingProvider,
        fillerOrderNumber: adapted.fillerOrderNumber,
        diagnosticServiceSectionId: adapted.diagnosticServiceSectionId,
        vendorResultStatus: adapted.vendorResultStatus,
        department: adapted.department,
        revisionId: adapted.revisionId,
        integrationVendorCode: adapted.integrationVendorCode,
        status: adapted.status,
      }),
    );

    await this.resultRepo.save(
      adapted.observations.map((observation) =>
        this.resultRepo.create({
          observationRequestId: savedRequest.id,
          testName: observation.testName,
          universalCode: observation.universalCode,
          resultValue: observation.resultValue,
          labComment: observation.labComment,
          vendorResultStatus: observation.vendorResultStatus,
          observationDate: observation.observationDate,
          producerId: observation.producerId,
          producerText: observation.producerText,
          unit: observation.unit,
          referenceRange: observation.referenceRange,
          abnormalFlags: observation.abnormalFlags,
          revisionId: observation.revisionId,
        }),
      ),
    );

    const refreshed = await this.requestRepo.findOne({
      where: { id: savedRequest.id },
      relations: { observations: true },
    });
    return refreshed ?? savedRequest;
  }

  async linkObservationRequestToResult(
    businessId: string,
    userId: string,
    observationRequestId: string,
    dto: LinkClinicLabSyncObservationRequestDto,
  ) {
    const ctx = await this.assertListAccess(businessId, userId);
    if (!canLinkClinicLabSyncObservations(ctx)) {
      throw new ForbiddenException(
        'You do not have permission to link lab sync observations',
      );
    }

    const request = await this.requestRepo.findOne({
      where: { id: observationRequestId, businessId },
      relations: { observations: true },
    });
    if (!request)
      throw new NotFoundException('Lab sync observation request not found');
    if (request.status !== 'Unlinked') {
      throw new BadRequestException(
        'Only unlinked observation requests can be linked',
      );
    }

    const testResult = await this.clinicTestResultRepo.findOne({
      where: { id: dto.clinicTestResultId, businessId },
      relations: { measurements: { testType: true } },
    });
    if (!testResult)
      throw new NotFoundException('Clinic test result not found');

    const measurements = testResult.measurements ?? [];
    if (measurements.length === 0) {
      throw new BadRequestException(
        'Clinic test result has no measurements to link',
      );
    }

    for (const observation of request.observations ?? []) {
      const measurement = measurements.find((item) =>
        matchObservationToMeasurementByCode({
          observationUniversalCode: observation.universalCode,
          measurementTestTypeCode: item.testType?.code ?? '',
        }),
      );
      if (!measurement) continue;

      measurement.value = observation.resultValue;
      measurement.labComment =
        observation.labComment ?? measurement.labComment ?? null;
      measurement.measurementFlag = (mapAbnormalFlagToMeasurementFlag(
        observation.abnormalFlags,
      ) ??
        measurement.measurementFlag ??
        null) as ClinicResultMeasurementFlag | null;
      measurement.receivedAt = observation.observationDate ?? new Date();
      await this.measurementRepo.save(measurement);

      observation.clinicTestResultMeasurementId = measurement.id;
      await this.resultRepo.save(observation);
    }

    request.status = 'Linked';
    request.clinicTestResultId = testResult.id;
    request.linkMethod = 'Manual';
    request.linkedByEmployeeId = ctx.employeeId;
    request.linkedAt = new Date();
    const saved = await this.requestRepo.save(request);

    const refreshed = await this.requestRepo.findOne({
      where: { id: saved.id },
      relations: { observations: true },
    });
    return mapClinicLabSyncObservationRequestView(refreshed ?? saved);
  }
}
