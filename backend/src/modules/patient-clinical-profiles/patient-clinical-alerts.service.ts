import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { isClinicLabBookingRequestPending } from '../../common/utils/clinic-lab-booking-request.util.js';
import type { ClinicPatientAlertType } from '../../common/utils/clinic-patient-alert.types.js';
import {
  mergePatientChartAlerts,
  type ClinicPatientAlertDismissalKey,
  type ClinicPatientAlertIntakeCandidate,
  type ClinicPatientAlertLabBookingRequestCandidate,
  type ClinicPatientAlertResultCandidate,
} from '../../common/utils/clinic-patient-alert.util.js';
import { ClinicPreVisitIntake } from '../clinic-pre-visit-intakes/entities/clinic-pre-visit-intake.entity.js';
import { ClinicTestOrder } from '../clinic-test-results/entities/clinic-test-order.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ClinicQuestionnaire } from '../clinic-questionnaires/entities/clinic-questionnaire.entity.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { BusinessService } from '../business/business.service.js';
import { ClinicPatientAlertDismissal } from './entities/clinic-patient-alert-dismissal.entity.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';

@Injectable()
export class PatientClinicalAlertsService {
  constructor(
    @InjectRepository(ClinicPatientAlertDismissal)
    private readonly dismissalRepo: Repository<ClinicPatientAlertDismissal>,
    @InjectRepository(ClinicTestResult)
    private readonly resultRepo: Repository<ClinicTestResult>,
    @InjectRepository(ClinicPreVisitIntake)
    private readonly intakeRepo: Repository<ClinicPreVisitIntake>,
    @InjectRepository(ClinicTestOrder)
    private readonly orderRepo: Repository<ClinicTestOrder>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    private readonly businessService: BusinessService,
    private readonly accessService: PatientClinicalProfileAccessService,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  private async loadAlertContext(
    businessId: string,
    customerId: string,
  ): Promise<{
    results: ClinicPatientAlertResultCandidate[];
    intakes: ClinicPatientAlertIntakeCandidate[];
    labBookingRequests: ClinicPatientAlertLabBookingRequestCandidate[];
    dismissals: ClinicPatientAlertDismissalKey[];
  }> {
    const [results, intakes, labOrders, dismissals] = await Promise.all([
      this.resultRepo.find({
        where: { businessId, customerId, status: 'Released' },
        relations: { testType: true, order: true },
        order: { releasedAt: 'DESC' },
      }),
      this.intakeRepo
        .createQueryBuilder('intake')
        .innerJoin(
          ClinicQuestionnaire,
          'questionnaire',
          'questionnaire.id = intake.questionnaireId',
        )
        .where('intake.businessId = :businessId', { businessId })
        .andWhere('intake.customerId = :customerId', { customerId })
        .select([
          'intake.id AS id',
          'intake.bookingId AS "bookingId"',
          'intake.status AS status',
          'intake.updatedAt AS "updatedAt"',
          'questionnaire.title AS "questionnaireTitle"',
        ])
        .orderBy('intake.updatedAt', 'DESC')
        .getRawMany<{
          id: string;
          bookingId: string | null;
          status: string;
          updatedAt: Date;
          questionnaireTitle: string;
        }>(),
      this.orderRepo.find({
        where: {
          businessId,
          customerId,
          status: In(['NotCollected', 'Collecting', 'AwaitingResults']),
        },
        order: { bookingRequestPushedAt: 'DESC' },
      }),
      this.dismissalRepo.find({
        where: { businessId, customerId },
      }),
    ]);

    const collectionServiceIds = [
      ...new Set(
        labOrders
          .map((order) => order.collectionServiceId)
          .filter((id): id is string => !!id),
      ),
    ];
    const collectionServices =
      collectionServiceIds.length > 0
        ? await this.serviceRepo.find({
            where: { id: In(collectionServiceIds) },
          })
        : [];
    const collectionServiceNameById = new Map(
      collectionServices.map((service) => [service.id, service.name]),
    );

    return {
      results: results.map((result) => ({
        id: result.id,
        bookingId: result.bookingId ?? null,
        testName: result.testType?.title ?? result.order?.displayNames ?? null,
        releasedAt: result.releasedAt ?? null,
        patientVisibility: result.patientVisibility ?? null,
        status: result.status,
      })),
      intakes: intakes.map((intake) => ({
        id: intake.id,
        bookingId: intake.bookingId ?? null,
        questionnaireTitle: intake.questionnaireTitle,
        status: intake.status,
        updatedAt: new Date(intake.updatedAt),
      })),
      labBookingRequests: labOrders
        .filter((order) => isClinicLabBookingRequestPending(order))
        .map((order) => ({
          id: order.id,
          bookingId: order.bookingId ?? null,
          displayNames: order.displayNames ?? null,
          collectionServiceName: order.collectionServiceId
            ? (collectionServiceNameById.get(order.collectionServiceId) ?? null)
            : null,
          status: order.status,
          bookingRequestPushedAt: order.bookingRequestPushedAt ?? null,
          collectionBookingId: order.collectionBookingId ?? null,
        })),
      dismissals: dismissals.map((entry) => ({
        alertType: entry.alertType,
        sourceId: entry.sourceId,
      })),
    };
  }

  async listAlertsForCustomer(
    businessId: string,
    customerId: string,
    userId: string,
  ) {
    await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      customerId,
    );
    await this.assertEnabled(businessId);

    const context = await this.loadAlertContext(businessId, customerId);
    return mergePatientChartAlerts(context);
  }

