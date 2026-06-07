import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import type { ClinicPatientChartOrderView } from '../clinic-test-results/order/clinic-test-order.service.js';
import { ClinicTestOrderService } from '../clinic-test-results/order/clinic-test-order.service.js';
import type { ClinicPatientChartResultView } from '../clinic-test-results/test-result/clinic-test-result.service.js';
import { ClinicTestResultService } from '../clinic-test-results/test-result/clinic-test-result.service.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { BusinessService } from '../business/business.service.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { PatientClinicalProfilesService } from './patient-clinical-profiles.service.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';
import {
  isPatientChartPendingOrderStatus,
  isPatientChartPendingResultStatus,
  PATIENT_CHART_RECENT_VISITS_LIMIT,
  type PatientChartSummaryView,
} from './patient-chart-summary.util.js';

export type { PatientChartSummaryView } from './patient-chart-summary.util.js';

@Injectable()
export class PatientChartService {
  constructor(
    private readonly businessService: BusinessService,
    private readonly accessService: PatientClinicalProfileAccessService,
    private readonly profilesService: PatientClinicalProfilesService,
    private readonly orderService: ClinicTestOrderService,
    private readonly resultService: ClinicTestResultService,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  async listOrdersForCustomer(
    businessId: string,
    customerId: string,
    userId: string,
  ): Promise<ClinicPatientChartOrderView[]> {
    await this.assertEnabled(businessId);
    await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      customerId,
    );
    return this.orderService.listOrdersForCustomer(businessId, customerId);
  }

  async listResultsForCustomer(
    businessId: string,
    customerId: string,
    userId: string,
  ): Promise<ClinicPatientChartResultView[]> {
    await this.assertEnabled(businessId);
    await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      customerId,
    );
    return this.resultService.listResultsForCustomer(businessId, customerId);
  }

  async getChartSummaryForCustomer(
    businessId: string,
    customerId: string,
    userId: string,
  ): Promise<PatientChartSummaryView> {
    await this.assertEnabled(businessId);
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      customerId,
    );

    const [customer, profile, bookings, results, orders] = await Promise.all([
      this.customerRepo.findOne({
        where: { id: customerId, businessId, isActive: true },
      }),
      this.profilesService.getProfileForCustomer(
        businessId,
        customerId,
        access,
      ),
      this.bookingRepo.find({
        where: { businessId, customerId },
        relations: { service: true, employee: true },
        order: { startTime: 'DESC' },
        take: PATIENT_CHART_RECENT_VISITS_LIMIT + 10,
      }),
      this.resultService.listResultsForCustomer(businessId, customerId),
      this.orderService.listOrdersForCustomer(businessId, customerId),
    ]);

    const recentVisits = bookings
      .filter((booking) => booking.status !== BookingStatus.CANCELLED)
      .slice(0, PATIENT_CHART_RECENT_VISITS_LIMIT)
      .map((booking) => ({
        bookingId: booking.id,
        startTime: booking.startTime.toISOString(),
        status: booking.status,
        serviceName: booking.service?.name ?? null,
        employeeName: booking.employee?.name ?? null,
      }));

    const pendingResults = results
      .filter((result) => isPatientChartPendingResultStatus(result.status))
      .map((result) => ({
        id: result.id,
        testName: result.testName,
        status: result.status,
        orderId: result.orderId,
        bookingId: result.bookingId,
      }));

    const pendingOrders = orders
      .filter((order) => isPatientChartPendingOrderStatus(order.status))
      .map((order) => ({
        id: order.id,
        displayNames: order.displayNames,
        status: order.status,
        bookingId: order.bookingId,
      }));

    return {
      customerId,
      customerName: customer?.name ?? null,
      allergies: profile.allergies,
      chronicProblems: profile.chronicProblems,
      bloodType: profile.bloodType,
      ...(profile.phiMasked ? { phiMasked: true } : {}),
      recentVisits,
      pendingResults,
      pendingOrders,
    };
  }
}
