import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import {
  assertClinicLabFeaturesEnabled,
  isClinicLabModuleEnabledForBusinessType,
  readBusinessTypeFromSettings,
} from './shared/clinic-test-results-gate.util.js';
import {
  buildPatientReleasedResultView,
  type ClinicPatientReleasedResultView,
} from '../../common/utils/clinic-patient-released-result.util.js';
import { ClinicLabSyncObservationResult } from '../clinic-lis/entities/clinic-lab-sync-observation-result.entity.js';
import { ClinicTestOrder } from './entities/clinic-test-order.entity.js';
import { ClinicTestResult } from './entities/clinic-test-result.entity.js';
import { ClinicSpecimen } from './entities/clinic-specimen.entity.js';

export interface ClinicBookingLabSummary {
  id: string;
  testName: string;
  orderStatus: string;
  resultStatus?: string;
  specimenStatus?: string;
  measurementFlag?: string;
}

export interface ClinicCustomerResultTrackingView {
  id: string;
  testName: string | null;
  status: string;
  releasedAt: string | null;
  createdAt: string;
}

export type { ClinicPatientReleasedResultView };

@Injectable()
export class ClinicTestResultsService {
  constructor(
    private readonly businessService: BusinessService,
    @InjectRepository(ClinicTestOrder)
    private readonly orderRepo: Repository<ClinicTestOrder>,
    @InjectRepository(ClinicTestResult)
    private readonly resultRepo: Repository<ClinicTestResult>,
    @InjectRepository(ClinicLabSyncObservationResult)
    private readonly observationRepo: Repository<ClinicLabSyncObservationResult>,
    @InjectRepository(ClinicSpecimen)
    private readonly specimenRepo: Repository<ClinicSpecimen>,
  ) {}

  async getModuleStatus(businessId: string) {
    const business = await this.businessService.findOne(businessId);
    const businessType = readBusinessTypeFromSettings(
      business.settings as Record<string, unknown> | undefined,
    );
    return {
      enabled: isClinicLabModuleEnabledForBusinessType(businessType),
      businessType: businessType ?? null,
    };
  }

  async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  async listBookingLabSummaries(
    businessId: string,
    bookingId: string,
  ): Promise<ClinicBookingLabSummary[]> {
    await this.assertEnabled(businessId);

    const orders = await this.orderRepo.find({
      where: { businessId, bookingId },
      order: { createdAt: 'ASC' },
    });
    if (orders.length === 0) {
      return [];
    }

    const orderIds = orders.map((order) => order.id);
    const [results, specimens] = await Promise.all([
      this.resultRepo.find({
        where: { businessId, orderId: In(orderIds) },
        order: { createdAt: 'ASC' },
      }),
      this.specimenRepo.find({
        where: { businessId, orderId: In(orderIds) },
        order: { createdAt: 'ASC' },
      }),
    ]);

    const resultsByOrder = new Map<string, ClinicTestResult>();
    for (const result of results) {
      if (result.orderId && !resultsByOrder.has(result.orderId)) {
        resultsByOrder.set(result.orderId, result);
      }
    }

    const specimensByOrder = new Map<string, ClinicSpecimen>();
    for (const specimen of specimens) {
      if (!specimensByOrder.has(specimen.orderId)) {
        specimensByOrder.set(specimen.orderId, specimen);
      }
    }

    return orders.map((order) => {
      const result = resultsByOrder.get(order.id);
      const specimen = specimensByOrder.get(order.id);
      return {
        id: order.id,
        testName: order.displayNames ?? 'Lab order',
        orderStatus: order.status,
        resultStatus: result?.status,
        specimenStatus: specimen?.status,
        measurementFlag: result?.measurementFlag ?? undefined,
      };
    });
  }

  async listReleasedResultsForCustomer(
    businessId: string,
    customerId: string,
  ): Promise<ClinicPatientReleasedResultView[]> {
    await this.assertEnabled(businessId);

    const results = await this.resultRepo.find({
      where: { businessId, customerId, status: 'Released' },
      relations: {
        order: true,
        testType: true,
        measurements: { testType: true },
      },
      order: { releasedAt: 'DESC', createdAt: 'DESC' },
    });

    const measurementIds = results.flatMap((result) =>
      (result.measurements ?? []).map((measurement) => measurement.id),
    );
    const observations =
      measurementIds.length > 0
        ? await this.observationRepo.find({
            where: { clinicTestResultMeasurementId: In(measurementIds) },
          })
        : [];

    const observationByMeasurementId = new Map<
      string,
      ClinicLabSyncObservationResult
    >();
    for (const observation of observations) {
      if (observation.clinicTestResultMeasurementId) {
        observationByMeasurementId.set(
          observation.clinicTestResultMeasurementId,
          observation,
        );
      }
    }

    return results.map((result) =>
      buildPatientReleasedResultView({
        result,
        observationByMeasurementId,
      }),
    );
  }

  async listCustomerResultsForTracking(
    businessId: string,
    customerId: string,
  ): Promise<ClinicCustomerResultTrackingView[]> {
    await this.assertEnabled(businessId);

    const results = await this.resultRepo.find({
      where: { businessId, customerId },
      relations: { order: true, testType: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return results.map((result) => ({
      id: result.id,
      testName: result.testType?.title ?? result.order?.displayNames ?? null,
      status: result.status,
      releasedAt: result.releasedAt?.toISOString() ?? null,
      createdAt: result.createdAt.toISOString(),
    }));
  }
}