  /** Customer account — public web + consumer app (vert-clinic-2.gap-2). */
  async listAlertsForCustomerAccount(businessId: string, customerId: string) {
    await this.assertEnabled(businessId);
    const context = await this.loadAlertContext(businessId, customerId);
    return mergePatientChartAlerts(context);
  }

  async dismissAlert(
    businessId: string,
    customerId: string,
    userId: string,
    alertType: ClinicPatientAlertType,
    sourceId: string,
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      customerId,
    );
    await this.assertEnabled(businessId);

    return this.persistDismissal(
      businessId,
      customerId,
      alertType,
      sourceId,
      access.ctx.employeeId,
    );
  }

  /** Customer self-dismiss — public web + consumer app (vert-clinic-2.gap-2). */
  async dismissAlertForCustomerAccount(
    businessId: string,
    customerId: string,
    alertType: ClinicPatientAlertType,
    sourceId: string,
  ) {
    await this.assertEnabled(businessId);
    return this.persistDismissal(
      businessId,
      customerId,
      alertType,
      sourceId,
      null,
    );
  }

  private async persistDismissal(
    businessId: string,
    customerId: string,
    alertType: ClinicPatientAlertType,
    sourceId: string,
    dismissedByEmployeeId: string | null,
  ) {
    await this.assertAlertSourceExists(
      businessId,
      customerId,
      alertType,
      sourceId,
    );

    const existing = await this.dismissalRepo.findOne({
      where: { businessId, customerId, alertType, sourceId },
    });
    if (existing) {
      return { dismissed: true, id: existing.id };
    }

    const saved = await this.dismissalRepo.save(
      this.dismissalRepo.create({
        businessId,
        customerId,
        alertType,
        sourceId,
        dismissedByEmployeeId,
        dismissedAt: new Date(),
      }),
    );

    return { dismissed: true, id: saved.id };
  }

  private async assertAlertSourceExists(
    businessId: string,
    customerId: string,
    alertType: ClinicPatientAlertType,
    sourceId: string,
  ) {
    if (alertType === 'TestResultReleased') {
      const result = await this.resultRepo.findOne({
        where: {
          id: sourceId,
          businessId,
          customerId,
          status: 'Released',
        },
      });
      if (!result) {
        throw new NotFoundException('Lab result alert source not found');
      }
      return;
    }

    if (alertType === 'LabBookingRequestPending') {
      const order = await this.orderRepo.findOne({
        where: { id: sourceId, businessId, customerId },
      });
      if (!order || !isClinicLabBookingRequestPending(order)) {
        throw new NotFoundException(
          'Lab booking request alert source not found',
        );
      }
      return;
    }

    const intake = await this.intakeRepo.findOne({
      where: { id: sourceId, businessId, customerId },
    });
    if (
      !intake ||
      (intake.status !== 'assigned' && intake.status !== 'in_progress')
    ) {
      throw new NotFoundException('Intake alert source not found');
    }
  }
}
